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

// Tool for getting VChart pie chart examples and guidelines
const getPieChartExamplesTool = tool(
    async () => {
        return `
# VChart Pie Chart Examples and Guidelines

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

### 2. NESTED PIE CHART (Two Levels)
**When to use**: Hierarchical data with parent-child relationships
**Best for**: Category breakdowns, regional analysis, detailed segments
**IMPORTANT**: Requires TWO separate data arrays!

\`\`\`json
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
\`\`\`

### 3. RADIUS MAPPABLE PIE CHART
**When to use**: When you want to emphasize the relationship between parts
**Best for**: Pie charts can map data with internal and external radii by configuring custom scales.

\`\`\`json
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
\`\`\`

### 4. RING CHART
**When to use**: When there are a lot of categories
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

## 🔧 FIELD MAPPING INSTRUCTIONS

### Data Structure Requirements:
- **categoryField**: Must match the field name containing category labels
- **valueField**: Must match the field name containing numeric values
- **Data format**: Always use [{ id: 'id0', values: actualDataArray }]

### Example Field Mapping:
If your data looks like:
\`\`\`json
[{ "category": "Images", "total_count": 45 }]
\`\`\`

Then use:
\`\`\`json
{
  "categoryField": "category",
  "valueField": "total_count"
}
\`\`\`

---

## 📏 CHART SELECTION GUIDELINES

### Choose BASIC PIE when:
- 2-8 categories
- Simple distribution analysis
- All values are positive
- Clear category names

### Choose NESTED PIE when:
- Hierarchical data available
- Parent-child relationships exist
- User specifically requests "nested" or "hierarchical"
- Need to show breakdown within categories

### Choose DONUT when:
- Modern aesthetic needed
- Want to emphasize total vs parts
- Need space in center for additional info
- 3-6 categories work best

### Choose STYLED PIE when:
- Professional presentation
- Brand colors needed
- Interactive features desired
- Executive dashboard context

---

## ⚠️ TROUBLESHOOTING COMMON ISSUES

### Issue: Tooltip shows "{field_name}" instead of values
**Solution**: Use '"tooltip": { "mark": { "visible": true } }' - let VChart handle automatically

### Issue: Chart doesn't render
**Solution**: Check that categoryField and valueField match your actual data field names

### Issue: Data not showing
**Solution**: Ensure data is in format [{ id: 'id0', values: [...] }] and values are positive numbers

### Issue: Too many categories
**Solution**: Limit to top 8-10 categories, group others as "Others"

Remember: Keep it simple, match field names, and let VChart handle the complexity!
        `;
    },
    {
        name: "get_pie_chart_examples",
        description: "Get comprehensive VChart pie chart examples, guidelines, and best practices for generating pie chart specifications",
        schema: z.object({})
    }
);

// Initialize LLM
const llm = new ChatOpenAI({
    model: "gpt-5",
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
        
        // Fix table name casing in the generated SQL query
        const correctedQuery = sqlResult.sql_query.replace(
            new RegExp(`\\b${state.tableName.toLowerCase()}\\b`, 'gi'),
            `"${state.tableName}"`
        );
        
        console.log(`Testing SQL query: ${correctedQuery}`);
        const queryResults = await executeSqlQuery(correctedQuery, state.tableName);
        
        if (!queryResults || queryResults.length === 0) {
            throw new Error('SQL query returned no results');
        }
        
        if (queryResults.length > 20) {
            console.warn(`Query returned ${queryResults.length} rows, might create cluttered pie chart`);
        }
        
        state.sqlQuery = correctedQuery;
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

INSTRUCTIONS:
1. First, call the get_pie_chart_examples tool to get VChart examples and guidelines
2. Analyze the user intent to determine the best pie chart variation
3. Generate a complete VChart specification that matches the data structure
4. Ensure field names match the actual data (categoryField: "${dataSummary.fieldNames.category}", valueField: "${dataSummary.fieldNames.value}")

IMPORTANT REQUIREMENTS:
- Return ONLY the JSON specification - no explanations or markdown
- Use actual field names from the data
- Follow all guidelines from the examples tool
- Ensure the spec is 100% JSON serializable
- Include proper title based on user intent
- Use VChart's automatic tooltip behavior

User Intent Analysis:
- If mentions "nested", "hierarchical", "breakdown": Consider nested pie chart
- If mentions "modern", "ring", "donut": Use donut/ring style  
- If simple request: Use basic pie chart
- Always match the data structure provided

Generate the specification now:`;

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
                tools: [getPieChartExamplesTool]
            });
            
            let specContent = response.content;
            
            // Clean up response if it has markdown
            if (specContent.includes('```json')) {
                specContent = specContent.split('```json')[1].split('```')[0];
            } else if (specContent.includes('```')) {
                specContent = specContent.split('```')[1].split('```')[0];
            }
            
            // Parse and validate the specification
            const chartSpec = JSON.parse(specContent.trim());
            
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