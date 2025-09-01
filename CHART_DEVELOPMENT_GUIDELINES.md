# Chart Development Guidelines

This document provides essential guidelines for adding new chart types to the AI-driven chart generation system.

## Core Principle: JSON Serializable Charts Only

**CRITICAL**: All chart specifications must be 100% JSON serializable to avoid frontend patches and maintain scalability.

## Tooltip Configuration Rules

### ❌ NEVER Use JavaScript Functions in Templates
```javascript
// ❌ DON'T DO THIS - Functions break JSON serialization
tooltip: {
    mark: {
        content: [
            {
                key: datum => datum['field'],
                value: datum => datum['value']
            }
        ]
    }
}
```

### ✅ ALWAYS Use VChart's Automatic Behavior
```json
// ✅ DO THIS - JSON serializable, works automatically
{
    "tooltip": {
        "mark": {
            "visible": true
        }
    }
}
```

### Alternative: Style-Only Configuration
```json
{
    "tooltip": {
        "mark": {
            "visible": true
        },
        "style": {
            "panel": {
                "backgroundColor": "rgba(0,0,0,0.8)",
                "border": {
                    "color": "#ccc",
                    "width": 1,
                    "radius": 4
                }
            },
            "keyLabel": {
                "fontSize": 12,
                "fill": "white"
            },
            "valueLabel": {
                "fontSize": 12,
                "fill": "white"
            }
        }
    }
}
```

## Chart Template Structure

When adding new chart types, follow this structure:

```javascript
{
    name: 'chart_type_name',
    description: 'Clear description of when to use this chart',
    complexity: 'simple|medium|complex',
    categoryCount: { min: 2, max: 15 }, // For applicable charts
    bestFor: ['use_case_1', 'use_case_2', 'use_case_3'],
    sampleData: [
        { field1: 'value1', field2: 100 },
        { field1: 'value2', field2: 200 }
    ],
    vchartSpec: {
        type: 'chart_type',
        data: [
            {
                id: 'id0',
                values: [] // Will be populated with actual data
            }
        ],
        // Chart-specific configuration...
        tooltip: {
            mark: {
                visible: true
            }
        }
    },
    useCase: 'Detailed description of when this template is optimal'
}
```

## Field Mapping Best Practices

### Dynamic Field Detection
The system automatically detects field names from SQL results:

- **Category fields**: Look for `category`, `type`, or the dimension field name
- **Value fields**: Look for `value`, `count`, `amount`, or the measure field name
- **Fallback**: Use first available field as category, second as value

### Post-Processing Requirements
Every chart template must work with the `postProcessChartSpec` function:

```javascript
// Fields are automatically mapped
processedSpec.categoryField = actualCategoryFieldName;
processedSpec.valueField = actualValueFieldName;

// Data structure is standardized
processedSpec.data = [{ id: 'id0', values: actualData }];
```

## AI Prompt Guidelines

When creating AI customization prompts, always include:

```javascript
const customizationPrompt = `
IMPORTANT: For tooltip content, NEVER use JavaScript functions. 
Use this format only:
{
  "tooltip": {
    "mark": {
      "visible": true
    }
  }
}

VChart will automatically display field names and values from the data.
`;
```

## Chart Type Checklist

Before adding a new chart type, ensure:

- [ ] All configurations are JSON serializable
- [ ] No JavaScript functions in tooltip content
- [ ] Template works with dynamic field names
- [ ] AI customization prompt includes tooltip guidelines
- [ ] Sample data matches expected field structure
- [ ] `postProcessChartSpec` handles the chart type correctly
- [ ] Tested with various field name combinations

## Common Chart Types Field Mappings

### Pie Charts
```json
{
    "categoryField": "dynamic_category_field",
    "valueField": "dynamic_value_field"
}
```

### Bar Charts
```json
{
    "xField": "dynamic_category_field",
    "yField": "dynamic_value_field"
}
```

### Line Charts
```json
{
    "xField": "dynamic_x_field", 
    "yField": "dynamic_y_field"
}
```

### Scatter Plots
```json
{
    "xField": "dynamic_x_field",
    "yField": "dynamic_y_field", 
    "sizeField": "dynamic_size_field" // Optional
}
```

## Testing Requirements

For each new chart type, test:

1. **JSON Serialization**: `JSON.stringify(chartSpec)` should work without data loss
2. **Field Name Variations**: Test with different SQL field names
3. **Data Sizes**: Test with small (2-3) and large (15+) datasets
4. **Tooltip Display**: Verify tooltips show actual field values, not function strings
5. **AI Customization**: Ensure LLM can modify specs without breaking serialization

## Error Prevention

### Function Serialization Check
```javascript
// ❌ This will become "{}" in JSON.stringify
const badTooltip = {
    content: [{
        key: datum => datum.field
    }]
};

// ✅ This preserves structure
const goodTooltip = {
    mark: { visible: true }
};
```

### Debugging Tips
```javascript
// Check if functions exist (they shouldn't)
console.log('Tooltip content type:', typeof chartSpec.tooltip?.mark?.content?.[0]?.key);
// Should log: "undefined" (good) not "function" (bad)
```

## Documentation Requirements

When adding a new chart type, update:

1. This guidelines document with chart-specific field mappings
2. Chart knowledge templates with proper examples
3. AI prompts with chart-type-specific instructions
4. Test cases for the new chart type

## Future Extensibility

This pattern ensures:
- **No frontend patches needed** for new chart types
- **Scalable AI customization** without breaking serialization  
- **Maintainable codebase** with consistent patterns
- **Reliable tooltip behavior** across all chart types

Remember: **If it needs a JavaScript function, find a VChart configuration that doesn't.**