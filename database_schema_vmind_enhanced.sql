-- Enhanced Database Schema for VMind-Inspired Chart Generation
-- PostgreSQL schema with intelligent field detection and error recovery capabilities

-- Create extension for UUID generation (if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced dataset_columns table with field role detection
ALTER TABLE dataset_columns 
ADD COLUMN IF NOT EXISTS field_role VARCHAR(50), -- 'dimension', 'measure', 'identifier', 'unknown'
ADD COLUMN IF NOT EXISTS semantic_type VARCHAR(50), -- 'categorical', 'numerical', 'temporal', 'text', 'boolean'
ADD COLUMN IF NOT EXISTS cardinality_ratio DECIMAL(5,4), -- unique_count/row_count for categorical detection
ADD COLUMN IF NOT EXISTS contains_nulls_pct DECIMAL(5,2), -- percentage of null values
ADD COLUMN IF NOT EXISTS field_stats JSONB; -- additional statistical information

-- Enhanced chart_generations table for learning from successful patterns
ALTER TABLE chart_generations 
ADD COLUMN IF NOT EXISTS sql_query TEXT, -- the SQL used for data aggregation
ADD COLUMN IF NOT EXISTS field_mappings JSONB, -- which fields mapped to which visual channels
ADD COLUMN IF NOT EXISTS chart_complexity VARCHAR(20), -- 'simple', 'medium', 'complex'
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2), -- AI confidence in the chart choice
ADD COLUMN IF NOT EXISTS generation_strategy VARCHAR(50), -- 'field_detection', 'llm_analysis', 'rule_based'
ADD COLUMN IF NOT EXISTS data_quality_score DECIMAL(3,2); -- assessment of input data quality

-- New table for chart generation attempts (including failures for learning)
CREATE TABLE IF NOT EXISTS chart_generation_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES chart_generations(generation_id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL, -- 'field_detection', 'sql_generation', 'chart_mapping', 'spec_building'
    step_input JSONB,
    step_output JSONB,
    error_message TEXT,
    correction_applied TEXT, -- what correction was made for retry
    was_successful BOOLEAN DEFAULT false,
    execution_time_ms INTEGER,
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(generation_id, attempt_number, step_name)
);

-- New table for chart knowledge and examples (for consistent templates)
CREATE TABLE IF NOT EXISTS chart_knowledge (
    knowledge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_type VARCHAR(50) NOT NULL,
    knowledge_category VARCHAR(50) NOT NULL, -- 'template', 'example', 'rule', 'constraint'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    data_requirements JSONB, -- min/max dimensions, measures, cardinality constraints
    vchart_template JSONB, -- standardized VChart specification template
    sample_data JSONB, -- example data structure
    use_cases TEXT[], -- array of applicable scenarios
    priority_score INTEGER DEFAULT 0, -- for selecting best template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to calculate field statistics and roles
CREATE OR REPLACE FUNCTION analyze_field_characteristics(
    p_dataset_id UUID,
    p_table_name VARCHAR
) RETURNS TABLE (
    column_name VARCHAR,
    suggested_field_role VARCHAR,
    suggested_semantic_type VARCHAR,
    cardinality_ratio DECIMAL,
    null_percentage DECIMAL,
    field_statistics JSONB
) AS $$
DECLARE
    col_record RECORD;
    total_rows INTEGER;
    sql_query TEXT;
    stats_result RECORD;
BEGIN
    -- Get total row count
    EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name) INTO total_rows;
    
    -- Loop through each column in the dataset
    FOR col_record IN 
        SELECT dc.column_name, dc.data_type, dc.postgres_type, dc.unique_count
        FROM dataset_columns dc 
        WHERE dc.dataset_id = p_dataset_id 
        ORDER BY dc.column_index
    LOOP
        -- Build dynamic query to get column statistics
        sql_query := format('
            SELECT 
                COUNT(DISTINCT %I) as distinct_count,
                COUNT(%I) as non_null_count,
                COUNT(*) as total_count,
                (COUNT(*) - COUNT(%I))::FLOAT / COUNT(*) * 100 as null_pct,
                MIN(%I::TEXT) as min_val,
                MAX(%I::TEXT) as max_val
            FROM %I
        ', col_record.column_name, col_record.column_name, col_record.column_name, 
           col_record.column_name, col_record.column_name, p_table_name);
        
        EXECUTE sql_query INTO stats_result;
        
        -- Calculate cardinality ratio
        column_name := col_record.column_name;
        cardinality_ratio := CASE 
            WHEN total_rows > 0 THEN stats_result.distinct_count::DECIMAL / total_rows 
            ELSE 0 
        END;
        null_percentage := stats_result.null_pct;
        
        -- Determine field role based on data characteristics
        suggested_field_role := CASE 
            -- Identifier detection (high uniqueness)
            WHEN cardinality_ratio > 0.95 THEN 'identifier'
            
            -- Dimension detection (categorical data)
            WHEN col_record.data_type IN ('TEXT') AND cardinality_ratio < 0.5 THEN 'dimension'
            WHEN col_record.data_type IN ('DATE') THEN 'dimension'
            WHEN col_record.postgres_type = 'boolean' THEN 'dimension'
            WHEN col_record.data_type IN ('TEXT') AND stats_result.distinct_count <= 50 THEN 'dimension'
            
            -- Measure detection (numerical data suitable for aggregation)
            WHEN col_record.data_type IN ('INTEGER', 'DECIMAL') AND cardinality_ratio > 0.1 THEN 'measure'
            WHEN col_record.data_type IN ('FLOAT', 'NUMERIC') THEN 'measure'
            
            ELSE 'unknown'
        END;
        
        -- Determine semantic type
        suggested_semantic_type := CASE
            WHEN col_record.data_type IN ('TEXT') AND cardinality_ratio < 0.2 THEN 'categorical'
            WHEN col_record.data_type IN ('INTEGER', 'DECIMAL', 'FLOAT', 'NUMERIC') THEN 'numerical'
            WHEN col_record.data_type = 'DATE' OR col_record.postgres_type LIKE '%timestamp%' THEN 'temporal'
            WHEN col_record.postgres_type = 'boolean' THEN 'boolean'
            ELSE 'text'
        END;
        
        -- Build field statistics JSON
        field_statistics := json_build_object(
            'distinct_count', stats_result.distinct_count,
            'non_null_count', stats_result.non_null_count,
            'null_percentage', stats_result.null_pct,
            'min_value', stats_result.min_val,
            'max_value', stats_result.max_val,
            'data_type', col_record.data_type,
            'postgres_type', col_record.postgres_type,
            'is_suitable_for_grouping', (suggested_field_role = 'dimension'),
            'is_suitable_for_aggregation', (suggested_field_role = 'measure')
        );
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to update field analysis for a dataset
CREATE OR REPLACE FUNCTION update_field_analysis(p_dataset_id UUID, p_table_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    field_record RECORD;
BEGIN
    -- Update field characteristics for all columns in the dataset
    FOR field_record IN 
        SELECT * FROM analyze_field_characteristics(p_dataset_id, p_table_name)
    LOOP
        UPDATE dataset_columns 
        SET 
            field_role = field_record.suggested_field_role,
            semantic_type = field_record.suggested_semantic_type,
            cardinality_ratio = field_record.cardinality_ratio,
            contains_nulls_pct = field_record.null_percentage,
            field_stats = field_record.field_statistics,
            updated_at = CURRENT_TIMESTAMP
        WHERE dataset_id = p_dataset_id 
        AND column_name = field_record.column_name;
    END LOOP;
    
    RAISE NOTICE 'Field analysis updated for dataset %', p_dataset_id;
END;
$$ LANGUAGE plpgsql;

-- Insert standard pie chart knowledge base
INSERT INTO chart_knowledge (chart_type, knowledge_category, name, description, data_requirements, vchart_template, sample_data, use_cases, priority_score)
VALUES 
(
    'pie',
    'template',
    'basic_pie_chart',
    'Standard pie chart template for categorical data distribution',
    '{
        "min_dimensions": 1,
        "min_measures": 1,
        "max_categories": 15,
        "data_constraints": [
            "All values must be positive numbers",
            "Category field should have reasonable cardinality (2-15 unique values)",
            "No missing or null values in key fields"
        ]
    }'::jsonb,
    '{
        "type": "pie",
        "data": {
            "values": []
        },
        "categoryField": "category",
        "valueField": "value",
        "outerRadius": 0.8,
        "title": {
            "visible": true,
            "text": "Data Distribution"
        },
        "legends": {
            "visible": true,
            "orient": "right"
        },
        "label": {
            "visible": true
        },
        "tooltip": {
            "mark": {
                "content": [
                    {
                        "key": "datum => datum[\"category\"]",
                        "value": "datum => datum[\"value\"]"
                    }
                ]
            }
        }
    }'::jsonb,
    '[
        {"category": "Product A", "value": 30},
        {"category": "Product B", "value": 45},
        {"category": "Product C", "value": 25}
    ]'::jsonb,
    ARRAY['categorical_distribution', 'market_share', 'survey_results', 'basic_aggregation'],
    100
),
(
    'pie',
    'template', 
    'donut_chart',
    'Donut chart variation with inner radius for better readability',
    '{
        "min_dimensions": 1,
        "min_measures": 1,
        "max_categories": 12,
        "recommended_for": "larger_datasets"
    }'::jsonb,
    '{
        "type": "pie",
        "data": {
            "values": []
        },
        "categoryField": "category",
        "valueField": "value", 
        "outerRadius": 0.8,
        "innerRadius": 0.4,
        "title": {
            "visible": true,
            "text": "Distribution Analysis"
        },
        "legends": {
            "visible": true,
            "orient": "bottom"
        },
        "label": {
            "visible": true
        },
        "tooltip": {
            "mark": {
                "content": [
                    {
                        "key": "datum => datum[\"category\"]",
                        "value": "datum => datum[\"value\"]"
                    }
                ]
            }
        }
    }'::jsonb,
    '[
        {"category": "Region North", "value": 120},
        {"category": "Region South", "value": 95},
        {"category": "Region East", "value": 87},
        {"category": "Region West", "value": 110}
    ]'::jsonb,
    ARRAY['regional_analysis', 'department_breakdown', 'medium_cardinality'],
    90
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chart_generation_attempts_generation_id ON chart_generation_attempts(generation_id);
CREATE INDEX IF NOT EXISTS idx_chart_generation_attempts_step_name ON chart_generation_attempts(step_name);
CREATE INDEX IF NOT EXISTS idx_chart_generation_attempts_timestamp ON chart_generation_attempts(attempt_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chart_knowledge_type ON chart_knowledge(chart_type);
CREATE INDEX IF NOT EXISTS idx_chart_knowledge_category ON chart_knowledge(knowledge_category);
CREATE INDEX IF NOT EXISTS idx_dataset_columns_field_role ON dataset_columns(field_role);
CREATE INDEX IF NOT EXISTS idx_dataset_columns_semantic_type ON dataset_columns(semantic_type);

-- Add comments for documentation
COMMENT ON TABLE chart_generation_attempts IS 'Tracks all steps in chart generation workflow including failures for learning and debugging';
COMMENT ON TABLE chart_knowledge IS 'Stores chart templates, examples, and rules for consistent chart generation';
COMMENT ON FUNCTION analyze_field_characteristics IS 'Analyzes dataset columns to determine field roles and characteristics for intelligent chart generation';
COMMENT ON FUNCTION update_field_analysis IS 'Updates field analysis for all columns in a dataset, should be called after data ingestion';

-- Sample usage after CSV ingestion:
-- SELECT update_field_analysis('dataset-uuid-here', 'table_name_here');