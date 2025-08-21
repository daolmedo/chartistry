# VMind Library Study Guide

## Overview

VMind is an intelligent visualization component built on the VChart library that enables chart generation through natural language descriptions. It's part of the VisActor ecosystem and leverages large language models (LLMs) to automatically generate charts from data and user intents.

## Key Capabilities

### Core Features
1. **Intelligent Chart Generation** - Generate charts directly from natural language descriptions + data
2. **Intelligent Chart Editing** - Edit existing charts through conversational commands
3. **Intelligent Color Matching** - Generate stylized charts with appropriate color themes
4. **Text-to-Chart** - Extract data from text and generate charts in one step
5. **Data Processing** - Convert CSV/JSON data into chart-ready formats

### Supported Chart Types (25 total)
- Bar Chart, Line Chart, Area Chart, Pie Chart
- Scatter Plot, Word Cloud, Rose Chart, Radar Chart
- Sankey Chart, Funnel Chart, Dual Axis Chart, Waterfall Chart
- Box Plot, Dynamic Bar Chart (ranking bar)
- Liquid Chart, Progress Charts (Linear/Circular)
- Bubble Circle Packing, Map Chart, Range Column Chart
- Sunburst Chart, Treemap Chart, Gauge Chart
- Heatmap Chart, Venn Chart

## Installation & Setup

### NPM Installation
```bash
npm install @visactor/vmind
# Also need VChart for rendering
npm install @visactor/vchart
```

### Basic Initialization
```typescript
import VMind, { Model } from '@visactor/vmind';

const vmind = new VMind({
  model: Model.GPT4o, // or other supported models
  headers: {
    Authorization: `Bearer ${API_KEY}`
  },
  url: 'https://api.openai.com/v1/chat/completions', // optional
  maxTokens: 2048, // default
  temperature: 0 // default
});
```

### Supported Models
- OpenAI GPT series (GPT-3.5, GPT-4, GPT-4o)
- ByteDance Doubao series (doubao-lite-32K, doubao-pro-128k)
- DeepSeek models (deepseek-chat, deepseek-reasoner)
- Chart-advisor (rule-based, no LLM required)
- Any custom model via API

## Core API Methods

### 1. generateChart - Main Chart Generation
**Purpose**: Generate charts from structured data + user intent

```typescript
const { spec, chartType, cell, usage, time } = await vmind.generateChart(
  userPrompt,     // string: what you want to show
  fieldInfo,      // FieldInfo[]: data field descriptions
  dataset,        // optional: actual data (can generate template without)
  options         // optional: customization options
);
```

**Key Options**:
- `chartTypeList`: Restrict to specific chart types
- `colorPalette`: Custom colors or built-in themes (ArcoTheme, SemiTheme, etc.)
- `enableDataQuery`: Enable/disable data aggregation (default: true)
- `animationDuration`: Animation timing
- `theme`: 'light', 'dark', or custom theme

### 2. text2Chart - Generate from Text
**Purpose**: Extract data from text and generate charts in one step

```typescript
const { spec, dataTable, fieldInfo, chartType } = await vmind.text2Chart(
  text,           // string: raw text containing data
  userPrompt,     // string: what to extract and how to visualize
  options         // optional: same as generateChart
);
```

### 3. Data Processing Methods

#### parseCSVData - Convert CSV to VMind format
```typescript
const { fieldInfo, dataset } = vmind.parseCSVData(csvString);
```

#### getFieldInfo - Extract field info from JSON data
```typescript
const fieldInfo = vmind.getFieldInfo(dataset);
```

#### fillSpecWithData - Fill template with data
```typescript
const finalSpec = vmind.fillSpecWithData(specTemplate, dataset);
```

## Data Formats

### Dataset Structure
VMind uses flattened tabular data (same as VChart):
```typescript
type Dataset = Array<Record<string, number | string>>;

// Example:
const dataset = [
  { "Product": "Cola", "Region": "North", "Sales": 1000 },
  { "Product": "Cola", "Region": "South", "Sales": 1200 },
  // ...
];
```

### FieldInfo Structure
Describes data fields for the LLM:
```typescript
interface FieldInfo {
  fieldName: string;     // field name
  type: DataType;        // 'string', 'int', 'float', 'date', etc.
  role: ROLE;           // 'dimension' or 'measure'
  alias?: string;       // alternative name
  description?: string; // helps LLM understand field better
}
```

**Important**: Use semantic field names (e.g., "Product Name", "Sales") rather than generic ones (e.g., "column1", "data").

## Implementation Patterns

### Basic Chart Generation Workflow
```typescript
// 1. Prepare data
const csvData = `Product,Region,Sales
Cola,North,1000
Cola,South,1200
...`;

// 2. Process data
const { fieldInfo, dataset } = vmind.parseCSVData(csvData);

// 3. Generate chart
const userPrompt = "Show sales by product across regions";
const { spec, time } = await vmind.generateChart(userPrompt, fieldInfo, dataset);

// 4. Render with VChart
const vchart = new VChart(spec, { dom: 'chart-container' });
vchart.renderSync();
```

### Template-First Approach (for Dynamic Data)
```typescript
// 1. Generate template without data
const { spec: template, chartType, cell } = await vmind.generateChart(
  userPrompt, 
  fieldInfo  // no dataset parameter
);

// 2. Later, fill with actual data
const finalSpec = vmind.fillSpecWithData(template, dataset);
```

### Custom Styling
```typescript
// Built-in themes
import { ArcoTheme, SemiTheme, VeOTheme } from '@visactor/vmind';

const { spec } = await vmind.generateChart(userPrompt, fieldInfo, dataset, {
  colorPalette: ArcoTheme.colorScheme,
  theme: 'dark'
});

// Custom colors
const { spec } = await vmind.generateChart(userPrompt, fieldInfo, dataset, {
  colorPalette: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
});
```

## Advanced Features

### Data Aggregation
VMind can automatically aggregate data based on user intent:
```typescript
// This will aggregate data to show top performers
const userPrompt = "Show top 10 products by sales";
// enableDataQuery: true (default) will handle the aggregation
```

### Export to Video/GIF
```typescript
// Additional dependencies needed
import VChart from "@visactor/vchart";
import { ManualTicker, defaultTimeline } from "@visactor/vrender-core";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg/dist/ffmpeg.min.js';
import { createCanvas } from "canvas";

// Export as video
const videoSrc = await vmind.exportVideo(spec, time, {
  VChart, FFmpeg: ffmpeg, fetchFile,
  ManualTicker, defaultTimeline, createCanvas
});

// Export as GIF
const gifSrc = await vmind.exportGIF(spec, time, { /* same params */ });
```

### Chart Restrictions
```typescript
import { ChartType } from '@visactor/vmind';

// Limit to specific chart types
const { spec } = await vmind.generateChart(userPrompt, fieldInfo, dataset, {
  chartTypeList: [
    ChartType.BarChart,
    ChartType.LineChart,
    ChartType.PieChart
  ]
});
```

## Best Practices for MVP Development

### 1. Error Handling
```typescript
try {
  const { spec, chartType } = await vmind.generateChart(prompt, fieldInfo, dataset);
  // Success - render chart
} catch (error) {
  // Handle LLM failures, invalid data, etc.
  console.error('Chart generation failed:', error);
  // Fallback to rule-based generation or default chart
}
```

### 2. Optimize Token Usage
- Set `enableDataQuery: false` if data is pre-aggregated
- Use template generation for repeated chart types
- Provide clear, concise user prompts

### 3. Data Quality
- Ensure semantic field names
- Add descriptions to FieldInfo for better results
- Clean and validate data before processing

### 4. Progressive Enhancement
- Start with basic charts, add complexity gradually
- Use rule-based chart-advisor as fallback
- Implement caching for repeated requests

### 5. User Experience
- Show loading states during chart generation
- Provide chart editing capabilities through follow-up prompts
- Enable export features for sharing

## Integration Considerations

### Backend Architecture
- VMind can run in browser or Node.js
- Consider serverless functions for chart generation
- Implement request queuing for high volume

### Security
- Sanitize user inputs before passing to LLM
- Implement rate limiting
- Store API keys securely

### Performance
- Cache chart templates for common patterns
- Use CDN for VMind library delivery
- Consider lazy loading for chart components

## Limitations & Considerations

1. **LLM Dependency**: Requires API access to supported language models
2. **Token Costs**: Each chart generation consumes tokens
3. **Data Privacy**: Data is sent to LLM service (consider on-premise options)
4. **Chart Complexity**: Works best with standard chart types and clear data relationships
5. **Language Support**: Primarily optimized for English, though other languages may work

## Troubleshooting

### Common Issues
- **Empty Results**: Check field names are semantic, verify API keys
- **Wrong Chart Type**: Be more specific in user prompt
- **Styling Issues**: Use built-in themes or specify colorPalette
- **Performance**: Disable data aggregation if not needed

### Fallback Strategies
- Use `Model.CHART_ADVISOR` for rule-based generation
- Implement manual chart type selection
- Provide chart editing interface for refinements

This study guide provides the foundation for building an MVP with VMind. The library's strength lies in its natural language interface while maintaining the flexibility of the underlying VChart visualization engine.