import json
import boto3
import uuid
import os
import csv
import io
import pandas as pd
import psycopg2
import requests
from datetime import datetime, date
from botocore.exceptions import ClientError
import decimal

# Initialize S3 client
s3_client = boto3.client('s3')

# Configuration
BUCKET_NAME = 'chartz-datasets'
EXPIRATION_TIME = 3600  # 1 hour

# Database configuration
DB_CONFIG = {
    'host': "chartz-ai.cexryffwmiie.eu-west-2.rds.amazonaws.com",
    'port': "5432",
    'dbname': "chartz",
    'user': "postgres",
    'password': "ppddA4all.P"  # Set via environment variable
}

def json_serializer(obj):
    """JSON serializer for datetime and decimal objects"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, decimal.Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def test_internet_connectivity():
    url = "http://www.google.com"
    timeout = 5
    try:
        _ = requests.get(url, timeout=timeout)
        print("Internet connection is available")
    except requests.ConnectionError:
        print("No internet connection available")

def get_db_connection():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("Connection established against DB")
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        raise

def detect_column_type(series):
    """Detect the best PostgreSQL type for a pandas Series"""
    # Remove nulls for type detection
    non_null_series = series.dropna()
    
    if len(non_null_series) == 0:
        return 'TEXT', 'TEXT'
    
    # Try numeric types first
    try:
        pd.to_numeric(non_null_series)
        # Check if all values are integers
        if all(float(val).is_integer() for val in non_null_series if pd.notna(val)):
            return 'INTEGER', 'INTEGER'
        else:
            return 'DECIMAL', 'DECIMAL'
    except (ValueError, TypeError):
        pass
    
    # Try datetime
    try:
        pd.to_datetime(non_null_series)
        return 'DATE', 'TIMESTAMP WITH TIME ZONE'
    except (ValueError, TypeError):
        pass
    
    # Try boolean
    if set(non_null_series.astype(str).str.lower().unique()).issubset({'true', 'false', '1', '0', 'yes', 'no'}):
        return 'BOOLEAN', 'BOOLEAN'
    
    # Default to text
    return 'TEXT', 'TEXT'

def create_user_table(conn, table_name, columns_info):
    """Create a dynamic table for user's CSV data"""
    cursor = conn.cursor()
    try:
        # Build CREATE TABLE statement
        columns_sql = []
        for col_name, postgres_type in columns_info:
            safe_col_name = col_name.replace(' ', '_').replace('-', '_').lower()
            safe_col_name = ''.join(c for c in safe_col_name if c.isalnum() or c == '_')
            columns_sql.append(f'"{safe_col_name}" {postgres_type}')
        
        create_sql = f"""
        CREATE TABLE "{table_name}" (
            id SERIAL PRIMARY KEY,
            {', '.join(columns_sql)},
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        cursor.execute(create_sql)
        conn.commit()
        print(f"Created table: {table_name}")
        return True
    except psycopg2.Error as e:
        print(f"Error creating table: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def insert_csv_data(conn, table_name, df):
    """Insert CSV data into the user's table"""
    cursor = conn.cursor()
    try:
        # Clean column names
        df.columns = [col.replace(' ', '_').replace('-', '_').lower() for col in df.columns]
        df.columns = [''.join(c for c in col if c.isalnum() or c == '_') for col in df.columns]
        
        # Convert dataframe to list of tuples
        data_tuples = []
        for _, row in df.iterrows():
            data_tuples.append(tuple(row))
        
        # Build INSERT statement
        columns = ', '.join([f'"{col}"' for col in df.columns])
        placeholders = ', '.join(['%s'] * len(df.columns))
        insert_sql = f'INSERT INTO "{table_name}" ({columns}) VALUES ({placeholders})'
        
        # Execute batch insert
        cursor.executemany(insert_sql, data_tuples)
        conn.commit()
        print(f"Inserted {len(data_tuples)} rows into {table_name}")
        return len(data_tuples)
    except psycopg2.Error as e:
        print(f"Error inserting data: {e}")
        conn.rollback()
        return 0
    finally:
        cursor.close()

def ingest_csv_from_s3(s3_key, user_id, original_filename, dataset_id):
    """Main CSV ingestion function"""
    conn = None
    try:
        # Download CSV from S3
        print(f"Downloading CSV from S3: {s3_key}")
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        csv_content = response['Body'].read()
        
        # Parse CSV with pandas
        df = pd.read_csv(io.BytesIO(csv_content))
        print(f"CSV loaded: {len(df)} rows, {len(df.columns)} columns")
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate table name
        cursor.execute("SELECT generate_dataset_table_name(%s, %s)", (user_id, original_filename))
        table_name = cursor.fetchone()[0]
        
        # Analyze column types
        columns_info = []
        column_metadata = []
        for i, col_name in enumerate(df.columns):
            logical_type, postgres_type = detect_column_type(df[col_name])
            columns_info.append((col_name, postgres_type))
            
            # Collect metadata
            non_null_values = df[col_name].dropna()
            column_metadata.append({
                'column_name': col_name,
                'column_index': i,
                'data_type': logical_type,
                'postgres_type': postgres_type,
                'is_nullable': bool(df[col_name].isnull().any()),
                'sample_values': non_null_values.head(5).tolist() if len(non_null_values) > 0 else [],
                'unique_count': int(len(non_null_values.unique())) if len(non_null_values) > 0 else 0
            })
        
        # Create table
        if not create_user_table(conn, table_name, columns_info):
            raise Exception("Failed to create table")
        
        # Insert data
        rows_inserted = insert_csv_data(conn, table_name, df)
        if rows_inserted == 0:
            raise Exception("Failed to insert data")
        
        # Update dataset metadata
        cursor.execute("""
            UPDATE datasets 
            SET table_name = %s,
                row_count = %s,
                column_count = %s,
                ingestion_status = 'completed',
                ingestion_date = CURRENT_TIMESTAMP,
                metadata = %s
            WHERE dataset_id = %s
        """, (table_name, len(df), len(df.columns), json.dumps({'columns': column_metadata}), dataset_id))
        
        # Insert column metadata
        for col_meta in column_metadata:
            cursor.execute("""
                INSERT INTO dataset_columns 
                (dataset_id, column_name, column_index, data_type, postgres_type, 
                 is_nullable, sample_values, unique_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                dataset_id, col_meta['column_name'], col_meta['column_index'],
                col_meta['data_type'], col_meta['postgres_type'], col_meta['is_nullable'],
                json.dumps(col_meta['sample_values']), col_meta['unique_count']
            ))
        
        conn.commit()
        print(f"Successfully ingested CSV into table: {table_name}")
        return {
            'success': True,
            'table_name': table_name,
            'rows_inserted': rows_inserted,
            'columns': len(df.columns)
        }
        
    except Exception as e:
        print(f"CSV ingestion error: {e}")
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE datasets 
                SET ingestion_status = 'failed',
                    error_message = %s
                WHERE dataset_id = %s
            """, (str(e), dataset_id))
            conn.commit()
        return {'success': False, 'error': str(e)}
    finally:
        if conn:
            conn.close()

def handler(event, context):
    print('received event:')
    print(event)
    http_method = event.get('httpMethod')
    test_internet_connectivity()

    conn = None
    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"Database connection failed: {e}")
        # Continue without DB for upload URL generation
    
    # CORS headers
    cors_headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    # Handle preflight OPTIONS request
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        # Parse request body
        body = json.loads(event['body']) if event['body'] else {}
        
        if http_method == 'POST':
            action = body.get('action', 'upload')  # 'upload' or 'ingest'
            print(f"Processing POST request with action: {action}")
            
            if action == 'upload':
                # Generate upload URL (existing functionality)
                user_id = body.get('userId')
                file_name = body.get('fileName')
                file_type = body.get('fileType', 'text/csv')
                
                if not user_id or not file_name:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Missing required parameters: userId and fileName'
                        })
                    }
                
                # Validate file type
                if not file_type.startswith('text/csv') and not file_name.lower().endswith('.csv'):
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Only CSV files are allowed'
                        })
                    }
                
                # Generate unique file key
                file_id = str(uuid.uuid4())
                safe_file_name = file_name.replace(' ', '_').replace('/', '_')
                s3_key = f"{user_id}/{file_id}_{safe_file_name}"
                
                # Create dataset record in database
                dataset_id = str(uuid.uuid4())
                if conn:
                    try:
                        cursor = conn.cursor()
                        
                        # Generate table name first
                        cursor.execute("SELECT generate_dataset_table_name(%s, %s)", (user_id, file_name))
                        table_name = cursor.fetchone()[0]
                        
                        # Insert dataset record (user must already exist)
                        cursor.execute("""
                            INSERT INTO datasets 
                            (dataset_id, user_id, original_filename, s3_key, table_name, ingestion_status)
                            VALUES (%s, %s, %s, %s, %s, 'pending')
                        """, (dataset_id, user_id, file_name, s3_key, table_name))
                        conn.commit()
                    except Exception as e:
                        print(f"Database insert error: {e}")
                        conn.rollback()
                
                # Generate pre-signed POST
                presigned_post = s3_client.generate_presigned_post(
                    Bucket=BUCKET_NAME,
                    Key=s3_key,
                    Fields={
                        'Content-Type': file_type,
                        'x-amz-server-side-encryption': 'aws:kms',
                        'x-amz-server-side-encryption-aws-kms-key-id': 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f',
                        'x-amz-meta-user-id': user_id,
                        'x-amz-meta-original-name': file_name,
                        'x-amz-meta-file-id': file_id,
                        'x-amz-meta-dataset-id': dataset_id
                    },
                    Conditions=[
                        {'Content-Type': file_type},
                        {'x-amz-server-side-encryption': 'aws:kms'},
                        {'x-amz-server-side-encryption-aws-kms-key-id': 'arn:aws:kms:eu-west-2:252326958099:key/602a7058-adf6-48c5-80bf-39ea7956742f'},
                        ['starts-with', '$x-amz-meta-user-id', user_id],
                        ['starts-with', '$x-amz-meta-original-name', ''],
                        ['starts-with', '$x-amz-meta-file-id', ''],
                        ['starts-with', '$x-amz-meta-dataset-id', '']
                    ],
                    ExpiresIn=EXPIRATION_TIME
                )
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'uploadUrl': presigned_post['url'],
                        'fields': presigned_post['fields'],
                        'fileId': file_id,
                        'datasetId': dataset_id,
                        's3Key': s3_key,
                        'expiresIn': EXPIRATION_TIME
                    })
                }
            
            elif action == 'ingest':
                # Ingest CSV from S3 to database
                s3_key = body.get('s3Key')
                user_id = body.get('userId')
                dataset_id = body.get('datasetId')
                original_filename = body.get('originalFilename')
                
                if not all([s3_key, user_id, dataset_id, original_filename]):
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Missing required parameters for ingestion'
                        })
                    }
                
                # Perform ingestion
                result = ingest_csv_from_s3(s3_key, user_id, original_filename, dataset_id)
                
                if result['success']:
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'message': 'CSV ingested successfully',
                            'tableName': result['table_name'],
                            'rowsInserted': result['rows_inserted'],
                            'columns': result['columns']
                        })
                    }
                else:
                    return {
                        'statusCode': 500,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'CSV ingestion failed',
                            'details': result['error']
                        })
                    }
            
            elif action == 'getData':
                # Get data from a user's dataset table
                print(f"getData action triggered")
                dataset_id = body.get('datasetId')
                table_name = body.get('tableName')
                limit = body.get('limit', 1000)  # Default to 1000 rows
                print(f"Parameters: dataset_id={dataset_id}, table_name={table_name}, limit={limit}")
                
                if not dataset_id or not table_name or not conn:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Missing datasetId, tableName, or database connection'
                        })
                    }
                
                try:
                    cursor = conn.cursor()
                    print(f"Created cursor, about to verify dataset exists")
                    
                    # First verify the dataset exists and get table info
                    cursor.execute("""
                        SELECT dataset_id, table_name, row_count, column_count, ingestion_status
                        FROM datasets 
                        WHERE dataset_id = %s AND table_name = %s AND ingestion_status = 'completed'
                    """, (dataset_id, table_name))
                    print(f"Executed dataset verification query")
                    
                    dataset_info = cursor.fetchone()
                    print(f"Dataset verification result: {dataset_info}")
                    if not dataset_info:
                        return {
                            'statusCode': 404,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'error': 'Dataset not found or not completed ingestion'
                            })
                        }
                    
                    # Get column names first
                    print(f"About to query information_schema.columns for table: {table_name}")
                    cursor.execute(f'SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position', (table_name,))
                    column_info = cursor.fetchall()
                    print(f"Column info from information_schema: {column_info}")
                    column_names = [col[0] for col in column_info if col[0] not in ['id', 'created_at']]
                    print(f"Filtered column names: {column_names}")
                    
                    # Get the actual data (excluding id and created_at columns)
                    columns_sql = ', '.join([f'"{col}"' for col in column_names])
                    query = f'SELECT {columns_sql} FROM "{table_name}" LIMIT %s'
                    print(f"About to execute data query: {query} with limit: {limit}")
                    cursor.execute(query, (limit,))
                    print(f"Data query executed successfully")
                    
                    rows = cursor.fetchall()
                    print(f"Fetched {len(rows) if rows else 0} rows from the table")
                    
                    # Convert to list format for JSON serialization
                    data_rows = [list(row) for row in rows]
                    
                    response_data = {
                        'columns': column_names,
                        'rows': data_rows,
                        'totalRows': dataset_info[2],  # row_count from dataset
                        'returnedRows': len(data_rows)
                    }
                    print(f"Returning successful response with {len(column_names)} columns and {len(data_rows)} rows")
                    
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps(response_data, default=json_serializer)
                    }
                
                except Exception as e:
                    print(f"Error fetching dataset data: {e}")
                    return {
                        'statusCode': 500,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Failed to fetch dataset data',
                            'details': str(e)
                        })
                    }
            
            elif action == 'executeSQL':
                # Execute custom SQL query on a dataset table
                print(f"executeSQL action triggered")
                dataset_id = body.get('datasetId')
                table_name = body.get('tableName')
                sql = body.get('sql')
                limit = body.get('limit', 1000)  # Default to 1000 rows
                print(f"Parameters: dataset_id={dataset_id}, table_name={table_name}, sql={sql[:100]}...")
                
                if not dataset_id or not table_name or not sql or not conn:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Missing datasetId, tableName, sql, or database connection'
                        })
                    }
                
                try:
                    cursor = conn.cursor()
                    print(f"Created cursor for executeSQL")
                    
                    # First verify the dataset exists
                    print(f"Verifying dataset exists: {dataset_id}, {table_name}")
                    cursor.execute("""
                        SELECT dataset_id, table_name, ingestion_status
                        FROM datasets 
                        WHERE dataset_id = %s AND table_name = %s AND ingestion_status = 'completed'
                    """, (dataset_id, table_name))
                    
                    dataset_info = cursor.fetchone()
                    print(f"Dataset verification result: {dataset_info}")
                    if not dataset_info:
                        print(f"Dataset not found or not completed")
                        return {
                            'statusCode': 404,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'error': 'Dataset not found or not completed ingestion'
                            })
                        }
                    
                    # Basic SQL safety checks
                    print(f"Starting SQL safety checks")
                    sql_lower = sql.lower().strip()
                    if not sql_lower.startswith('select'):
                        print(f"SQL doesn't start with SELECT")
                        return {
                            'statusCode': 400,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'error': 'Only SELECT queries are allowed'
                            })
                        }
                    
                    # Check for dangerous operations
                    dangerous_keywords = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'grant', 'revoke']
                    found_dangerous = [kw for kw in dangerous_keywords if kw in sql_lower]
                    if found_dangerous:
                        print(f"Found dangerous keywords: {found_dangerous}")
                        return {
                            'statusCode': 400,
                            'headers': cors_headers,
                            'body': json.dumps({
                                'error': 'Query contains forbidden operations'
                            })
                        }
                    
                    # Add LIMIT if not present (safety measure)
                    if 'limit' not in sql_lower:
                        sql = f"{sql} LIMIT {limit}"
                        print(f"Added LIMIT to SQL")
                    
                    print(f"About to execute SQL: {sql[:200]}...")  # Log first 200 chars
                    print(f"SQL safety checks passed, executing query")
                    cursor.execute(sql)
                    print(f"SQL execution completed, fetching results")
                    
                    rows = cursor.fetchall()
                    print(f"Fetched {len(rows) if rows else 0} rows from SQL execution")
                    
                    # Get column names from cursor description
                    column_names = [desc[0] for desc in cursor.description] if cursor.description else []
                    print(f"Column names from cursor: {column_names}")
                    
                    # Transform to objects ready for chart consumption
                    print(f"Starting data transformation to objects")
                    data_objects = [dict(zip(column_names, row)) for row in rows]
                    print(f"Data transformation completed, created {len(data_objects)} objects")
                    
                    response_data = {
                        'data': data_objects,  # Ready-to-use objects for charts
                        'columns': column_names,  # Keep for debugging/metadata
                        'rows': data_objects,  # Alias for backwards compatibility during transition
                        'returnedRows': len(data_objects),
                        'sql': sql
                    }
                    print(f"Response data structure created, about to return")
                    print(f"SQL executed successfully, returning {len(data_objects)} rows with columns: {column_names}")
                    
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps(response_data, default=json_serializer)
                    }
                
                except psycopg2.Error as e:
                    print(f"PostgreSQL error executing SQL: {e}")
                    print(f"Error code: {e.pgcode}")
                    print(f"Error sqlstate: {e.sqlstate if hasattr(e, 'sqlstate') else 'N/A'}")
                    return {
                        'statusCode': 500,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'PostgreSQL error',
                            'details': str(e),
                            'pgcode': e.pgcode
                        })
                    }
                except Exception as e:
                    print(f"General error executing SQL: {e}")
                    print(f"Error type: {type(e).__name__}")
                    import traceback
                    print(f"Full traceback: {traceback.format_exc()}")
                    return {
                        'statusCode': 500,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'error': 'Failed to execute SQL query',
                            'details': str(e),
                            'error_type': type(e).__name__
                        })
                    }
        
        elif http_method == 'GET':
            # Get user's datasets
            user_id = event['queryStringParameters'].get('userId') if event.get('queryStringParameters') else None
            
            if not user_id or not conn:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Missing userId or database connection'})
                }
            
            cursor = conn.cursor()
            cursor.execute("""
                SELECT dataset_id, original_filename, row_count, column_count, 
                       upload_date, ingestion_status, table_name
                FROM datasets 
                WHERE user_id = %s
                ORDER BY upload_date DESC
            """, (user_id,))
            
            datasets = cursor.fetchall()
            
            # Convert tuples to dictionaries
            column_names = ['dataset_id', 'original_filename', 'row_count', 'column_count', 
                           'upload_date', 'ingestion_status', 'table_name']
            datasets_dict = [dict(zip(column_names, row)) for row in datasets]
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'datasets': datasets_dict
                }, default=json_serializer)
            }
        
        return {
            'statusCode': 405,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except ClientError as e:
        print(f"AWS error: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'AWS service error',
                'details': str(e)
            })
        }
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
    finally:
        if conn:
            conn.close()