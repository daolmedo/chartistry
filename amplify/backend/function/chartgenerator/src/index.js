const { StateGraph, END } = require('@langchain/langgraph');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Import our VMind-inspired components
const { FieldDetectionService } = require('./field-detection');
const { ErrorRecoverySystem } = require('./error-recovery');
// Removed old chart knowledge dependencies - now using AI agent with tools

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

// Tool for getting available chart types and their specifications
const getAvailableChartsTool = tool(
    async ({ chartType }) => {
        if (chartType === 'pie' || !chartType) {
            return `
# VChart Pie Chart Specifications and Guidelines

## 🎯 CRITICAL GUARDRAILS FOR PIE CHARTS

### ❌ NEVER DO:
1. **Never use JavaScript functions in JSON** - They break serialization!
   - WRONG: key: datum => datum['field']
   - RIGHT: Use VChart's automatic tooltip behavior

2. **Never use complex tooltip content** - Keep it simple!
   - WRONG: Complex function-based tooltip configurations
   - RIGHT: tooltip: { mark: { visible: true } }

3. **Never ignore data structure** - Match your field names!
   - Always use actual field names from the data
   - Update categoryField and valueField to match your data

### ✅ ALWAYS DO:
1. **Use VChart's automatic tooltips** for reliability
2. **Match field names** to the actual data structure
3. **Keep data in the format**: [{ id: 'id0', values: actualDataArray }]
4. **Ensure all values are positive** for pie charts

---

## 📊 PIE CHART VARIATIONS

### 1. BASIC PIE CHART
**When to use**: Simple categorical data (2-8 categories)
**Best for**: Market share, survey results, simple distributions

\`\`\`json
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
  "tooltip": {
    "mark": {
      "visible": true
    }
  }
}
\`\`\`

### 2. RING/DONUT CHART
**When to use**: Modern aesthetic, emphasize total vs parts
**Best for**: Marketing materials, executive dashboards

\`\`\`json
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
  "tooltip": {
    "mark": {
      "visible": true
    }
  }
}
\`\`\`

---

## 🔧 DATA MAPPING REQUIREMENTS

### For Pie Charts:
- **categoryField**: Field containing category labels (text/string)
- **valueField**: Field containing numeric values (positive numbers preferred)
- **Data structure**: [{ id: 'id0', values: actualDataArray }]

### Field Selection Criteria:
- **Dimension (Category)**: 
  - Low cardinality (2-15 unique values)
  - Text or categorical data
  - Meaningful category names
  - Good for pie slices

- **Measure (Value)**:
  - Numeric data suitable for aggregation
  - Positive values preferred
  - Can be summed meaningfully
  - Represents quantities/amounts

### Suitability Assessment:
- ✅ 2-8 categories: Excellent
- ✅ 9-15 categories: Good (consider grouping)
- ❌ 16+ categories: Not suitable (too cluttered)
- ✅ Positive values: Perfect
- ⚠️ Mixed positive/negative: Possible with absolute values
- ❌ All negative: Not suitable

---

## 📏 CHART SELECTION LOGIC

### Choose PIE CHART when:
- Showing parts of a whole
- Categorical data with 2-15 categories
- User wants to see proportional relationships
- Data represents distribution or composition

### PIE CHART VARIATIONS:
- **Basic Pie**: Simple distributions, clear categories
- **Donut/Ring**: Modern look, space for center content
- **Interactive**: Hover effects, selection states

### NOT suitable for PIE when:
- Too many categories (>15)
- Negative values dominant
- Time series data (use line chart)
- Comparison across multiple series (use bar chart)

Remember: Keep it simple, match field names, and let VChart handle the complexity!
        `;
        }
        
        // Future expansion for other chart types
        return `Chart type "${chartType}" not yet available. Currently supported: pie`;
    },
    {
        name: "get_available_charts",
        description: "Get available chart types, their specifications, data mapping requirements, and suitability guidelines",
        schema: z.object({
            chartType: z.string().optional().describe("Specific chart type to get info for (e.g., 'pie'). If not provided, returns all available charts.")
        })
    }
);

// Initialize LLM
const llm = new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.OPENAI_API_KEY,
    // Note: temperature parameter not supported with gpt-5 model
});

// Initialize VMind-inspired services
const fieldDetectionService = new FieldDetectionService(pool, llm);
const errorRecoverySystem = new ErrorRecoverySystem(pool, llm, 3);
// AI Chart Generation now handled by ChartSpecificationAgent with tools

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

// AI Agent for Data Mapping and Chart Selection
class DataMappingAgent {
    constructor(llm, pool) {
        this.llm = llm;
        this.pool = pool;
    }

    async analyzeDataAndSelectChart(datasetId, tableName, userIntent, datasetStructure) {
        console.log('AI Agent analyzing data for mapping and chart selection');
        
        // Get comprehensive dataset information
        const dataContext = await this.gatherDataContext(datasetId, tableName, datasetStructure);
        
        const analysisPrompt = `You are an expert data visualization consultant. Based on the user's intent and the dataset, you need to:

1. **Determine the best chart type** for the user's visualization needs
2. **Map the data fields** to the chosen chart type
3. **Provide reasoning** for your decisions

CONTEXT:
- **User Intent**: "${userIntent}"
- **Dataset**: "${tableName}"
- **Available Fields**: ${JSON.stringify(dataContext.fields.map(f => ({
    name: f.column_name,
    type: f.data_type,
    unique_values: f.unique_count,
    sample_values: f.sample_values?.slice(0, 3) || [],
    cardinality_ratio: f.cardinality_ratio,
    null_percentage: f.null_percentage || 0
})), null, 2)}

- **Sample Data** (first 3 rows):
${JSON.stringify(dataContext.sampleData.slice(0, 3), null, 2)}

- **Data Summary**:
  - Total rows: ${dataContext.rowCount}
  - Total columns: ${dataContext.columnCount}
  - Data quality indicators: ${JSON.stringify(dataContext.qualityIndicators)}

TASKS:
1. First, call the get_available_charts tool to understand available chart options
2. Analyze the user intent to determine what they want to visualize
3. Evaluate which fields are suitable for visualization
4. Select the best chart type based on:
   - Data characteristics (categorical vs numerical, cardinality, etc.)
   - User intent (distribution, comparison, trend, composition, etc.)
   - Data quality and completeness
5. Map the selected fields to chart dimensions (category/dimension fields and value/measure fields)

IMPORTANT DECISION CRITERIA:
- **For composition/parts-of-whole**: Consider pie charts if 2-15 categories
- **For comparison**: Consider bar charts if implemented
- **For trends over time**: Consider line charts if implemented  
- **For distributions**: Consider histograms if implemented

USER INTENT ANALYSIS:
- If user mentions "distribution", "composition", "breakdown", "share", "proportion": Favor pie charts
- If user mentions "compare", "versus", "difference": Favor bar charts
- If user mentions "trend", "over time", "timeline": Favor line charts
- If no specific intent: Choose based on data characteristics

RETURN FORMAT:
{
  "selected_chart_type": "pie|bar|line|...",
  "confidence_score": 0.0-1.0,
  "reasoning": "detailed explanation of why this chart type and mapping",
  "field_mapping": {
    "dimension": "field_name_for_categories",
    "measure": "field_name_for_values",
    "additional_fields": {}
  },
  "data_suitability": {
    "suitable": true/false,
    "issues": ["list any data quality or suitability concerns"],
    "recommendations": ["suggestions for data preparation"]
  },
  "chart_configuration_hints": {
    "suggested_aggregation": "SUM|COUNT|AVG|etc",
    "expected_categories": number,
    "value_range_info": "description",
    "special_considerations": ["any special handling needed"]
  }
}`;

        try {
            // Create messages with tool calling capability
            const messages = [{
                role: 'user',
                content: analysisPrompt
            }];
            
            // Let the LLM call the tool and generate analysis
            const response = await this.llm.invoke(messages, {
                tools: [getAvailableChartsTool]
            });
            
            let analysisContent;
            
            // Check if AI made tool calls
            if (response.tool_calls && response.tool_calls.length > 0) {
                console.log('AI called chart info tool, making follow-up request for analysis');
                
                const followUpPrompt = `Based on the chart information you've accessed, provide your data mapping and chart selection analysis:

User Intent: "${userIntent}"
Dataset Fields: ${JSON.stringify(dataContext.fields.map(f => f.column_name))}
Sample Data: ${JSON.stringify(dataContext.sampleData.slice(0, 2))}

Provide your analysis in the exact JSON format specified earlier. Focus on:
1. Which chart type best matches the user intent and data characteristics
2. How to map the fields to the chosen chart type
3. Any data quality considerations

Your JSON response:`;

                const followUpMessages = [{
                    role: 'user',
                    content: followUpPrompt
                }];
                
                const followUpResponse = await this.llm.invoke(followUpMessages);
                analysisContent = followUpResponse.content;
            } else {
                analysisContent = response.content;
            }
            
            if (!analysisContent || typeof analysisContent !== 'string') {
                throw new Error('LLM returned empty or invalid response');
            }
            
            console.log('RAW AI ANALYSIS RESPONSE:', analysisContent);
            
            // Parse AI analysis
            let aiAnalysis;
            try {
                let content = analysisContent;
                if (content.includes('```json')) {
                    content = content.split('```json')[1].split('```')[0];
                } else if (content.includes('```')) {
                    const codeBlocks = content.split('```');
                    if (codeBlocks.length >= 2) {
                        content = codeBlocks[1];
                    }
                }
                
                const trimmedContent = content.trim();
                aiAnalysis = JSON.parse(trimmedContent);
                console.log('PARSED AI ANALYSIS:', JSON.stringify(aiAnalysis, null, 2));
            } catch (parseError) {
                console.error('Failed to parse AI analysis:', parseError.message);
                console.error('Content that failed:', analysisContent);
                throw new Error(`AI analysis parsing failed: ${parseError.message}`);
            }
            
            // Validate the analysis has required fields
            if (!aiAnalysis.selected_chart_type || !aiAnalysis.field_mapping) {
                throw new Error('AI analysis missing required fields: selected_chart_type or field_mapping');
            }
            
            // Enhance with data context
            const result = {
                chartType: aiAnalysis.selected_chart_type,
                confidence: aiAnalysis.confidence_score || 0.8,
                reasoning: aiAnalysis.reasoning,
                fieldMapping: {
                    dimension: aiAnalysis.field_mapping.dimension,
                    measure: aiAnalysis.field_mapping.measure,
                    additionalFields: aiAnalysis.field_mapping.additional_fields || {}
                },
                dataSuitability: aiAnalysis.data_suitability || {
                    suitable: true,
                    issues: [],
                    recommendations: []
                },
                chartConfiguration: aiAnalysis.chart_configuration_hints || {},
                dataContext: dataContext
            };
            
            console.log(`AI Agent selected chart type: ${result.chartType} with confidence: ${result.confidence}`);
            console.log(`Field mapping - Dimension: ${result.fieldMapping.dimension}, Measure: ${result.fieldMapping.measure}`);
            
            return result;
            
        } catch (error) {
            console.error('AI Agent analysis failed:', error.message);
            throw new Error(`Data mapping and chart selection failed: ${error.message}`);
        }
    }

    async gatherDataContext(datasetId, tableName, datasetStructure) {
        const client = await this.pool.connect();
        
        try {
            // Get field characteristics
            const fieldsQuery = `
                SELECT 
                    column_name,
                    data_type,
                    postgres_type,
                    unique_count,
                    cardinality_ratio,
                    contains_nulls_pct,
                    sample_values,
                    min_value,
                    max_value,
                    COALESCE(field_role, 'unknown') as field_role,
                    COALESCE(semantic_type, 'text') as semantic_type
                FROM dataset_columns 
                WHERE dataset_id = $1
                ORDER BY column_index
            `;
            
            const fieldsResult = await client.query(fieldsQuery, [datasetId]);
            
            // Get sample data
            const columns = fieldsResult.rows
                .map(row => row.column_name)
                .filter(col => !['id', 'created_at'].includes(col));
            
            let sampleData = [];
            if (columns.length > 0) {
                const sampleQuery = `SELECT ${columns.map(col => `"${col}"`).join(', ')} FROM "${tableName}" LIMIT 5`;
                const sampleResult = await client.query(sampleQuery);
                sampleData = sampleResult.rows;
            }
            
            // Basic data quality indicators
            const qualityIndicators = {
                hasNulls: fieldsResult.rows.some(f => f.contains_nulls_pct > 0),
                highCardinalityFields: fieldsResult.rows.filter(f => f.cardinality_ratio > 0.8).length,
                numericFields: fieldsResult.rows.filter(f => f.semantic_type === 'numerical').length,
                textFields: fieldsResult.rows.filter(f => f.semantic_type === 'text').length
            };
            
            return {
                fields: fieldsResult.rows,
                sampleData: sampleData,
                rowCount: datasetStructure.rowCount || 0,
                columnCount: datasetStructure.columnCount || fieldsResult.rows.length,
                qualityIndicators: qualityIndicators
            };
            
        } finally {
            client.release();
        }
    }
}

// Updated Step 1: LLM-driven Data Mapping and Chart Selection
async function dataMappingAndChartSelectionNode(state) {
    console.log(`Starting AI-driven data mapping and chart selection for dataset ${state.datasetId}`);
    
    const stepFunction = async (state) => {
        // Get dataset structure for context
        const datasetStructure = await getDatasetStructure(state.datasetId, state.tableName);
        state.datasetStructure = datasetStructure;
        
        // Create AI agent for data mapping and chart selection
        const dataMappingAgent = new DataMappingAgent(llm, pool);
        
        // Let AI analyze data and select chart type
        const analysisResult = await dataMappingAgent.analyzeDataAndSelectChart(
            state.datasetId,
            state.tableName, 
            state.userIntent,
            datasetStructure
        );
        
        // Update state with AI analysis results
        state.chartType = analysisResult.chartType;
        state.fieldMapping = analysisResult.fieldMapping;
        state.confidenceScore = analysisResult.confidence;
        state.aiReasoning = analysisResult.reasoning;
        state.dataSuitability = analysisResult.dataSuitability;
        state.chartConfiguration = analysisResult.chartConfiguration;
        state.dataQuality = {
            score: analysisResult.dataSuitability.suitable ? 0.8 : 0.5,
            issues: analysisResult.dataSuitability.issues || []
        };
        
        // Log analysis results
        console.log(`AI selected chart type: ${state.chartType}`);
        console.log(`Field mapping - Dimension: ${state.fieldMapping.dimension}, Measure: ${state.fieldMapping.measure}`);
        console.log(`Confidence score: ${state.confidenceScore}`);
        console.log(`Data suitable: ${state.dataSuitability.suitable}`);
        if (!state.dataSuitability.suitable) {
            console.warn('AI identified data suitability issues:', state.dataSuitability.issues);
        }
        
        state.currentStep = 'sql_generation';
        state.processingSteps.push('ai_data_mapping_completed');
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'ai_data_mapping', 
        stepFunction, 
        state,
        { 
            service: 'ai_data_mapping_agent', 
            dataset: state.datasetId,
            userIntent: state.userIntent
        }
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
        Table: public."${state.tableName}" (use this EXACT format - include schema and quotes)
        
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
        1. Uses the table name EXACTLY as: public."${state.tableName}" (with schema and quotes)
        2. Groups by the dimension field (${state.fieldMapping.dimension})
        3. Aggregates the measure field (${state.fieldMapping.measure}) using SUM
        4. Filters out NULL values 
        5. Orders by aggregated value DESC for better pie chart readability
        6. Limits to reasonable number of categories (15 max)
        7. Handles any data quality issues: ${state.dataQuality.issues.join(', ')}
        
        CRITICAL: Always use public."${state.tableName}" for the table name - never use quotes around the entire name like ""table""
        
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

// AI Agent for Chart Specification Generation
class ChartSpecificationAgent {
    constructor(llm) {
        this.llm = llm;
    }

    async generatePieChartSpec(data, userIntent, fieldMapping, dataCharacteristics) {
        console.log('AI Agent generating pie chart specification');
        
        // Prepare data summary for the agent
        const dataSummary = {
            sampleData: data.slice(0, 3),
            totalRecords: data.length,
            fieldNames: {
                category: Object.keys(data[0])[0],
                value: Object.keys(data[0])[1]
            },
            dataCharacteristics
        };
        
        const agentPrompt = `You are a VChart specification expert. Your task is to generate a complete, valid VChart pie chart specification based on user intent and data.

CONTEXT:
- User Intent: "${userIntent}"
- Data Sample: ${JSON.stringify(dataSummary.sampleData)}
- Total Records: ${dataSummary.totalRecords}
- Field Names: Category="${dataSummary.fieldNames.category}", Value="${dataSummary.fieldNames.value}"
- Field Mapping: Dimension="${fieldMapping.dimension}", Measure="${fieldMapping.measure}"
- Data Quality: ${dataCharacteristics.dataQuality?.score || 'N/A'}

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- You MUST respond with ONLY a valid JSON object
- NO explanations, NO markdown, NO text before or after the JSON
- NO \`\`\`json code blocks - just the raw JSON
- Start your response with { and end with }
- Ensure the JSON is complete and properly closed

INSTRUCTIONS:
1. First, call the get_pie_chart_examples tool to get VChart examples and guidelines
2. Analyze the user intent to determine the best pie chart variation
3. Generate a complete VChart specification that matches the data structure
4. Ensure field names match the actual data (categoryField: "${dataSummary.fieldNames.category}", valueField: "${dataSummary.fieldNames.value}")

IMPORTANT REQUIREMENTS:
- Use actual field names from the data: "${dataSummary.fieldNames.category}" and "${dataSummary.fieldNames.value}"
- Follow all guidelines from the examples tool
- Ensure the spec is 100% JSON serializable (NO functions in tooltips!)
- Include proper title based on user intent
- Use VChart's automatic tooltip behavior: {"tooltip": {"mark": {"visible": true}}}

User Intent Analysis:
- If mentions "nested", "hierarchical", "breakdown": Consider nested pie chart
- If mentions "modern", "ring", "donut": Use donut/ring style  
- If simple request: Use basic pie chart
- Always match the data structure provided

RESPONSE FORMAT EXAMPLE:
{"type":"pie","data":[{"id":"id0","values":[]}],"categoryField":"${dataSummary.fieldNames.category}","valueField":"${dataSummary.fieldNames.value}","title":{"visible":true,"text":"Your Title"},"tooltip":{"mark":{"visible":true}}}`;

        try {
            // Create messages with tool calling capability
            const messages = [
                {
                    role: 'user',
                    content: agentPrompt
                }
            ];
            
            // Let the LLM call the tool and generate the spec
            const response = await this.llm.invoke(messages, {
                tools: [getAvailableChartsTool]
            });
            
            let specContent;
            
            // Check if the AI made tool calls (this is expected behavior)
            if (response.tool_calls && response.tool_calls.length > 0) {
                console.log('AI called tools, making follow-up request for chart specification');
                
                // Make a follow-up call without tools to get the actual chart spec
                const followUpPrompt = `Based on the VChart examples you've accessed, generate the pie chart specification for this data:

Data Sample: ${JSON.stringify(dataSummary.sampleData)}
Field Names: Category="${dataSummary.fieldNames.category}", Value="${dataSummary.fieldNames.value}"
User Intent: "${userIntent}"

CRITICAL: Respond with ONLY the JSON specification - no explanations, no markdown, no code blocks.
Start with { and end with }

Generate the VChart pie chart specification now:`;

                const followUpMessages = [
                    {
                        role: 'user',
                        content: followUpPrompt
                    }
                ];
                
                const followUpResponse = await this.llm.invoke(followUpMessages);
                specContent = followUpResponse.content;
                console.log('FULL FOLLOW-UP RESPONSE:', JSON.stringify(followUpResponse, null, 2));
                console.log('FULL FOLLOW-UP CONTENT:', specContent);
            } else {
                specContent = response.content;
            }
            
            // Validate response content exists
            if (!specContent || typeof specContent !== 'string') {
                console.error('Empty or invalid LLM response:', response);
                throw new Error('LLM returned empty or invalid response');
            }
            
            console.log('FULL SPEC CONTENT BEFORE PARSING:', specContent);
            
            // Clean up response if it has markdown
            if (specContent.includes('```json')) {
                specContent = specContent.split('```json')[1].split('```')[0];
            } else if (specContent.includes('```')) {
                specContent = specContent.split('```')[1].split('```')[0];
            }
            
            const trimmedContent = specContent.trim();
            if (!trimmedContent) {
                throw new Error('LLM response is empty after cleaning');
            }
            
            // Parse and validate the specification with retry mechanism
            let chartSpec;
            let parseAttempts = 0;
            const maxParseAttempts = 3;
            
            while (parseAttempts < maxParseAttempts) {
                try {
                    chartSpec = JSON.parse(trimmedContent);
                    console.log(`JSON parsing successful on attempt ${parseAttempts + 1}`);
                    break;
                } catch (parseError) {
                    parseAttempts++;
                    console.error(`JSON parsing failed on attempt ${parseAttempts}:`, parseError.message);
                    console.error('Content that failed to parse:', trimmedContent);
                    
                    if (parseAttempts < maxParseAttempts) {
                        console.log(`Retrying AI request (attempt ${parseAttempts + 1}/${maxParseAttempts})`);
                        
                        // Create a more specific retry prompt
                        const retryPrompt = `The previous response was not valid JSON. Here's what went wrong:
ERROR: ${parseError.message}
PREVIOUS RESPONSE: ${trimmedContent}

Please provide ONLY a valid JSON object for a VChart pie chart specification. 
Remember:
- Start with { and end with }
- No explanations, no markdown, no code blocks
- Use field names: categoryField: "${dataSummary.fieldNames.category}", valueField: "${dataSummary.fieldNames.value}"
- Valid JSON only!

Generate the corrected VChart specification:`;

                        const retryMessages = [
                            {
                                role: 'user',
                                content: retryPrompt
                            }
                        ];
                        
                        const retryResponse = await this.llm.invoke(retryMessages);
                        specContent = retryResponse.content;
                        console.log(`FULL RETRY ${parseAttempts} RESPONSE:`, JSON.stringify(retryResponse, null, 2));
                        console.log(`FULL RETRY ${parseAttempts} CONTENT:`, specContent);
                        
                        if (!specContent || typeof specContent !== 'string') {
                            throw new Error(`Retry attempt ${parseAttempts} returned empty response`);
                        }
                        
                        // Clean up response again
                        if (specContent.includes('```json')) {
                            specContent = specContent.split('```json')[1].split('```')[0];
                        } else if (specContent.includes('```')) {
                            specContent = specContent.split('```')[1].split('```')[0];
                        }
                        
                        trimmedContent = specContent.trim();
                        if (!trimmedContent) {
                            throw new Error(`Retry attempt ${parseAttempts} returned empty content after cleaning`);
                        }
                    } else {
                        throw new Error(`Failed to get valid JSON after ${maxParseAttempts} attempts. Last error: ${parseError.message}`);
                    }
                }
            }
            
            // Ensure data is properly set
            if (!chartSpec.data || !Array.isArray(chartSpec.data)) {
                chartSpec.data = [{ id: 'id0', values: data }];
            } else {
                chartSpec.data[0].values = data;
            }
            
            // Ensure field mapping is correct
            if (chartSpec.categoryField !== dataSummary.fieldNames.category) {
                chartSpec.categoryField = dataSummary.fieldNames.category;
            }
            if (chartSpec.valueField !== dataSummary.fieldNames.value) {
                chartSpec.valueField = dataSummary.fieldNames.value;
            }
            
            // For nested charts, also update series field mappings
            if (chartSpec.series && Array.isArray(chartSpec.series)) {
                chartSpec.series.forEach(series => {
                    if (series.type === 'pie') {
                        series.categoryField = dataSummary.fieldNames.category;
                        series.valueField = dataSummary.fieldNames.value;
                    }
                });
            }
            
            console.log('AI Agent successfully generated pie chart specification');
            console.log(`Chart type: ${chartSpec.type}, Data points: ${data.length}`);
            
            return {
                chartSpec,
                confidence: 0.9,
                reasoning: 'AI agent generated specification using VChart examples and user intent analysis'
            };
            
        } catch (error) {
            console.error('AI Agent failed to generate specification:', error.message);
            throw new Error(`Chart specification generation failed: ${error.message}`);
        }
    }
}

// VMind-inspired Step 3: AI Agent-Driven Chart Specification Generation
async function chartGenerationNode(state) {
    console.log('Starting AI Agent-driven chart specification generation');
    
    const stepFunction = async (state) => {
        if (!state.queryResults || state.queryResults.length === 0) {
            throw new Error('No query results available for chart generation');
        }
        
        // Standardize data format - keep original field names
        const keys = Object.keys(state.queryResults[0]);
        const categoryFieldName = keys.find(key => !['id', 'created_at'].includes(key.toLowerCase()) && 
                                           (key.toLowerCase().includes('category') || 
                                            key.toLowerCase().includes('type') ||
                                            key === state.fieldMapping.dimension)) || keys[0];
        const valueFieldName = keys.find(key => !['id', 'created_at'].includes(key.toLowerCase()) && 
                                        (key.toLowerCase().includes('value') || 
                                         key.toLowerCase().includes('count') ||
                                         key.toLowerCase().includes('amount') ||
                                         key === state.fieldMapping.measure)) || keys[1];
        
        const standardizedData = state.queryResults.map(row => {
            const result = {};
            result[categoryFieldName] = String(row[categoryFieldName] || 'Unknown');
            result[valueFieldName] = Number(row[valueFieldName]) || 0;
            return result;
        });
        
        console.log(`Data mapping: ${categoryFieldName} -> ${valueFieldName}`);
        console.log('Sample data:', standardizedData.slice(0, 2));
        
        // Create the AI Agent and generate chart specification
        const chartAgent = new ChartSpecificationAgent(llm);
        
        const result = await chartAgent.generatePieChartSpec(
            standardizedData,
            state.userIntent,
            {
                ...state.fieldMapping,
                categoryFieldName,
                valueFieldName
            },
            {
                categoryCount: standardizedData.length,
                hasTimeData: false,
                complexity: standardizedData.length <= 5 ? 'simple' : 
                           standardizedData.length <= 10 ? 'medium' : 'complex',
                dataQuality: state.dataQuality
            }
        );
        
        state.chartSpec = result.chartSpec;
        state.chartType = 'pie';
        state.currentStep = 'complete';
        state.processingSteps.push('ai_agent_chart_generation_completed');
        
        // Store AI agent metadata
        state.confidenceScore = result.confidence;
        state.aiReasoning = result.reasoning;
        
        console.log(`AI Agent chart generation completed. Confidence: ${state.confidenceScore}`);
        console.log(`AI reasoning: ${state.aiReasoning}`);
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'ai_agent_chart_generation',
        stepFunction,
        state,
        {
            dataLength: state.queryResults?.length,
            fieldMapping: state.fieldMapping,
            userIntent: state.userIntent
        }
    );
}

// VMind-inspired helper: Initialize generation record
async function initializeGeneration(state) {
    // Skip generation tracking for now since we don't have proper user authentication
    // TODO: Implement proper user ID extraction from request
    console.log('Skipping generation tracking - no user authentication implemented');
    state.generationId = uuidv4(); // Generate proper UUID format
    return state;
}

// VMind-inspired helper: Finalize generation record
async function finalizeGeneration(state) {
    if (!state.generationId) return state;
    
    // Skip database tracking for now
    const executionTime = Date.now() - state.startTime;
    console.log(`Generation completed: ${state.generationId}, execution time: ${executionTime}ms`);
    console.log(`Chart type: ${state.chartType}, successful: ${state.currentStep === 'complete'}`);
    
    return state;
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
    
    // Add enhanced AI-driven nodes
    workflow.addNode('initialize_generation', initializeGeneration);
    workflow.addNode('data_mapping_and_chart_selection', dataMappingAndChartSelectionNode);
    workflow.addNode('sql_generation', sqlGenerationNode); 
    workflow.addNode('chart_generation', chartGenerationNode);
    workflow.addNode('finalize_generation', finalizeGeneration);
    
    // Add edges for sequential processing
    workflow.addEdge('initialize_generation', 'data_mapping_and_chart_selection');
    workflow.addEdge('data_mapping_and_chart_selection', 'sql_generation');
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
                    generation_strategy: 'ai_agent_with_tools',
                    workflow_complete: finalState.currentStep === 'complete',
                    ai_reasoning: finalState.aiReasoning,
                    agent_approach: 'tool_assisted_generation'
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