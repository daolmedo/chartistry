const { StateGraph, END } = require('@langchain/langgraph');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { Pool } = require('pg');

// Import our VMind-inspired components
const { FieldDetectionService } = require('./field-detection');
const { ErrorRecoverySystem } = require('./error-recovery');
const { PIE_CHART_KNOWLEDGE, ChartKnowledgeManager } = require('./chart-knowledge');

// Database configuration
const dbConfig = {
    host: "chartz-ai.cexryffwmiie.eu-west-2.rds.amazonaws.com",
    port: 5432,
    database: "chartz",
    user: "postgres",
    password: "ppddA4all.P",
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    // 🔑 enable TLS – this makes pg send the SSLRequest packet
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
};

// Create database pool
const pool = new Pool(dbConfig);

// CORS headers
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

// Tool for getting VChart pie chart examples
const getPieChartExamplesTool = tool(
    async () => {
        return `
        VChart Pie Chart Examples:
        
        1. Basic Pie Chart:
        {
            type: 'pie',
            data: [
                {
                id: 'id0',
                values: [
                    { type: 'oxygen', value: '46.60' },
                    { type: 'silicon', value: '27.72' },
                    { type: 'aluminum', value: '8.13' },
                    { type: 'iron', value: '5' },
                    { type: 'calcium', value: '3.63' },
                    { type: 'sodium', value: '2.83' },
                    { type: 'potassium', value: '2.59' },
                    { type: 'others', value: '3.5' }
                ]
                }
            ],
            outerRadius: 0.8,
            valueField: 'value',
            categoryField: 'type',
            title: {
                visible: true,
                text: 'Statistics of Surface Element Content'
            },
            legends: {
                visible: true,
                orient: 'left'
            },
            label: {
                visible: true
            },
            tooltip: {
                mark: {
                content: [
                    {
                    key: datum => datum['type'],
                    value: datum => datum['value'] + '%'
                    }
                ]
                }
            }
            }
        
        2. Nested Pie Chart:
        {
            type: 'common',
            data: [
                {
                id: 'id0',
                values: [
                    { type: '0~29', value: '126.04' },
                    { type: '30~59', value: '128.77' },
                    { type: '60 and over', value: '77.09' }
                ]
                },
                {
                id: 'id1',
                values: [
                    { type: '0~9', value: '39.12' },
                    { type: '10~19', value: '43.01' },
                    { type: '20~29', value: '43.91' },
                    { type: '30~39', value: '45.4' },
                    { type: '40~49', value: '40.89' },
                    { type: '50~59', value: '42.48' },
                    { type: '60~69', value: '39.63' },
                    { type: '70~79', value: '25.17' },
                    { type: '80 and over', value: '12.29' }
                ]
                }
            ],
            series: [
                {
                type: 'pie',
                dataIndex: 0,
                outerRadius: 0.65,
                innerRadius: 0,
                valueField: 'value',
                categoryField: 'type',
                label: {
                    position: 'inside',
                    visible: true,
                    style: {
                    fill: 'white'
                    }
                },
                pie: {
                    style: {
                    stroke: '#ffffff',
                    lineWidth: 2
                    }
                }
                },
                {
                type: 'pie',
                dataIndex: 1,
                outerRadius: 0.8,
                innerRadius: 0.67,
                valueField: 'value',
                categoryField: 'type',
                label: {
                    visible: true
                },
                pie: {
                    style: {
                    stroke: '#ffffff',
                    lineWidth: 2
                    }
                }
                }
            ],
            color: ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
            title: {
                visible: true,
                text: 'Population Distribution by Age in the United States, 2021 (in millions)',
                textStyle: {
                fontFamily: 'Times New Roman'
                }
            },
            legends: {
                visible: true,
                orient: 'left'
            }
        }
        
        3. Radius mappable pie chart:
        {
            type: 'pie',
            data: [
                {
                id: 'id0',
                values: [
                    { type: '0~9', value: '39.12' },
                    { type: '10~19', value: '43.01' },
                    { type: '20~29', value: '43.91' },
                    { type: '30~39', value: '45.4' },
                    { type: '40~49', value: '40.89' },
                    { type: '50~59', value: '42.48' },
                    { type: '60~69', value: '39.63' },
                    { type: '70~79', value: '25.17' },
                    { type: '80 and over', value: '12.29' }
                ]
                }
            ],
            valueField: 'value',
            categoryField: 'type',
            outerRadius: {
                field: 'value',
                scale: 'outer-radius'
            },
            innerRadius: {
                field: 'value',
                scale: 'inner-radius'
            },
            scales: [
                {
                id: 'outer-radius',
                type: 'linear',
                domain: [10, 50],
                range: [120, 220]
                },
                {
                id: 'inner-radius',
                type: 'linear',
                domain: [10, 50],
                range: [110, 10]
                }
            ],
            label: {
                visible: true
            },
            color: ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
            title: {
                visible: true,
                text: 'Population Distribution by Age in the United States, 2021 (in millions)',
                textStyle: {
                fontFamily: 'Times New Roman'
                }
            },
            legends: {
                visible: true,
                orient: 'right'
            }
        }

        4. Ring Chart:
        {
            type: 'pie',
            data: [
                {
                id: 'id0',
                values: [
                    { type: 'oxygen', value: '46.60' },
                    { type: 'silicon', value: '27.72' },
                    { type: 'aluminum', value: '8.13' },
                    { type: 'iron', value: '5' },
                    { type: 'calcium', value: '3.63' },
                    { type: 'sodium', value: '2.83' },
                    { type: 'potassium', value: '2.59' },
                    { type: 'others', value: '3.5' }
                ]
                }
            ],
            outerRadius: 0.8,
            innerRadius: 0.5,
            padAngle: 0.6,
            valueField: 'value',
            categoryField: 'type',
            pie: {
                style: {
                cornerRadius: 10
                },
                state: {
                hover: {
                    outerRadius: 0.85,
                    stroke: '#000',
                    lineWidth: 1
                },
                selected: {
                    outerRadius: 0.85,
                    stroke: '#000',
                    lineWidth: 1
                }
                }
            },
            title: {
                visible: true,
                text: 'Statistics of Surface Element Content'
            },
            legends: {
                visible: true,
                orient: 'left'
            },
            label: {
                visible: true
            },
            tooltip: {
                mark: {
                content: [
                    {
                    key: datum => datum['type'],
                    value: datum => datum['value'] + '%'
                    }
                ]
                }
            }
        }

        5. Linear Gradient Color Pie Chart:
        {
            type: 'pie',
            data: [
                {
                id: 'id0',
                values: pieData
                }
            ],
            outerRadius: 0.8,
            innerRadius: 0.5,
            padAngle: 0.6,
            valueField: 'value',
            categoryField: 'type',
            color: {
                id: 'color',
                type: 'linear',
                range: ['#1664FF', '#B2CFFF', '#1AC6FF', '#94EFFF'],
                domain: [
                {
                    dataId: 'id0',
                    fields: ['value']
                }
                ]
            },
            pie: {
                style: {
                cornerRadius: 10,
                fill: {
                    scale: 'color',
                    field: 'value'
                }
                }
            },
            legends: {
                visible: true,
                orient: 'left',
                data: (data, scale) => {
                return data.map(datum => {
                    const pickDatum = pieData.find(pieDatum => pieDatum.type === datum.label);

                    datum.shape.fill = scale?.scale?.(pickDatum?.value);
                    return datum;
                });
                }
            },
            label: {
                visible: true
            }
        }

        6. Auto-wrap richtext label in pie chart:

        {
            type: 'pie',
            data: [
                {
                id: 'id0',
                values: [
                    { type: 'This is a long Auto-Wrap Category Text for Category1', value: 24 },
                    { type: 'Category2', value: 20 },
                    { type: 'Category3', value: 18 },
                    { type: 'Category4', value: 18 },
                    { type: 'Category5', value: 16 },
                    {
                    type: 'This is a long Auto-Wrap Category Text for Category6. This is a long Auto-Wrap Category Text for Category6',
                    value: 14
                    }
                ]
                }
            ],
            outerRadius: 0.8,
            innerRadius: 0.5,
            padAngle: 0.6,
            valueField: 'value',
            categoryField: 'type',
            pie: {
                style: {
                cornerRadius: 10
                },
                state: {
                hover: {
                    outerRadius: 0.85,
                    stroke: '#000',
                    lineWidth: 1
                },
                selected: {
                    outerRadius: 0.85,
                    stroke: '#000',
                    lineWidth: 1
                }
                }
            },
            legends: {
                visible: true
            },
            label: {
                visible: true,
                formatMethod: (label, data) => {
                return {
                    type: 'rich',
                    text: [
                    {
                        text: '${data.value}%\n',
                        fill: 'rgba(0, 0, 0, 0.92)',
                        fontSize: 16,
                        fontWeight: 500,
                        stroke: false
                    },
                    {
                        text: data.type,
                        fill: 'rgba(0, 0, 0, 0.55)',
                        fontSize: 12,
                        fontWeight: 400,
                        stroke: false
                    }
                    ]
                };
                },
                style: {
                wordBreak: 'break-word',
                maxHeight: 50
                }
            },
            tooltip: {
                mark: {
                content: [
                    {
                    key: datum => datum['type'],
                    value: datum => datum['value'] + '%'
                    }
                ]
                }
            }
            }
        
        Key properties:
        - type: "pie"
        - categoryField: field containing category names
        - valueField: field containing numeric values
        - innerRadius: 0-1, creates donut if > 0
        - color: can use range array for custom colors
        - label: controls text labels on slices
        `;
    },
    {
        name: "get_pie_chart_examples",
        description: "Get VChart pie chart examples and documentation for creating pie charts",
        schema: z.object({})
    }
);

// Initialize LLM
const llm = new ChatOpenAI({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1, // Low temperature for consistent, deterministic responses
});

// Initialize VMind-inspired services
const fieldDetectionService = new FieldDetectionService(pool, llm);
const errorRecoverySystem = new ErrorRecoverySystem(pool, llm, 3);

// Database helper functions
async function getDatasetStructure(datasetId, tableName) {
    const client = await pool.connect();
    try {
        // Get dataset metadata
        const datasetQuery = `
            SELECT row_count, column_count, metadata
            FROM datasets 
            WHERE dataset_id = $1 AND table_name = $2
        `;
        const datasetResult = await client.query(datasetQuery, [datasetId, tableName]);
        
        if (datasetResult.rows.length === 0) {
            throw new Error('Dataset not found');
        }
        
        const { row_count, column_count, metadata } = datasetResult.rows[0];
        
        // Get column names
        const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `;
        const columnsResult = await client.query(columnsQuery, [tableName]);
        const columns = columnsResult.rows
            .map(row => row.column_name)
            .filter(col => !['id', 'created_at'].includes(col));
        
        // Get sample data (first 5 rows)
        const sampleQuery = `SELECT ${columns.map(col => `"${col}"`).join(', ')} FROM "${tableName}" LIMIT 5`;
        const sampleResult = await client.query(sampleQuery);
        
        return {
            rowCount: row_count,
            columnCount: column_count,
            metadata: metadata ? JSON.parse(metadata) : {},
            columns,
            sampleData: sampleResult.rows,
            tableName
        };
    } finally {
        client.release();
    }
}

async function executeSqlQuery(query, tableName) {
    const client = await pool.connect();
    try {
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
}

// Enhanced workflow state management with VMind-inspired structure
class WorkflowState {
    constructor(data = {}) {
        // Original fields
        this.messages = data.messages || [];
        this.userIntent = data.userIntent || '';
        this.datasetId = data.datasetId || '';
        this.tableName = data.tableName || '';
        this.datasetStructure = data.datasetStructure || {};
        this.sqlQuery = data.sqlQuery || '';
        this.insightExplanation = data.insightExplanation || '';
        this.chartSpec = data.chartSpec || {};
        this.currentStep = data.currentStep || 'start';
        this.queryResults = data.queryResults || [];
        
        // VMind-inspired enhancements
        this.generationId = data.generationId || null;
        this.fieldAnalysis = data.fieldAnalysis || null;
        this.fieldMapping = data.fieldMapping || null;
        this.chartType = data.chartType || 'pie';
        this.confidenceScore = data.confidenceScore || 0.5;
        this.dataQuality = data.dataQuality || { score: 0.5, issues: [] };
        this.attemptCount = data.attemptCount || {};
        this.error = data.error || null;
        
        // Processing metadata
        this.processingSteps = data.processingSteps || [];
        this.startTime = data.startTime || Date.now();
    }
}

// VMind-inspired Step 1: Field Detection and Analysis
async function fieldDetectionNode(state) {
    console.log(`Starting field detection for dataset ${state.datasetId}`);
    
    const stepFunction = async (state) => {
        // Analyze fields using our PostgreSQL + AI system
        const fieldAnalysisResult = await fieldDetectionService.analyzeFields(
            state.datasetId, 
            state.tableName
        );
        
        state.fieldAnalysis = fieldAnalysisResult;
        state.fieldMapping = fieldAnalysisResult.recommendedForPieChart;
        state.dataQuality = fieldAnalysisResult.dataQuality;
        state.confidenceScore = fieldAnalysisResult.recommendedForPieChart.confidence;
        
        // Check if data is suitable for pie chart
        if (!fieldAnalysisResult.recommendedForPieChart.suitable) {
            console.warn('Data may not be suitable for pie chart:', fieldAnalysisResult.recommendedForPieChart.reason);
        }
        
        state.currentStep = 'sql_generation';
        state.processingSteps.push('field_detection_completed');
        
        console.log(`Field detection completed. Confidence: ${state.confidenceScore}`);
        console.log(`Recommended fields - Dimension: ${state.fieldMapping.dimension}, Measure: ${state.fieldMapping.measure}`);
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'field_detection', 
        stepFunction, 
        state,
        { service: 'field_detection', dataset: state.datasetId }
    );
}

// VMind-inspired Step 2: SQL Generation with Enhanced Error Handling
async function sqlGenerationNode(state) {
    console.log('Starting SQL generation');
    
    const stepFunction = async (state) => {
        if (!state.fieldMapping || !state.fieldMapping.dimension || !state.fieldMapping.measure) {
            throw new Error('Missing field mapping from field detection step');
        }
        
        const sqlPrompt = `
        Generate a PostgreSQL query for pie chart data based on field analysis.
        
        User Intent: "${state.userIntent}"
        Table: "${state.tableName}"
        
        Field Analysis:
        - Recommended Dimension (categories): ${state.fieldMapping.dimension}
        - Recommended Measure (values): ${state.fieldMapping.measure}
        - Data Quality Score: ${state.dataQuality.score}
        - Field Analysis Confidence: ${state.confidenceScore}
        
        Available Fields: ${JSON.stringify(state.fieldAnalysis.fields.map(f => ({
            name: f.column_name,
            role: f.field_role,
            type: f.semantic_type,
            unique_count: f.unique_count
        })), null, 2)}
        
        Generate a SQL query that:
        1. Groups by the dimension field (${state.fieldMapping.dimension})
        2. Aggregates the measure field (${state.fieldMapping.measure}) using SUM
        3. Filters out NULL values 
        4. Orders by aggregated value DESC for better pie chart readability
        5. Limits to reasonable number of categories (15 max)
        6. Handles any data quality issues: ${state.dataQuality.issues.join(', ')}
        
        Return JSON:
        {
            "sql_query": "SELECT ...",
            "expected_result_format": "description of expected output columns",
            "data_validation_checks": ["list of validations to apply"]
        }
        `;
        
        const response = await llm.invoke([new HumanMessage(sqlPrompt)]);
        
        let sqlResult;
        try {
            let content = response.content;
            if (content.includes('```json')) {
                content = content.split('```json')[1].split('```')[0];
            }
            sqlResult = JSON.parse(content);
        } catch (parseError) {
            throw new Error(`Failed to parse SQL generation response: ${parseError.message}`);
        }
        
        // Validate the generated SQL by executing it
        console.log(`Testing SQL query: ${sqlResult.sql_query}`);
        const queryResults = await executeSqlQuery(sqlResult.sql_query, state.tableName);
        
        if (!queryResults || queryResults.length === 0) {
            throw new Error('SQL query returned no results');
        }
        
        if (queryResults.length > 20) {
            console.warn(`Query returned ${queryResults.length} rows, might create cluttered pie chart`);
        }
        
        state.sqlQuery = sqlResult.sql_query;
        state.queryResults = queryResults;
        state.insightExplanation = `Analysis of ${state.fieldMapping.dimension} by ${state.fieldMapping.measure} with ${queryResults.length} categories`;
        state.currentStep = 'chart_generation';
        state.processingSteps.push('sql_generation_completed');
        
        console.log(`SQL generation successful. Query returned ${queryResults.length} rows`);
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'sql_generation',
        stepFunction,
        state,
        { 
            fieldMapping: state.fieldMapping,
            tableName: state.tableName
        }
    );
}

// VMind-inspired Step 3: Chart Specification Generation
async function chartGenerationNode(state) {
    console.log('Starting chart specification generation');
    
    const stepFunction = async (state) => {
        if (!state.queryResults || state.queryResults.length === 0) {
            throw new Error('No query results available for chart generation');
        }
        
        // Standardize data format using VMind principles
        const standardizedData = state.queryResults.map(row => {
            const keys = Object.keys(row);
            return {
                category: String(row[keys[0]] || 'Unknown'),
                value: Number(row[keys[1]]) || 0
            };
        });
        
        // Validate data using chart knowledge system
        const validation = ChartKnowledgeManager.validateDataForChart(
            'pie',
            standardizedData,
            {
                dimensions: [state.fieldMapping.dimension],
                measures: [state.fieldMapping.measure]
            }
        );
        
        if (!validation.valid) {
            console.warn('Data validation issues:', validation.issues);
        }
        
        // Select appropriate chart template
        const chartTemplate = ChartKnowledgeManager.selectChartTemplate('pie', {
            categoryCount: standardizedData.length,
            hasTimeData: false,
            complexity: standardizedData.length <= 5 ? 'simple' : 'medium'
        });
        
        if (!chartTemplate) {
            throw new Error('No suitable chart template found');
        }
        
        // Generate VChart specification using structured knowledge
        const chartSpec = {
            ...chartTemplate.vchartSpec,
            data: { values: standardizedData },
            categoryField: 'category',
            valueField: 'value',
            title: {
                visible: true,
                text: `${state.userIntent} - ${state.fieldMapping.dimension} Analysis`
            }
        };
        
        // Apply style variations if needed
        if (standardizedData.length > 8) {
            // Use donut style for better readability
            chartSpec.innerRadius = 0.4;
        }
        
        state.chartSpec = chartSpec;
        state.chartType = 'pie';
        state.currentStep = 'complete';
        state.processingSteps.push('chart_generation_completed');
        
        console.log(`Chart generation completed. Generated ${state.chartType} chart with ${standardizedData.length} categories`);
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'chart_generation',
        stepFunction,
        state,
        {
            dataLength: state.queryResults?.length,
            fieldMapping: state.fieldMapping
        }
    );
}

// VMind-inspired helper: Initialize generation record
async function initializeGeneration(state) {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO chart_generations 
            (user_id, dataset_id, user_prompt, generation_date, model_used, was_successful)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, false)
            RETURNING generation_id
        `;
        
        const result = await client.query(query, [
            'anonymous', // Could be enhanced with actual user ID
            state.datasetId,
            state.userIntent,
            'gpt-4o'
        ]);
        
        state.generationId = result.rows[0].generation_id;
        console.log(`Initialized generation record: ${state.generationId}`);
        
        return state;
    } finally {
        client.release();
    }
}

// VMind-inspired helper: Finalize generation record
async function finalizeGeneration(state) {
    if (!state.generationId) return state;
    
    const client = await pool.connect();
    try {
        const executionTime = Date.now() - state.startTime;
        
        await client.query(`
            UPDATE chart_generations 
            SET 
                generated_chart_config = $1,
                chart_type = $2,
                columns_used = $3,
                execution_time_ms = $4,
                was_successful = $5,
                sql_query = $6,
                field_mappings = $7,
                confidence_score = $8,
                data_quality_score = $9,
                generation_strategy = 'vmind_inspired'
            WHERE generation_id = $10
        `, [
            JSON.stringify(state.chartSpec),
            state.chartType,
            JSON.stringify([state.fieldMapping?.dimension, state.fieldMapping?.measure].filter(Boolean)),
            executionTime,
            state.currentStep === 'complete',
            state.sqlQuery,
            JSON.stringify(state.fieldMapping),
            state.confidenceScore,
            state.dataQuality?.score || 0.5,
            state.generationId
        ]);
        
        console.log(`Finalized generation record: ${state.generationId}, execution time: ${executionTime}ms`);
        
        return state;
    } finally {
        client.release();
    }
}

// Create the enhanced VMind-inspired workflow
function createWorkflow() {
    const workflow = new StateGraph({
        channels: {
            // Original channels
            messages: { reducer: (a, b) => a.concat(b), default: () => [] },
            userIntent: { default: () => '' },
            datasetId: { default: () => '' },
            tableName: { default: () => '' },
            datasetStructure: { default: () => ({}) },
            sqlQuery: { default: () => '' },
            insightExplanation: { default: () => '' },
            chartSpec: { default: () => ({}) },
            currentStep: { default: () => 'start' },
            queryResults: { default: () => [] },
            
            // VMind-inspired enhancements
            generationId: { default: () => null },
            fieldAnalysis: { default: () => null },
            fieldMapping: { default: () => null },
            chartType: { default: () => 'pie' },
            confidenceScore: { default: () => 0.5 },
            dataQuality: { default: () => ({ score: 0.5, issues: [] }) },
            attemptCount: { default: () => ({}) },
            error: { default: () => null },
            processingSteps: { default: () => [] },
            startTime: { default: () => Date.now() }
        }
    });
    
    // Add VMind-inspired nodes
    workflow.addNode('initialize_generation', initializeGeneration);
    workflow.addNode('field_detection', fieldDetectionNode);
    workflow.addNode('sql_generation', sqlGenerationNode); 
    workflow.addNode('chart_generation', chartGenerationNode);
    workflow.addNode('finalize_generation', finalizeGeneration);
    
    // Add edges for sequential processing
    workflow.addEdge('initialize_generation', 'field_detection');
    workflow.addEdge('field_detection', 'sql_generation');
    workflow.addEdge('sql_generation', 'chart_generation');
    workflow.addEdge('chart_generation', 'finalize_generation');
    workflow.addEdge('finalize_generation', END);
    
    // Set entry point
    workflow.setEntryPoint('initialize_generation');
    
    return workflow.compile();
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        const body = JSON.parse(event.body || '{}');
        const { user_intent, dataset_id, table_name } = body;
        
        if (!user_intent || !dataset_id || !table_name) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "Missing required parameters: user_intent, dataset_id, table_name"
                })
            };
        }
        
        console.log(`Starting workflow for dataset ${dataset_id} with intent: ${user_intent}`);
        
        // Initialize state
        const initialState = new WorkflowState({
            userIntent: user_intent,
            datasetId: dataset_id,
            tableName: table_name,
            currentStep: 'start'
        });
        
        // Create and run workflow
        const workflow = createWorkflow();
        const finalState = await workflow.invoke(initialState);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                // Frontend expects 'spec' field
                spec: finalState.chartSpec,
                time: Date.now() - finalState.startTime,
                
                // Original response format (backwards compatible)
                sql_query: finalState.sqlQuery,
                insight_explanation: finalState.insightExplanation,
                chart_spec: finalState.chartSpec,
                query_results: finalState.queryResults,
                
                // VMind-inspired enhancements
                generation_id: finalState.generationId,
                chart_type: finalState.chartType,
                field_analysis: {
                    recommended_dimension: finalState.fieldMapping?.dimension,
                    recommended_measure: finalState.fieldMapping?.measure,
                    confidence_score: finalState.confidenceScore,
                    data_quality_score: finalState.dataQuality?.score
                },
                processing_metadata: {
                    steps_completed: finalState.processingSteps,
                    execution_time_ms: Date.now() - finalState.startTime,
                    attempt_counts: finalState.attemptCount,
                    generation_strategy: 'vmind_inspired',
                    workflow_complete: finalState.currentStep === 'complete'
                },
                data_quality: finalState.dataQuality
            })
        };
        
    } catch (error) {
        console.error('Error in workflow:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Workflow execution failed',
                details: error.message
            })
        };
    }
};