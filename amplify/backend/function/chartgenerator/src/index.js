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

// Database configuration
const dbConfig = {
    host: "chartz-ai.cexryffwmiie.eu-west-2.rds.amazonaws.com",
    port: 5432,
    database: "chartz",
    user: "postgres",
    password: "ppddA4all.P",
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
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
    async () => {
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

---

## 🕰️ Date Field Handling Strategy

### When Dates Become Primary Visualization Elements:
- User mentions "trend", "over time", "timeline", "monthly", "yearly"
- Chart types: Line, Area, Time-series Bar
- Date field becomes X-axis dimension

### When Dates Become Filter Elements:
- User mentions filtering or date ranges in context
- Chart shows categorical data but user wants time filtering
- Date field becomes interactive filter, not main visualization

### When Dates Are Ignored:
- No temporal intent in user request
- Chart type doesn't support time (pie, basic bar)
- Dataset has dates but they're not relevant to the question

---

## 🎯 Selection Decision Matrix

| User Intent Pattern | Chart Type | Date Strategy | Confidence |
|--------------------|------------|---------------|------------|
| "distribution", "composition", "share" | pie | ignore dates | 0.9 |
| "breakdown by [category]" | pie | dates as filter only | 0.8 |
| "trend", "over time" | line (future) | dates as primary | 0.95 |
| "compare [categories]" | bar (future) | dates as filter | 0.85 |
| No clear intent + categorical + numeric | pie | smart date detection | 0.7 |

---

## 🚀 Future Chart Types (Not Yet Implemented)
- **Bar Chart**: Comparisons, rankings
- **Line Chart**: Trends, time series
- **Scatter Plot**: Correlations, relationships  
- **Area Chart**: Trends with magnitude
- **Histogram**: Distributions of continuous data
- **Heat Map**: Patterns in two dimensions

## 📏 Selection Algorithm
1. Parse user intent for chart type hints
2. Analyze field types and cardinalities
3. Detect temporal intent vs categorical intent
4. Match to available chart types
5. Plan for future interactivity (filters, drill-downs)
6. Return best match with confidence score
        `;
    },
    {
        name: "get_available_charts",
        description: "Get comprehensive chart type catalog, selection guidelines, and date handling strategies for current and future chart types",
        schema: z.object({})
    }
);

// Initialize LLM
const llm = new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize error recovery system
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
        
        // Parse metadata safely to avoid JSON parsing errors
        let parsedMetadata = {};
        if (metadata) {
            try {
                parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            } catch (parseError) {
                console.warn('Failed to parse metadata:', parseError.message);
                parsedMetadata = {};
            }
        }
        
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
            metadata: parsedMetadata,
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

// Enhanced workflow state management
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
        
        // Enhanced fields for future-ready architecture
        this.generationId = data.generationId || null;
        this.dataIntentAnalysis = data.dataIntentAnalysis || null;
        this.chartType = data.chartType || 'pie';
        this.fieldMapping = data.fieldMapping || null;
        this.confidenceScore = data.confidenceScore || 0.5;
        this.chartConfiguration = data.chartConfiguration || {};
        this.futureExtensibility = data.futureExtensibility || {};
        this.dataQuality = data.dataQuality || { score: 0.5, issues: [] };
        this.attemptCount = data.attemptCount || {};
        this.error = data.error || null;
        this.aiReasoning = data.aiReasoning || '';
        
        // Processing metadata
        this.processingSteps = data.processingSteps || [];
        this.startTime = data.startTime || Date.now();
    }
}

// Step 1: Data & Intent Analysis Agent (Future-Ready Architecture)
class DataIntentAnalysisAgent {
    constructor(llm, pool) {
        this.llm = llm;
        this.pool = pool;
    }

    async analyzeDataAndIntent(datasetId, tableName, userIntent, datasetStructure) {
        console.log('Step 1: Analyzing dataset and user intent for visualization');
        
        const dataContext = await this.gatherDataContext(datasetId, tableName, datasetStructure);
        
        const analysisPrompt = `You are a data visualization analyst. Analyze this dataset and user intent to understand what can be visualized and how.

USER INTENT: "${userIntent}"

DATASET ANALYSIS:
- **Table**: "${tableName}"
- **Fields**: ${JSON.stringify(dataContext.fields.map(f => ({
    name: f.column_name,
    type: f.data_type,
    unique_values: f.unique_count,
    sample_values: f.sample_values?.slice(0, 3) || [],
    cardinality_ratio: f.cardinality_ratio
})), null, 2)}

- **Sample Data**: ${JSON.stringify(dataContext.sampleData.slice(0, 3), null, 2)}

TASK: Categorize all fields for current and future visualization needs:

1. **Field Classification**:
   - Categorical: Good for chart dimensions/grouping (low cardinality)
   - Numeric: Good for chart measures/values (aggregatable)
   - Date/Time: Temporal fields (for trends, filtering)
   - Text/ID: Identifiers or descriptive (usually not for viz)

2. **Intent Analysis**:
   - What type of visualization is the user asking for?
   - Are dates relevant to their question?
   - What fields should be primary vs secondary vs filters?

3. **Future Interactivity Planning**:
   - Which fields could serve as filters?
   - Are there natural drill-down hierarchies?
   - Should dates enable time-based filtering?

RETURN JSON ONLY:
{
  "field_classification": {
    "categorical_fields": [
      {
        "field_name": "column_name",
        "cardinality": number,
        "role": "primary_dimension|secondary_dimension|grouping_option",
        "interactive_potential": "high|medium|low"
      }
    ],
    "numeric_fields": [
      {
        "field_name": "column_name",
        "role": "primary_measure|secondary_measure|derived_metric",
        "aggregation_types": ["SUM", "COUNT", "AVG"]
      }
    ],
    "date_fields": [
      {
        "field_name": "column_name",
        "date_type": "date|datetime|timestamp",
        "role": "primary_timeline|filter_dimension|metadata",
        "relevance_to_intent": "high|medium|low"
      }
    ],
    "other_fields": [
      {
        "field_name": "column_name",
        "field_type": "text|identifier|metadata",
        "visualization_utility": "none|tooltip|label"
      }
    ]
  },
  "intent_analysis": {
    "visualization_goal": "distribution|comparison|trend|correlation|composition",
    "temporal_aspect": "primary|filter|none",
    "complexity_level": "simple|medium|complex",
    "interactivity_needs": ["date_filtering", "category_filtering", "drill_down"]
  },
  "recommended_approach": {
    "primary_visualization_fields": {
      "dimensions": ["field_names"],
      "measures": ["field_names"],
      "dates": ["field_names"]
    },
    "filter_candidates": ["field_names_for_future_filtering"],
    "data_quality_score": 0.0-1.0
  }
}`;

        try {
            const response = await this.llm.invoke([{ role: 'user', content: analysisPrompt }]);
            
            let analysisContent = response.content;
            if (!analysisContent || typeof analysisContent !== 'string') {
                throw new Error('LLM returned empty or invalid response');
            }
            
            console.log('RAW DATA INTENT ANALYSIS:', analysisContent);
            
            // Parse AI analysis
            let analysis;
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
                analysis = JSON.parse(trimmedContent);
                console.log('PARSED DATA INTENT ANALYSIS:', JSON.stringify(analysis, null, 2));
            } catch (parseError) {
                console.error('Failed to parse data intent analysis:', parseError.message);
                console.error('Content that failed:', analysisContent);
                throw new Error(`Data intent analysis parsing failed: ${parseError.message}`);
            }
            
            const result = {
                fieldClassification: analysis.field_classification,
                intentAnalysis: analysis.intent_analysis,
                recommendedApproach: analysis.recommended_approach,
                dataContext: dataContext
            };
            
            console.log(`Data intent analysis completed. Goal: ${result.intentAnalysis.visualization_goal}, Temporal: ${result.intentAnalysis.temporal_aspect}`);
            
            return result;
            
        } catch (error) {
            console.error('Data and intent analysis failed:', error.message);
            throw new Error(`Data and intent analysis failed: ${error.message}`);
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
            
            return {
                fields: fieldsResult.rows,
                sampleData: sampleData,
                rowCount: datasetStructure.rowCount || 0,
                columnCount: datasetStructure.columnCount || fieldsResult.rows.length
            };
            
        } finally {
            client.release();
        }
    }
}

// Step 2: Chart Type & Field Mapping Agent
class ChartTypeSelectionAgent {
    constructor(llm) {
        this.llm = llm;
    }

    async selectChartAndMapFields(userIntent, dataIntentAnalysis) {
        console.log('Step 2: Selecting chart type and mapping fields');
        
        const selectionPrompt = `You are a chart selection specialist. Based on the data analysis and user intent, select the best chart type and map fields.

USER INTENT: "${userIntent}"

DATA ANALYSIS RESULTS:
- **Visualization Goal**: ${dataIntentAnalysis.intentAnalysis.visualization_goal}
- **Temporal Aspect**: ${dataIntentAnalysis.intentAnalysis.temporal_aspect}
- **Complexity**: ${dataIntentAnalysis.intentAnalysis.complexity_level}

**Available Fields**:
- Categorical: ${JSON.stringify(dataIntentAnalysis.fieldClassification.categorical_fields?.map(f => f.field_name) || [])}
- Numeric: ${JSON.stringify(dataIntentAnalysis.fieldClassification.numeric_fields?.map(f => f.field_name) || [])}
- Dates: ${JSON.stringify(dataIntentAnalysis.fieldClassification.date_fields?.map(f => f.field_name) || [])}

**Recommended Primary Fields**: ${JSON.stringify(dataIntentAnalysis.recommendedApproach.primary_visualization_fields)}

TASKS:
1. First call get_available_charts tool to see current options
2. Match user intent + data characteristics to best chart type
3. Map specific fields to chart roles
4. Plan for future interactive features

RETURN JSON ONLY:
{
  "selected_chart_type": "pie",
  "confidence_score": 0.0-1.0,
  "reasoning": "explanation of selection",
  "field_mapping": {
    "primary_dimension": "field_name",
    "primary_measure": "field_name",
    "secondary_fields": {},
    "filter_fields": ["field_names_for_future_filtering"],
    "date_fields": ["field_names_if_relevant"]
  },
  "chart_configuration": {
    "variation": "basic|donut|nested",
    "aggregation_method": "SUM|COUNT|AVG",
    "interactive_features": ["planned_interactions"],
    "date_handling": "primary|filter|ignore"
  },
  "future_extensibility": {
    "additional_chart_types_possible": ["chart_types"],
    "drill_down_potential": "high|medium|low",
    "filter_expansion_options": ["field_names"]
  }
}`;

        try {
            const messages = [{ role: 'user', content: selectionPrompt }];
            const response = await this.llm.invoke(messages, { tools: [getAvailableChartsTool] });
            
            let selectionContent;
            
            if (response.tool_calls && response.tool_calls.length > 0) {
                console.log('AI accessed chart catalog, making selection');
                
                const followUpPrompt = `Based on the chart catalog, make your selection for:

Intent: "${userIntent}"
Visualization Goal: ${dataIntentAnalysis.intentAnalysis.visualization_goal}
Best Fields: Categorical=${dataIntentAnalysis.recommendedApproach.primary_visualization_fields.dimensions?.[0]}, Numeric=${dataIntentAnalysis.recommendedApproach.primary_visualization_fields.measures?.[0]}

Provide your chart selection in exact JSON format:`;

                const followUpResponse = await this.llm.invoke([{ role: 'user', content: followUpPrompt }]);
                selectionContent = followUpResponse.content;
            } else {
                selectionContent = response.content;
            }
            
            console.log('RAW CHART SELECTION:', selectionContent);
            
            // Parse selection
            let chartSelection;
            try {
                let content = selectionContent;
                if (content.includes('```json')) {
                    content = content.split('```json')[1].split('```')[0];
                } else if (content.includes('```')) {
                    const codeBlocks = content.split('```');
                    if (codeBlocks.length >= 2) {
                        content = codeBlocks[1];
                    }
                }
                
                const trimmedContent = content.trim();
                chartSelection = JSON.parse(trimmedContent);
                console.log('PARSED CHART SELECTION:', JSON.stringify(chartSelection, null, 2));
            } catch (parseError) {
                console.error('Failed to parse chart selection:', parseError.message);
                throw new Error(`Chart selection parsing failed: ${parseError.message}`);
            }
            
            console.log(`Selected: ${chartSelection.selected_chart_type} (confidence: ${chartSelection.confidence_score})`);
            
            return chartSelection;
            
        } catch (error) {
            console.error('Chart selection failed:', error.message);
            throw new Error(`Chart selection failed: ${error.message}`);
        }
    }
}

// Step 1: Data & Intent Analysis Node
async function dataIntentAnalysisNode(state) {
    console.log(`Step 1: Analyzing data and intent for dataset ${state.datasetId}`);
    
    const stepFunction = async (state) => {
        // Get dataset structure for context
        const datasetStructure = await getDatasetStructure(state.datasetId, state.tableName);
        state.datasetStructure = datasetStructure;
        
        // Create and run data intent analysis agent
        const dataIntentAgent = new DataIntentAnalysisAgent(llm, pool);
        
        const analysisResult = await dataIntentAgent.analyzeDataAndIntent(
            state.datasetId,
            state.tableName,
            state.userIntent,
            datasetStructure
        );
        
        // Store analysis results in state
        state.dataIntentAnalysis = analysisResult;
        
        state.currentStep = 'chart_selection';
        state.processingSteps.push('data_intent_analysis_completed');
        
        console.log(`Data intent analysis completed. Visualization goal: ${analysisResult.intentAnalysis?.visualization_goal}`);
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'data_intent_analysis',
        stepFunction,
        state,
        { service: 'data_intent_analysis', dataset: state.datasetId }
    );
}

// Step 2: Chart Selection & Field Mapping Node
async function chartSelectionNode(state) {
    console.log('Step 2: Selecting chart type and mapping fields');
    
    const stepFunction = async (state) => {
        if (!state.dataIntentAnalysis) {
            throw new Error('Missing data intent analysis from previous step');
        }
        
        // Create and run chart selection agent
        const chartSelectionAgent = new ChartTypeSelectionAgent(llm);
        
        const selectionResult = await chartSelectionAgent.selectChartAndMapFields(
            state.userIntent,
            state.dataIntentAnalysis
        );
        
        // Update state with selection results
        state.chartType = selectionResult.selected_chart_type;
        state.fieldMapping = {
            dimension: selectionResult.field_mapping.primary_dimension,
            measure: selectionResult.field_mapping.primary_measure,
            additionalFields: selectionResult.field_mapping.secondary_fields || {},
            filterFields: selectionResult.field_mapping.filter_fields || [],
            dateFields: selectionResult.field_mapping.date_fields || []
        };
        state.confidenceScore = selectionResult.confidence_score;
        state.aiReasoning = selectionResult.reasoning;
        state.chartConfiguration = selectionResult.chart_configuration;
        state.futureExtensibility = selectionResult.future_extensibility;
        
        state.currentStep = 'sql_generation';
        state.processingSteps.push('chart_selection_completed');
        
        console.log(`Chart selection completed: ${state.chartType} with fields ${state.fieldMapping.dimension} -> ${state.fieldMapping.measure}`);
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'chart_selection',
        stepFunction,
        state,
        { service: 'chart_selection', userIntent: state.userIntent }
    );
}

// Step 3: SQL Generation (Enhanced for future filtering)
async function sqlGenerationNode(state) {
    console.log('Step 3: Generating SQL query for chart data');
    
    const stepFunction = async (state) => {
        if (!state.fieldMapping || !state.fieldMapping.dimension || !state.fieldMapping.measure) {
            throw new Error('Missing field mapping from chart selection step');
        }
        
        const sqlPrompt = `
        Generate a PostgreSQL query for chart data based on field mapping results.
        
        User Intent: "${state.userIntent}"
        Table: public."${state.tableName}" (use this EXACT format - include schema and quotes)
        Chart Type: ${state.chartType}
        
        Field Mapping:
        - Primary Dimension: ${state.fieldMapping.dimension}
        - Primary Measure: ${state.fieldMapping.measure}
        - Filter Fields (for future use): ${JSON.stringify(state.fieldMapping.filterFields)}
        - Date Fields (for future filtering): ${JSON.stringify(state.fieldMapping.dateFields)}
        
        Generate a SQL query that:
        1. Uses the table name EXACTLY as: public."${state.tableName}" (with schema and quotes)
        2. Groups by the dimension field (${state.fieldMapping.dimension})
        3. Aggregates the measure field (${state.fieldMapping.measure}) using ${state.chartConfiguration.aggregation_method || 'SUM'}
        4. Includes date fields for future filtering capability (even if not used in grouping)
        5. Filters out NULL values 
        6. Orders by aggregated value DESC for better chart readability
        7. Limits to reasonable number of categories (15 max for pie charts)
        
        CRITICAL: Always use public."${state.tableName}" for the table name
        
        Return JSON:
        {
            "sql_query": "SELECT ...",
            "expected_result_format": "description of expected output columns",
            "includes_filter_fields": true/false,
            "future_filter_potential": ["list of fields that could be filtered"]
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
            console.warn(`Query returned ${queryResults.length} rows, might create cluttered ${state.chartType} chart`);
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
            tableName: state.tableName,
            chartType: state.chartType
        }
    );
}

// Step 4: Chart Specification Generation (Enhanced for interactivity)
class ChartSpecificationAgent {
    constructor(llm) {
        this.llm = llm;
    }

    async generateChartSpec(data, chartType, userIntent, fieldMapping, chartConfiguration) {
        console.log(`Generating ${chartType} chart specification`);
        
        // For now, focus on pie charts, but structure for extensibility
        if (chartType === 'pie') {
            return await this.generatePieChartSpec(data, userIntent, fieldMapping, chartConfiguration);
        }
        
        throw new Error(`Chart type "${chartType}" not yet implemented`);
    }

    async generatePieChartSpec(data, userIntent, fieldMapping, chartConfiguration) {
        console.log('Generating VChart pie chart specification');
        
        const dataSummary = {
            sampleData: data.slice(0, 3),
            totalRecords: data.length,
            fieldNames: {
                category: Object.keys(data[0])[0],
                value: Object.keys(data[0])[1]
            }
        };
        
        const agentPrompt = `You are a VChart specification expert. Your task is to generate a complete, valid VChart pie chart specification based on user intent and data.

CONTEXT:
- User Intent: "${userIntent}"
- Chart Configuration: ${JSON.stringify(chartConfiguration)}
- Data Sample: ${JSON.stringify(dataSummary.sampleData)}
- Total Records: ${dataSummary.totalRecords}
- Field Names: Category="${dataSummary.fieldNames.category}", Value="${dataSummary.fieldNames.value}"
- Field Mapping: Dimension="${fieldMapping.dimension}", Measure="${fieldMapping.measure}"

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- You MUST respond with ONLY a valid JSON object
- NO explanations, NO markdown, NO text before or after the JSON
- NO \`\`\`json code blocks - just the raw JSON
- Start your response with { and end with }
- Ensure the JSON is complete and properly closed

INSTRUCTIONS:
1. First, call the get_available_charts tool to get VChart examples and guidelines
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
            const response = await this.llm.invoke([{ role: 'user', content: agentPrompt }], {
                tools: [getAvailableChartsTool]
            });
            
            let specContent;
            
            if (response.tool_calls && response.tool_calls.length > 0) {
                console.log('AI accessed chart guidelines, generating spec');
                
                const followUpPrompt = `Based on the VChart guidelines you've accessed, generate the pie chart specification for this data:

Data Sample: ${JSON.stringify(dataSummary.sampleData)}
Field Names: Category="${dataSummary.fieldNames.category}", Value="${dataSummary.fieldNames.value}"
User Intent: "${userIntent}"
Style: ${chartConfiguration.variation || 'basic'}

CRITICAL: Respond with ONLY the JSON specification - no explanations, no markdown, no code blocks.
Start with { and end with }

Generate the VChart pie chart specification now:`;

                const followUpResponse = await this.llm.invoke([{ role: 'user', content: followUpPrompt }]);
                specContent = followUpResponse.content;
            } else {
                specContent = response.content;
            }
            
            if (!specContent || typeof specContent !== 'string') {
                throw new Error('LLM returned empty or invalid response');
            }
            
            console.log('RAW CHART SPEC:', specContent);
            
            // Parse specification
            let chartSpec;
            try {
                let content = specContent;
                if (content.includes('```json')) {
                    content = content.split('```json')[1].split('```')[0];
                } else if (content.includes('```')) {
                    const codeBlocks = content.split('```');
                    if (codeBlocks.length >= 2) {
                        content = codeBlocks[1];
                    }
                }
                
                const trimmedContent = content.trim();
                chartSpec = JSON.parse(trimmedContent);
            } catch (parseError) {
                console.error('Failed to parse chart specification:', parseError.message);
                throw new Error(`Chart specification parsing failed: ${parseError.message}`);
            }
            
            // Ensure data is properly set
            if (!chartSpec.data || !Array.isArray(chartSpec.data)) {
                chartSpec.data = [{ id: 'id0', values: data }];
            } else {
                chartSpec.data[0].values = data;
            }
            
            // Ensure field mapping is correct
            chartSpec.categoryField = dataSummary.fieldNames.category;
            chartSpec.valueField = dataSummary.fieldNames.value;
            
            console.log(`Chart specification generated successfully for ${data.length} data points`);
            
            return {
                chartSpec,
                confidence: 0.9,
                reasoning: 'Generated using VChart guidelines and user intent analysis'
            };
            
        } catch (error) {
            console.error('Chart specification generation failed:', error.message);
            throw new Error(`Chart specification generation failed: ${error.message}`);
        }
    }
}

async function chartGenerationNode(state) {
    console.log('Step 4: Generating chart specification');
    
    const stepFunction = async (state) => {
        if (!state.queryResults || state.queryResults.length === 0) {
            throw new Error('No query results available for chart generation');
        }
        
        // Standardize data format
        const keys = Object.keys(state.queryResults[0]);
        const categoryFieldName = keys.find(key => 
            !['id', 'created_at'].includes(key.toLowerCase()) && 
            key === state.fieldMapping.dimension
        ) || keys[0];
        const valueFieldName = keys.find(key => 
            !['id', 'created_at'].includes(key.toLowerCase()) && 
            key === state.fieldMapping.measure
        ) || keys[1];
        
        const standardizedData = state.queryResults.map(row => {
            const result = {};
            result[categoryFieldName] = String(row[categoryFieldName] || 'Unknown');
            result[valueFieldName] = Number(row[valueFieldName]) || 0;
            return result;
        });
        
        console.log(`Data mapping: ${categoryFieldName} -> ${valueFieldName}`);
        
        // Create chart specification agent
        const chartAgent = new ChartSpecificationAgent(llm);
        
        const result = await chartAgent.generateChartSpec(
            standardizedData,
            state.chartType,
            state.userIntent,
            state.fieldMapping,
            state.chartConfiguration
        );
        
        state.chartSpec = result.chartSpec;
        state.currentStep = 'complete';
        state.processingSteps.push('chart_generation_completed');
        
        console.log('Chart generation completed successfully');
        
        return state;
    };
    
    return errorRecoverySystem.executeWithRecovery(
        'chart_generation',
        stepFunction,
        state,
        {
            dataLength: state.queryResults?.length,
            chartType: state.chartType
        }
    );
}

// Helper functions
async function initializeGeneration(state) {
    console.log('Initializing chart generation workflow');
    state.generationId = uuidv4();
    return state;
}

async function finalizeGeneration(state) {
    if (!state.generationId) return state;
    
    const executionTime = Date.now() - state.startTime;
    console.log(`Generation completed: ${state.generationId}, execution time: ${executionTime}ms`);
    console.log(`Chart type: ${state.chartType}, successful: ${state.currentStep === 'complete'}`);
    
    return state;
}

// Create the enhanced workflow
function createWorkflow() {
    const workflow = new StateGraph({
        channels: {
            // Core workflow fields
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
            
            // Enhanced fields for future-ready architecture
            generationId: { default: () => null },
            dataIntentAnalysis: { default: () => null },
            chartType: { default: () => 'pie' },
            fieldMapping: { default: () => null },
            confidenceScore: { default: () => 0.5 },
            chartConfiguration: { default: () => ({}) },
            futureExtensibility: { default: () => ({}) },
            dataQuality: { default: () => ({ score: 0.5, issues: [] }) },
            attemptCount: { default: () => ({}) },
            error: { default: () => null },
            aiReasoning: { default: () => '' },
            processingSteps: { default: () => [] },
            startTime: { default: () => Date.now() }
        }
    });
    
    // Add workflow nodes
    workflow.addNode('initialize_generation', initializeGeneration);
    workflow.addNode('data_intent_analysis', dataIntentAnalysisNode);
    workflow.addNode('chart_selection', chartSelectionNode);
    workflow.addNode('sql_generation', sqlGenerationNode);
    workflow.addNode('chart_generation', chartGenerationNode);
    workflow.addNode('finalize_generation', finalizeGeneration);
    
    // Add edges for sequential processing
    workflow.addEdge('initialize_generation', 'data_intent_analysis');
    workflow.addEdge('data_intent_analysis', 'chart_selection');
    workflow.addEdge('chart_selection', 'sql_generation');
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
        
        console.log(`Starting enhanced workflow for dataset ${dataset_id} with intent: ${user_intent}`);
        
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
                
                // Enhanced response with future-ready information
                generation_id: finalState.generationId,
                chart_type: finalState.chartType,
                field_analysis: {
                    primary_dimension: finalState.fieldMapping?.dimension,
                    primary_measure: finalState.fieldMapping?.measure,
                    filter_fields: finalState.fieldMapping?.filterFields || [],
                    date_fields: finalState.fieldMapping?.dateFields || [],
                    confidence_score: finalState.confidenceScore
                },
                processing_metadata: {
                    steps_completed: finalState.processingSteps,
                    execution_time_ms: Date.now() - finalState.startTime,
                    workflow_complete: finalState.currentStep === 'complete',
                    ai_reasoning: finalState.aiReasoning,
                    chart_configuration: finalState.chartConfiguration,
                    future_extensibility: finalState.futureExtensibility
                },
                data_quality: finalState.dataQuality
            })
        };
        
    } catch (error) {
        console.error('Error in enhanced workflow:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Enhanced workflow execution failed',
                details: error.message
            })
        };
    }
};