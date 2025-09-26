---
type: "block-templates"
description: "Reusable blog content blocks for consistent messaging"
---

# Blog Block Templates

This file contains reusable content blocks that can be injected into any blog post for consistent messaging and variations.

## Combined Why Chartz Sections (RECOMMENDED)

These generate a complete H2 section with the main value proposition and 3 randomly selected feature blocks as H3 subsections:

### Data Visualization Section
```
{whyChartzSection:dataVisualization}
```

### Data Analytics Section
```
{whyChartzSection:dataAnalytics}
```

### Dashboard Creation Section
```
{whyChartzSection:dashboardCreation}
```

## Individual Blocks (for specific use cases)

### Why Chartz Blocks (H3 level)
```
{whyChartzBlock:dataVisualization}
{whyChartzBlock:dataAnalytics}
{whyChartzBlock:dashboardCreation}
```

### Feature Blocks (standalone)
```
{featureBlock:zeroLearningCurve}
{featureBlock:aiQueriesData}
{featureBlock:automaticChartBuilding}
{featureBlock:dateFiltering}
{featureBlock:multipleDataSources}
```

## Usage Examples

### In Regular Blog Posts (RECOMMENDED)
```markdown
# How to Transform Your Business Reporting

Traditional reporting tools are complex and time-consuming...

{whyChartzSection:dataAnalytics}

## Getting Started with Implementation

Now that you understand the benefits, here's how to get started...
```

### In Template Files
```markdown
# Chart Creation Guide

Complex visualization tools require extensive training...

{whyChartzSection:dataVisualization}

## Step-by-Step Process

Follow these simple steps to create your first chart...
```

### With Specific Features (Advanced)
```markdown
{whyChartzSection:dataVisualization:zeroLearningCurve,aiQueriesData,dateFiltering}
```

## Block Syntax

### Combined Sections (RECOMMENDED)
- `{whyChartzSection:dataVisualization}` - H2 section + 3 random features as H3
- `{whyChartzSection:dataAnalytics}` - H2 section + 3 random features as H3
- `{whyChartzSection:dashboardCreation}` - H2 section + 3 random features as H3

### Specific Feature Selection
- `{whyChartzSection:dataVisualization:feature1,feature2,feature3}` - Choose specific features

Available features: `zeroLearningCurve`, `aiQueriesData`, `automaticChartBuilding`, `dateFiltering`, `multipleDataSources`

### Individual Blocks (Legacy/Specific Use Cases)
- `{whyChartzBlock:dataVisualization}` - Individual H3 block
- `{featureBlock:zeroLearningCurve}` - Standalone feature block

### Variation Control (Individual Blocks)
- `{featureBlock:zeroLearningCurve:random}` - Random variation
- `{featureBlock:zeroLearningCurve:0}` - First variation
- `{featureBlock:zeroLearningCurve:1}` - Second variation

## Generated HTML Structure

### Combined Section (Recommended)
```markdown
## Why Businesses Choose Chartz for Data Visualization

Traditional data visualization tools require extensive training, expensive licenses, and hours of manual work. Chartz transforms how businesses create visual insights with AI-powered simplicity.

**Transform your data into stunning visualizations without the complexity of traditional tools like Tableau or Power BI.**


### 🚀 Zero Learning Curve

![Chartz.ai welcome screen showing intuitive interface for getting started](/blog/images/welcome-to-chartz-ai.png)

#### No Training Required

Start creating professional charts immediately. Our AI understands natural language, so you can describe what you want instead of learning complex software interfaces.

- Instant productivity
- No onboarding time
- Intuitive interactions


### 🧠 AI Queries Your Data

![AI-powered SQL query interface showing natural language data querying](/blog/images/sql.png)

#### Intelligent Data Discovery

Our AI automatically understands your data structure, identifies key patterns, and suggests the most relevant visualizations for your specific dataset.

- Automatic schema detection
- Pattern recognition
- Smart recommendations


### 📅 Intelligent Date Filtering

![Date filtering interface showing flexible time range selection options](/blog/images/date-filter.png)

#### Time-Smart Analytics

Automatically detect date patterns in your data and enable intuitive time-based filtering: 'Show me last quarter' or 'Compare year-over-year trends.'

- Automatic date recognition
- Flexible time periods
- Trend analysis

```

## Feature Block Images

Each feature block now includes relevant product screenshots:

- **Zero Learning Curve** → `welcome-to-chartz-ai.png` (Welcome/getting started interface)
- **AI Queries Your Data** → `sql.png` (AI-powered SQL querying interface)
- **Automatic Dynamic Chart Creation** → `dashboard.png` (Generated dashboard with charts)
- **Intelligent Date Filtering** → `date-filter.png` (Date filtering UI components)
- **Multiple Data Source Integration** → `data-source-dashboard.png` (Data source selection interface)