-- Database Schema for ChartZ-AI
-- PostgreSQL schema for user management and dynamic CSV data storage

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profile Management
CREATE TABLE user_profiles (
    user_id VARCHAR(128) PRIMARY KEY, -- Firebase UID
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dataset Metadata - tracks each CSV file uploaded
CREATE TABLE datasets (
    dataset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(128) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL, -- full S3 path
    file_size_bytes BIGINT,
    row_count INTEGER,
    column_count INTEGER,
    table_name VARCHAR(255) NOT NULL, -- dynamically generated table name for this dataset
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ingestion_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    ingestion_date TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB -- store column names, types, sample data, etc.
);

-- Column Metadata - tracks each column in each dataset
CREATE TABLE dataset_columns (
    column_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES datasets(dataset_id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    column_index INTEGER NOT NULL, -- position in the CSV
    data_type VARCHAR(50) NOT NULL, -- TEXT, INTEGER, DECIMAL, DATE, BOOLEAN
    postgres_type VARCHAR(50) NOT NULL, -- actual PostgreSQL type used
    is_nullable BOOLEAN DEFAULT true,
    sample_values JSONB, -- array of sample values for preview
    unique_count INTEGER, -- number of unique values (for categorical data)
    min_value TEXT, -- for numeric/date columns
    max_value TEXT, -- for numeric/date columns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chart Generation History - tracks charts generated from datasets
CREATE TABLE chart_generations (
    generation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(128) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES datasets(dataset_id) ON DELETE CASCADE,
    user_prompt TEXT NOT NULL,
    generated_chart_config JSONB, -- the Visx/D3 configuration
    chart_type VARCHAR(100), -- bar, line, scatter, pie, etc.
    columns_used JSONB, -- array of column names used
    generation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    model_used VARCHAR(100) DEFAULT 'claude-3.5-sonnet',
    execution_time_ms INTEGER,
    was_successful BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_upload_date ON datasets(upload_date DESC);
CREATE INDEX idx_dataset_columns_dataset_id ON dataset_columns(dataset_id);
CREATE INDEX idx_chart_generations_user_id ON chart_generations(user_id);
CREATE INDEX idx_chart_generations_dataset_id ON chart_generations(dataset_id);
CREATE INDEX idx_chart_generations_date ON chart_generations(generation_date DESC);

-- Function to generate unique table names for datasets
CREATE OR REPLACE FUNCTION generate_dataset_table_name(user_uuid VARCHAR, original_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    clean_name VARCHAR;
    table_name VARCHAR;
    counter INTEGER := 0;
    final_name VARCHAR;
BEGIN
    clean_name := regexp_replace(lower(original_name), '[^a-z0-9_]', '_', 'g');
    clean_name := regexp_replace(clean_name, '_+', '_', 'g');
    clean_name := trim(both '_' from clean_name);
    clean_name := regexp_replace(clean_name, '\.(csv|txt)$', '', 'i');
    
    clean_name := left(clean_name, 20);
    
    table_name := 'user_' || replace(user_uuid, '-', '_') || '_' || clean_name;
    
    final_name := table_name;
    WHILE EXISTS (
        SELECT 1 FROM datasets WHERE datasets.table_name = final_name
    ) LOOP
        counter := counter + 1;
        final_name := table_name || '_' || counter::text;
    END LOOP;
    
    RETURN final_name;
END;
$$ LANGUAGE plpgsql;


-- Sample data for testing (optional)
-- INSERT INTO user_profiles (email, display_name) 
-- VALUES ('test@example.com', 'Test User');

COMMENT ON TABLE user_profiles IS 'Stores basic user account information';
COMMENT ON TABLE datasets IS 'Metadata about uploaded CSV files and their ingestion status';
COMMENT ON TABLE dataset_columns IS 'Schema information for each column in uploaded datasets';
COMMENT ON TABLE chart_generations IS 'History of chart generation requests and results';