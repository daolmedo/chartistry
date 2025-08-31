# VMind Architecture Documentation

## Overview

VMind is an intelligent chart component based on Large Language Models (LLM) that provides dialog-based chart generation and editing capabilities. It converts natural language prompts into VChart specifications through a sophisticated atom-based architecture that orchestrates various specialized processing units.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │────│     VMind        │────│  VChart Spec    │
│ (Natural Lang)  │    │   Core System    │    │   (Output)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Schedule System │
                    │  (Atom Orchestr) │
                    └──────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────────┐
        │                  Atoms                              │
        ├─────────────┬─────────────┬─────────────┬───────────┤
        │ DATA_QUERY  │ CHART_CMD   │ CHART_GEN   │ DATA_*    │
        │             │             │             │           │
        └─────────────┴─────────────┴─────────────┴───────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   LLM Manager    │
                    │   (GPT/DeepSeek) │
                    └──────────────────┘
```

## End-to-End Chart Generation Flow

### Primary Workflow: How VMind Turns Natural Language into Charts

Imagine you tell VMind: *"Create a bar chart showing sales by region"* with your sales data. Here's exactly what happens behind the scenes:

**Entry Point**: `VMind.ts:242-291`

#### 🎯 Step 1: You Call VMind
```typescript
vmind.generateChart("Create a bar chart showing sales by region", fieldInfo, salesData)
```
**What happens**: VMind receives your request with:
- Your natural language description
- Information about your data fields (fieldInfo)
- Your actual dataset (salesData)

#### 🧠 Step 2: VMind Decides How to Help You
**Location**: `packages/vmind/src/applications/chartGeneration/index.ts:6-20`

VMind creates a "game plan" (called a Schedule) by asking:
- *"Should I use the Chart Advisor (built-in chart recommendations)?"*
- *"Or should I use the full AI pipeline?"*

**Two possible paths**:
- **Simple path**: `[CHART_GENERATE]` - Just use built-in chart advisor
- **Full AI path**: `[IMAGE_READER → DATA_QUERY → CHART_COMMAND → CHART_GENERATE]`

#### 🔄 Step 3: VMind Executes Its Game Plan
VMind runs through its chosen sequence of "atoms" (specialized workers):

**a) 🖼️ IMAGE_READER** *(if you provided an image)*
- **What it does**: Looks at your image and figures out what kind of chart you want
- **Example**: You upload a pie chart image → "User wants a pie chart"
- **Prompt Location**: `packages/vmind/src/atom/imageReader/prompt.ts:2-96`

**🔧 Prompt Details for LangGraph Implementation:**
- **Input**: Image file (chart screenshot/drawing)
- **Output**: 
```json
{
  "type": "bar|line|pie|radar|rose|scatter|...", // 25+ supported types
  "coordinate": "rect|polar|none",
  "data": [{"name": "A", "value": 123}],
  "palette": ["#333"],
  "axes": [{"type": "linear|band", "orient": "bottom|top|left|right"}],
  "legends": [{"type": "discrete|color|size", "orient": "top|bottom|left|right"}]
}
```
- **Key Features**: Distinguishes radar vs rose charts, handles composite charts, extracts visual elements

**b) 📊 DATA_QUERY** *(if data processing needed)*
- **What it does**: Transforms your request into SQL and processes your data
- **Example**: "sales by region" → `SELECT region, SUM(sales) FROM data GROUP BY region`
- **Prompt Location**: `packages/vmind/src/atom/dataQuery/prompt.ts:4-98`

**🔧 Prompt Details for LangGraph Implementation:**
- **Input**:
```typescript
{
  userCommand: "Show me sales by region",
  columnInfo: [
    {"fieldName": "region", "type": "string", "role": "dimension"},
    {"fieldName": "sales", "type": "float", "role": "measure"}
  ]
}
```
- **Output**:
```json
{
  "sql": "SELECT `region`, SUM(`sales`) AS `total_sales` FROM VMIND_DATA_SOURCE GROUP BY `region`",
  "fieldInfo": [
    {"fieldName": "region", "description": "The sales region"},
    {"fieldName": "total_sales", "description": "Aggregated sales amount by region"}
  ]
}
```
- **Key Constraints**: AlasqlSQL-compatible only, supported keywords: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT
- **Aggregations**: MAX(), MIN(), SUM(), COUNT(), AVG() - preserves field names with backticks

**c) 💭 CHART_COMMAND** *(if you didn't give specific instructions)*
- **What it does**: Creates a clear description of what chart to make
- **Example**: "Create a bar chart with regions on x-axis and sales totals on y-axis"
- **Prompt Location**: `packages/vmind/src/atom/chartCommand/prompt.ts:2-53`

**🔧 Prompt Details for LangGraph Implementation:**
- **Input**:
```typescript
{
  fieldInfo: [
    {"fieldName": "company", "type": "dimension", "dataLength": 2},
    {"fieldName": "profit", "type": "measure", "dataLength": 2}
  ],
  dataTable: [
    {"company": "Ali", "profit": 1000},
    {"company": "ByteDance", "profit": 800}
  ],
  summary: "Company financial data"
}
```
- **Output**:
```json
{
  "commands": ["Compare profit performance across companies"]
}
```
- **Focus Strategy**: Identifies MOST IMPORTANT measure fields, ignores incomplete data, supports Chinese/English

**d) ⚡ CHART_GENERATE** *(the main event)*
- **What it does**: Actually creates the chart specification using 4 different strategies
- **Prompt Location**: `packages/vmind/src/atom/chartGenerator/prompt/index.ts:75-120`

**🔧 Prompt Details for LangGraph Implementation:**
- **Input**:
```typescript
{
  userInput: "Create a bar chart showing sales by region",
  fieldInfo: [
    {"id": "region", "role": "dimension", "type": "string"},
    {"id": "sales", "role": "measure", "type": "numerical"}
  ]
}
```
- **Output**:
```json
{
  "CHART_TYPE": "BarChart", // Must be from supported list
  "FIELD_MAP": {
    "x": "region",      // Primary dimension
    "y": "sales",       // Primary measure (MUST be measure)
    "color": "region"   // Secondary dimension (MUST be dimension)
  },
  "stackOrPercent": "stack|percent", // Optional
  "transpose": false  // Optional: for horizontal layouts
}
```
- **Critical Constraints**: 
  - Color field MUST be dimension
  - Y-axis field MUST be measure
  - ALL fields MUST be mapped
  - Field names must match exactly from fieldInfo
- **Knowledge Base**: Uses `knowledges.ts` for chart-specific rules (See detailed explanation below)
- **Examples**: Uses `examples.ts` for curated examples per chart type (See detailed explanation below)

#### 🤖 Step 4: Chart Generation Strategy Decision
VMind chooses HOW to create your chart:

1. **🚀 Simple Spec**: If you already provided a chart spec → just transform it
2. **📏 Rule-based**: For simple charts with small data → use built-in rules
3. **🎯 Chart Advisor**: Use VisActor's chart recommendation engine
4. **🧠 LLM (AI)**: Ask GPT/DeepSeek to design the perfect chart

#### 🎨 Step 5: Chart Creation (The Magic Happens)

**If using AI (LLM Path)**:
1. **Prompt Creation**: VMind creates a detailed prompt with:
   - Your data structure and field types
   - Chart examples and best practices
   - Visualization rules and constraints
2. **AI Request**: Sends prompt to GPT/DeepSeek
3. **Response Processing**: Parses AI response to extract chart intent
4. **Context Building**: Prepares all information for final chart creation

**If using Chart Advisor**: 
- Uses VisActor's built-in intelligence to recommend optimal charts

**If using Rules**:
- Applies pre-programmed logic for common chart patterns

#### 🏭 Step 6: Chart Specification Assembly Line
**Location**: `packages/vmind/src/atom/chartGenerator/spec/index.ts:30-45`

VMind runs your chart through a 4-step assembly line:

1. **🔧 Type Correction** (`revisedVChartType`): 
   - *"Make sure chart type matches the data"*
   
2. **⚙️ Spec Generation** (`gen`):
   - *"Transform chart idea into actual VChart JSON specification"*
   - Uses `@visactor/generate-vchart` package with **Chart-Specific Transformers** (See detailed explanation below)
   
3. **✨ Formatting** (`fomartSimpleSpec`):
   - *"Clean up and standardize the specification"*
   
4. **🎬 Final Touches** (`afterPipe`):
   - *"Add chart type mapping and estimate animation time"*

#### 🎉 Step 7: You Get Your Chart!
VMind returns a complete package:
```typescript
{
  spec: { /* Complete VChart specification ready to render */ },
  chartType: "bar",
  time: 2500, // Animation duration in ms
  usage: { /* API usage stats */ },
  error: null
}
```

## 📋 Complete Data Flow Schema for LangGraph Implementation

Based on research of the VMind codebase, here's the exact data flow between atoms:

### 🔄 Context Flow & Input Sources

**Initial Context** (from `VMind.generateChart()`):
```typescript
interface InitialContext {
  // USER PROVIDED:
  fieldInfo: FieldInfoItem[];     // User's data field descriptions
  dataTable: DataTable;           // User's actual dataset  
  command: string;                // User's natural language prompt
  image?: string;                 // Optional: base64 image
  
  // SYSTEM GENERATED:
  query?: string;                 // Internal query processing
  usage?: Usage;                  // Token usage tracking
}
```

### 🖼️ IMAGE_READER Atom
**Input Source**: Initial user context from `VMind.generateChart()`
**Input Schema**:
```typescript
interface ImageReaderInput {
  image: string;  // base64 encoded image from user
}
```
**Output Schema**:
```typescript
interface ImageReaderOutput {
  simpleVChartSpec: SimpleVChartSpec;  // Extracted chart specification
  usage?: Usage;
  error?: string;
}

interface SimpleVChartSpec {
  type: "bar"|"line"|"pie"|"radar"|"rose"|"scatter"|"funnel"|"gauge"...; // 25+ types
  coordinate?: "rect"|"polar"|"none";
  data?: {name: string; value: number; group?: string}[];
  palette?: string[];
  axes?: {type: "linear"|"band"; orient: "top"|"bottom"|"left"|"right"}[];
  legends?: {type: "discrete"|"color"|"size"; orient: "top"|"bottom"|"left"|"right"}[];
  // ... many more optional visual elements
}
```
**Next Context**: All atoms share the updated context

### 📊 DATA_QUERY Atom  
**Input Source**: Context accumulated from previous atoms + initial user input
**Input Schema**:
```typescript
interface DataQueryInput {
  // FROM INITIAL CONTEXT:
  command: string;              // User's natural language prompt
  fieldInfo: FieldInfoItem[];   // User's field descriptions
  dataTable: DataTable;        // User's dataset
  
  // FROM PREVIOUS ATOMS (if any):
  // ... all previous context properties are available
}
```
**Processing**: Uses `command` (user prompt) and `fieldInfo` to generate SQL
**Output Schema**:
```typescript
interface DataQueryOutput {
  // ORIGINAL CONTEXT PRESERVED + NEW:
  sql: string;                    // Generated SQL query
  llmFieldInfo: FieldInfoItem[];  // LLM-generated field descriptions
  dataTable: DataTable;          // Query result dataset (UPDATED)
  fieldInfo: FieldInfoItem[];    // Updated field info (UPDATED)
  thoughts?: string;             // LLM reasoning
  usage?: Usage;
  error?: string;
}
```

### 💭 CHART_COMMAND Atom
**Input Source**: Context accumulated from previous atoms  
**Input Schema**:
```typescript
interface ChartCommandInput {
  // FROM PREVIOUS ATOMS:
  fieldInfo: FieldInfoItem[];   // Updated by DATA_QUERY or original
  dataTable: DataTable;        // Updated by DATA_QUERY or original
  
  // FROM DATA_QUERY (if ran):
  sql?: string;
  llmFieldInfo?: FieldInfoItem[];
  
  // FROM IMAGE_READER (if ran):
  simpleVChartSpec?: SimpleVChartSpec;
  
  // DERIVED BY CHART_COMMAND:
  text: string;        // Extracted from context for processing
  summary?: string;    // Generated summary of data
}
```
**Processing**: Uses `fieldInfo`, `dataTable`, and `text` to generate chart description
**Output Schema**:
```typescript
interface ChartCommandOutput {
  // ALL PREVIOUS CONTEXT + NEW:
  command: string;      // Generated chart description
  usage?: Usage;
  error?: string;
}
```

### ⚡ CHART_GENERATE Atom
**Input Source**: Context accumulated from ALL previous atoms
**Input Schema**:
```typescript
interface ChartGenerateInput {
  // FROM USER/INITIAL:
  fieldInfo: FieldInfoItem[];
  dataTable: DataTable;
  
  // FROM DATA_QUERY (if ran):
  sql?: string;
  llmFieldInfo?: FieldInfoItem[];
  
  // FROM CHART_COMMAND (if ran):  
  command: string;        // Chart description OR original user prompt
  
  // FROM IMAGE_READER (if ran):
  simpleVChartSpec?: SimpleVChartSpec;
  
  // CHART_GENERATE builds vizSchema from fieldInfo:
  vizSchema: {
    fields: Array<{
      id: string;
      role: "dimension"|"measure"; 
      type: "numerical"|"string"|"date"|"ratio";
      description?: string;
    }>;
  };
}
```
**Processing**: Uses `command` + `vizSchema` for LLM prompt, OR uses other generation modes
**Output Schema**:
```typescript
interface ChartGenerateOutput {
  // ALL PREVIOUS CONTEXT + NEW:
  chartType: string;           // Final chart type (e.g., "BarChart")
  cell: FieldMapping;          // Field-to-visual-channel mapping
  spec: any;                   // Final VChart specification  
  chartAdvistorRes?: any;      // Chart advisor results
  time: number;                // Animation duration
  usage?: Usage;
  error?: string;
}

interface FieldMapping {
  x?: string;        // Field name for x-axis
  y?: string;        // Field name for y-axis  
  color?: string;    // Field name for color channel
  size?: string;     // Field name for size channel
  angle?: string;    // Field name for angle (pie charts)
  // ... other visual channels
}
```

## 🎯 Critical Data Flow Rules for LangGraph

### 1. **Context Accumulation**
Each atom receives **ALL** previous context and adds its own outputs. Context is never lost.

### 2. **Conditional Execution**  
Atoms only run if their condition is met:
- `IMAGE_READER`: Only if `image` provided
- `DATA_QUERY`: Only if `enableDataQuery=true` AND no image
- `CHART_COMMAND`: Only if no `userCommand` AND no image
- `CHART_GENERATE`: Always runs (core atom)

### 3. **Input Transformation**
- **CHART_COMMAND** transforms context into specific input format for its prompt
- **CHART_GENERATE** builds `vizSchema` from `fieldInfo` for its prompt
- **DATA_QUERY** uses original user `command` directly

### 4. **Field Info Evolution**
```
User fieldInfo → DATA_QUERY updates fieldInfo → CHART_GENERATE uses updated fieldInfo
```

### 5. **Command Evolution**  
```
User prompt → (optional) CHART_COMMAND generates description → CHART_GENERATE uses final command
```

### 🌟 Real Example Walkthrough with Data Flow

**Input**: `"Show me sales trends over time"`
**Data**: `[{date: "2023-01", sales: 1000}, {date: "2023-02", sales: 1200}...]`

1. **Initial Context**:
   ```typescript
   {
     command: "Show me sales trends over time",
     fieldInfo: [{fieldName: "date", type: "date"}, {fieldName: "sales", type: "number"}],
     dataTable: [...],
     enableDataQuery: true
   }
   ```

2. **DATA_QUERY processes**:
   - Input: `command` + `fieldInfo`
   - Generates SQL: `SELECT date, SUM(sales) FROM data GROUP BY date ORDER BY date`
   - Updates context with query results

3. **CHART_COMMAND skipped** (user provided command)

4. **CHART_GENERATE processes**:
   - Input: Updated context with query results + original `command`
   - Builds `vizSchema` from updated `fieldInfo` 
   - LLM determines: `{CHART_TYPE: "LineChart", FIELD_MAP: {x: "date", y: "sales"}}`
   - Spec pipeline creates final VChart JSON

5. **Final Result**: Interactive line chart with time-series configuration

This data flow schema provides everything needed to implement VMind's logic in LangGraph nodes!

## 🧠 Knowledge System & Transformers Deep Dive

### Knowledge System in CHART_GENERATE (`Step 3d`)

When CHART_GENERATE creates its LLM prompt, it uses a sophisticated **knowledge system** to guide the AI:

#### **knowledges.ts - Chart Intelligence Brain**
**Location**: `packages/vmind/src/atom/chartGenerator/prompt/knowledges.ts`

The knowledge system provides **contextual intelligence** for chart selection:

```typescript
// Example from actual code:
export const chartKnowledgeDict: ChartKnowledge = {
  [ChartType.BarChart]: {
    index: 4,
    visualChannels: ['x', 'y', 'color'],
    examples: [barChartExample1],
    knowledge: ['Bar chart is suitable for categorical data comparisons']
  },
  [ChartType.DynamicBarChart]: {
    index: 1,
    visualChannels: ['x', 'y', 'color', 'time'],
    examples: [dynamicBarChart1],
    knowledge: [
      'Dynamic Bar Chart is suitable for showing ranking, comparisons or data changes over time. The x field and the time field MUST be different.'
    ]
  },
  [ChartType.LineChart]: {
    index: 5,
    visualChannels: ['x', 'y', 'color'],
    examples: [lineChart1, lineChart2],
    knowledge: ['Line chart is suitable for showing trends over continuous data']
  }
  // ... 25+ chart types total
};
```

**Key Features:**
- **Visual Channel Mappings**: Defines what fields can map to x, y, color, size for each chart type
- **Contextual Constraints**: Dynamically generates chart-specific requirements based on available chart types
- **Intelligence Rules**: Chart-specific guidance (e.g., "Dynamic bar charts need different x and time fields")

#### **examples.ts - Few-Shot Learning Examples** 
**Location**: `packages/vmind/src/atom/chartGenerator/prompt/examples.ts`

Provides **concrete examples** that teach the LLM expected input-output patterns:

```typescript
export const lineChartExample1 = (showThoughts: boolean) => `User Input: 帮我展示降雨量变化趋势.
Data field description: [
{
  "id": "日期",
  "description": "Represents the current month, which is a date.",
  "type": "string", 
  "role": "dimension"
},
{
  "id": "降雨量",
  "description": "Represents the rainfall in the current month, which is a number.",
  "type": "int",
  "role": "measure"
}]

Response:
\`\`\`
{
"CHART_TYPE": "Line Chart",
"FIELD_MAP": {
  "x": "日期",
  "y": "降雨量" 
},
"REASON": "User wants to show the trend of the rainfall, which is suitable for displaying with a line chart."
}
\`\`\``;
```

**How Knowledge System Works in Prompt Generation:**
1. **Filter Chart Types**: Based on user's available chart list
2. **Generate Contextual Knowledge**: Combines rules from multiple chart types
3. **Build Visual Channel Descriptions**: Creates dynamic field mapping rules
4. **Select Relevant Examples**: Picks 4 most relevant examples for the prompt

### Transformers in Spec Generation (`Step 6`)

After the LLM generates chart intent, **transformers** convert it into complete VChart specifications:

#### **Chart-Specific Transformation Pipelines**
**Location**: `packages/generate-vchart/src/transformers/`

**26 different transformers** covering every chart type, each with specialized pipeline:

```typescript
// Example: Bar Chart Transformer Pipeline
export const pipelineBar = [
  formatXFields,      // Format x-axis field mappings
  formatFieldsOfBar,  // Handle bar-specific field transformations  
  data,              // Add data configuration
  cartesianBar,      // Configure cartesian coordinate system
  colorBar,          // Apply color schemes/gradients
  seriesField,       // Set series field for grouping
  axis,              // Configure axes
  discreteLegend,    // Add legend configuration
  labelForDefaultHide, // Configure labels
  transposeField     // Handle horizontal bar charts
];

// Example: Pie Chart Transformer Pipeline  
export const pipelinePie = [
  formatAngleField,   // Map value field to angle
  formatColorField,   // Map category field to color
  data,              // Add data configuration
  categoryField,     // Configure category field
  valueField,        // Configure value field
  outerRadius,       // Set pie chart radius
  discreteLegend     // Add legend
];
```

**Transformer Categories:**

1. **Cartesian Charts** (Bar, Line, Area, Scatter):
   - Handle x/y axis mapping
   - Support stacking and percentages  
   - Apply gradients and themes

2. **Circular Charts** (Pie, Rose, Radar):
   - Map to angle/radius channels
   - Handle hierarchical data

3. **Specialized Charts** (Sankey, Funnel, Waterfall):
   - Custom field mappings (source/target for Sankey)
   - Specialized data transformations

4. **Progress Charts** (Liquid, Gauge, Progress):
   - Single value representations
   - Progress-specific styling

**Example Transformer Function:**
```typescript
// From cartesianBar transformer
export const cartesianBar = (context: GenerateChartInput) => {
  const { cell, fieldInfo, stackOrPercent, spec } = context;
  
  // Map LLM field choices to VChart specification
  spec.xField = flattenedXField;
  spec.yField = cell.y;
  
  // Handle color field for series grouping
  if (isValid(colorField)) {
    spec.seriesField = colorField;
  }
  
  // Apply stacking configuration
  if (spec.xField.length > 1 && stackOrPercent) {
    spec.stack = !!stackOrPercent;
    spec.percent = stackOrPercent === 'percent';
  }
  
  return { spec, cell: cellNew };
};
```

### Integration in Primary Workflow

#### **In CHART_GENERATE (Step 3d):**
1. **Prompt Assembly** uses knowledge system:
   ```typescript
   // From packages/vmind/src/atom/chartGenerator/prompt/index.ts:75-120
   export const getPrompt = (chartTypeList: ChartType[], showThoughts: boolean) => {
     // 1. Filter supported chart types using chartKnowledgeDict
     const supportedTypes = chartTypeList.filter(v => !!chartKnowledgeDict[v]);
     
     // 2. Generate contextual knowledge from multiple chart types
     const chartKnowledge = supportedTypes.reduce((res, chartType) => {
       const { knowledge } = chartKnowledgeDict[chartType];
       return [...res, ...(knowledge ?? [])];
     }, []);
     
     // 3. Build visual channel descriptions dynamically
     const visualChannelsStr = visualChannels
       .map(channel => `"${channel}": ${visualChannelInfoMap[channel](supportedTypes)}`)
       .join('\n');
     
     // 4. Select most relevant examples (4 max)
     const examplesStr = chartExamples.slice(0, 4).join('\n\n------------------------\n\n');
   };
   ```

2. **LLM Processing**: Receives intelligent prompt and returns structured field mappings

#### **In Spec Generation (Step 6):**
1. **Transformer Selection**:
   ```typescript
   // From packages/generate-vchart/src/pipeline.ts
   export const generateChart = (type: string, context: GenerateChartInput) => {
     // Find specific transformer pipeline for chart type
     const pipeline = findPipelineByType(type);  // e.g., pipelineBar for "BarChart"
     
     if (pipeline) {
       // Apply the transformer pipeline
       const chartSpecPipelines = [addSimpleComponents, ...pipeline.pipline, theme];
       let newContext = { ...context };
       chartSpecPipelines.forEach(func => {
         newContext = { ...newContext, ...func(newContext) };
       });
       return newContext;
     }
   };
   ```

2. **Pipeline Execution**: Each transformer function processes the context sequentially

### 🎯 For Your LangGraph Implementation

**Critical Components to Replicate:**

1. **Knowledge Integration Node**: 
   - Filter available chart types based on data characteristics
   - Generate contextual constraints dynamically
   - Select most relevant examples for few-shot learning

2. **Transformer Selection & Execution**: 
   - Map LLM output (`CHART_TYPE`) to appropriate transformer pipeline
   - Apply chart-specific transformations sequentially
   - Handle edge cases (stacking, transposition, etc.)

3. **Spec Generation Pipeline**: 
   - Convert field mappings to VChart configuration
   - Apply themes, colors, and styling consistently
   - Add interactive features (legends, axes, labels)

This two-tier architecture (**Intelligence** → **Implementation**) is what makes VMind so effective - the knowledge system ensures the LLM makes informed decisions, while the transformers ensure those decisions become pixel-perfect charts!

### Alternative Workflows:

#### text2Chart() Workflow
**Entry Point**: `VMind.ts:175-230`
- Combines data extraction with chart generation
- Schedule: [DATA_EXTRACT, DATA_CLEAN, CHART_COMMAND, CHART_GENERATE]

#### dataQuery() Workflow  
**Entry Point**: `VMind.ts:97-119`
- SQL-like data aggregation only
- Schedule: [DATA_QUERY]

## Core Architecture Components

### 1. VMind Class (Main Entry Point)
**Location**: `packages/vmind/src/core/VMind.ts:31-371`

The main VMind class is the primary interface that orchestrates all chart generation operations. It maintains multiple schedule instances and manages the overall workflow.

#### Key Properties:
- `options: VMindOptions` - Configuration options
- `llm: LLMManage` - LLM communication manager
- Multiple schedule instances for different workflows

#### Key Methods:
- `generateChart()` (`VMind.ts:242-291`) - Main chart generation from natural language
- `dataQuery()` (`VMind.ts:97-119`) - SQL-like data aggregation
- `text2Chart()` (`VMind.ts:175-230`) - End-to-end text to chart conversion
- `parseCSVData()` (`VMind.ts:75-79`) - CSV parsing without LLM
- `getInsights()` (`VMind.ts:293-309`) - Extract insights from generated charts

### 2. Schedule System (Workflow Orchestration)
**Location**: `packages/vmind/src/schedule/index.ts:8-137`

The Schedule system is VMind's **rule-based workflow orchestrator** that manages the sequential execution of atoms. It uses **predetermined schedules** based on use case patterns rather than dynamic AI planning.

**Key Concept**: Schedules are pre-defined atom chains that get conditionally executed based on business rules.

#### Schedule Types:
- `data2ChartSchedule` - Direct data → chart conversion
- `dataQuerySchedule` - SQL-like data aggregation only  
- `text2DataTableSchedule` - Text → structured data extraction
- `text2ChartSchedule` - End-to-end text → chart conversion
- `dataInsightSchedule` - Generate insights from chart specs

### 3. Atom-Based Architecture
**Location**: `packages/vmind/src/atom/*/index.ts`

Atoms are specialized processing units that handle specific aspects of chart generation. Each atom implements the `IBaseAtom` interface and can be LLM-powered or rule-based.

#### Primary Atoms:

##### 📊 DATA_QUERY Atom
**Location**: `packages/vmind/src/atom/dataQuery/index.ts`
- **Purpose**: Converts natural language into SQL queries for data aggregation
- **Input**: User command + column information
- **Output**: SQL query + field descriptions
- **Constraints**: Limited to AlasqlSQL-compatible operations

##### 💭 CHART_COMMAND Atom  
**Location**: `packages/vmind/src/atom/chartCommand/index.ts`
- **Purpose**: Creates concise visualization descriptions when user input is unclear
- **Input**: Field information + data table + summary
- **Output**: Clear chart description commands
- **Focus**: Identifies most important measure fields

##### ⚡ CHART_GENERATE Atom
**Location**: `packages/vmind/src/atom/chartGenerator/index.ts`
- **Purpose**: Core chart specification generation with 4 strategies:
  1. **Simple Spec**: Direct transformation if spec provided
  2. **Rule-based**: Built-in rules for simple charts
  3. **Chart Advisor**: VisActor's recommendation engine  
  4. **LLM**: AI-powered chart design
- **Input**: User input + field information
- **Output**: Chart type + field mappings + options

##### 🖼️ IMAGE_READER Atom
**Location**: `packages/vmind/src/atom/imageReader/index.ts`  
- **Purpose**: Analyzes uploaded images to extract chart specifications
- **Input**: Image file (chart screenshot/drawing)
- **Output**: Chart type, data, visual elements (axes, legends, colors)
- **Supports**: 25+ chart types including complex diagrams

#### Supporting Atoms:
- **DATA_EXTRACT**: Extracts structured data from text
- **DATA_CLEAN**: Cleans and processes extracted data  
- **DATA_INSIGHT**: Generates insights from chart specifications

### 4. LLM Integration System
**Location**: `packages/vmind/src/core/llm.ts:10-153`

The LLMManage class handles all communication with Language Models, supporting multiple providers and custom request functions.

#### Key Components:
- `options: ILLMOptions` - LLM configuration (URL, headers, model, etc.)
- `historys: Record<string, BaseContext[]>` - Conversation history per atom

#### Key Methods:
- `run()` (`llm.ts:37-96`) - Execute LLM requests with error handling
- `parseJson()` (`llm.ts:126-152`) - Parse JSON responses from LLM
- `parseTools()` (`llm.ts:98-124`) - Handle function calling responses

#### Supported Models:
- OpenAI GPT-3.5/4 models
- DeepSeek models  
- Doubao models
- Custom models via `customRequestFunc`


## End-to-End Chart Generation Flow

### Primary Workflow: How VMind Turns Natural Language into Charts

Imagine you tell VMind: *"Create a bar chart showing sales by region"* with your sales data. Here's exactly what happens behind the scenes:

**Entry Point**: `VMind.ts:242-291`

#### 🎯 Step 1: You Call VMind
```typescript
vmind.generateChart("Create a bar chart showing sales by region", fieldInfo, salesData)
```
**What happens**: VMind receives your request with:
- Your natural language description
- Information about your data fields (fieldInfo)
- Your actual dataset (salesData)

#### 🧠 Step 2: VMind Decides How to Help You
**Location**: `packages/vmind/src/applications/chartGeneration/index.ts:6-20`

VMind creates a "game plan" (called a Schedule) by asking:
- *"Should I use the Chart Advisor (built-in chart recommendations)?"*
- *"Or should I use the full AI pipeline?"*

**Two possible paths**:
- **Simple path**: `[CHART_GENERATE]` - Just use built-in chart advisor
- **Full AI path**: `[IMAGE_READER → DATA_QUERY → CHART_COMMAND → CHART_GENERATE]`


## Important File Locations Summary

### Core System
- **Main Entry**: `packages/vmind/src/core/VMind.ts`
- **Schedule System**: `packages/vmind/src/schedule/index.ts`
- **LLM Manager**: `packages/vmind/src/core/llm.ts`
- **Factory Pattern**: `packages/vmind/src/core/factory.ts`

### Chart Generation Pipeline
- **Chart Generator Atom**: `packages/vmind/src/atom/chartGenerator/index.ts`
- **Chart Generation Prompt**: `packages/vmind/src/atom/chartGenerator/prompt/index.ts`
- **Chart Spec Generation**: `packages/vmind/src/atom/chartGenerator/spec/index.ts`
- **Chart Advisor Integration**: `packages/vmind/src/atom/chartGenerator/advisor/index.ts`
- **Rule-based Generation**: `packages/vmind/src/atom/chartGenerator/rule/index.ts`

### Supporting Components  
- **Data Query Atom**: `packages/vmind/src/atom/dataQuery/index.ts`
- **Chart Command Atom**: `packages/vmind/src/atom/chartCommand/index.ts`
- **Data Extraction**: `packages/vmind/src/atom/dataExtraction/index.ts`
- **Data Cleaning**: `packages/vmind/src/atom/dataClean/index.ts`

### Application Schedules
- **Chart Generation Schedule**: `packages/vmind/src/applications/chartGeneration/index.ts`
- **Data Aggregation Schedule**: `packages/vmind/src/applications/dataAggregation/index.ts`
- **Data Extraction Schedule**: `packages/vmind/src/applications/dataExtraction/index.ts`

### Types and Interfaces
- **Atom Types**: `packages/vmind/src/types/atom.ts`
- **Chart Types**: `packages/vmind/src/types/chart.ts`
- **LLM Types**: `packages/vmind/src/types/llm.ts`

## Making Changes to the Decision Pipeline

To modify VMind's chart generation decision-making:

### 1. **Modify Generation Strategy Selection**
Edit `packages/vmind/src/atom/chartGenerator/index.ts:111-145`
- Add new conditions in `runBeforeLLM()`
- Introduce new generation types
- Modify the decision tree logic

### 2. **Update Chart Type Support**
Edit `packages/vmind/src/atom/chartGenerator/const.ts`
- Modify `SUPPORTED_CHART_LIST`
- Add new chart type mappings

### 3. **Enhance LLM Prompts**
Edit `packages/vmind/src/atom/chartGenerator/prompt/`
- Modify `index.ts` for main prompt logic
- Update `knowledges.ts` for chart-specific rules
- Add examples in `examples.ts`

### 4. **Modify Rule-based Logic**  
Edit `packages/vmind/src/atom/chartGenerator/rule/index.ts:15-31`
- Update `getRuleLLMContent()` function
- Add new rule conditions

### 5. **Customize Chart Advisor Integration**
Edit `packages/vmind/src/atom/chartGenerator/advisor/index.ts`
- Modify `getCellContextByAdvisor()` 
- Update chart type mappings
- Adjust scoring logic

### 6. **Schedule Modification**
Edit `packages/vmind/src/applications/chartGeneration/index.ts`
- Modify `getData2ChartSchedule()`
- Change atom execution order
- Add/remove atoms from the pipeline

This architecture provides a flexible, extensible system for natural language to chart generation, with clear separation of concerns and multiple fallback strategies for robust chart creation.