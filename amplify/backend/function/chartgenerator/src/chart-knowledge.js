/**
 * VMind-Inspired Chart Knowledge System
 * Provides structured templates, examples, and rules for consistent chart generation
 */

// Standardized Pie Chart Knowledge Base
const PIE_CHART_KNOWLEDGE = {
    chartType: 'pie',
    
    // Consistent data structure - ALWAYS use this format
    dataStructure: {
        format: 'values',
        schema: {
            categoryField: 'category',
            valueField: 'value'
        }
    },
    
    visualChannels: ['angle', 'color', 'radius'],
    
    requirements: {
        minDimensions: 1,
        minMeasures: 1,
        maxCategories: 15,
        dataConstraints: [
            'All values must be positive numbers',
            'Category field should have reasonable cardinality (2-15 unique values)',
            'No missing or null values in key fields',
            'Values should represent parts of a whole'
        ],
        recommendedFor: [
            'categorical_distribution',
            'market_share_analysis', 
            'survey_results',
            'budget_allocation',
            'composition_analysis'
        ]
    },
    
    rules: [
        'Pie charts work best with 2-8 categories for readability',
        'Use donut chart variation when you need to emphasize total value',
        'Avoid pie charts for time series data',
        'Ensure all values are positive for meaningful visualization',
        'Order slices by value (largest to smallest) for better perception'
    ],
    
    examples: [
        {
            name: 'basic_pie',
            description: 'Simple pie chart for categorical data distribution',
            complexity: 'simple',
            categoryCount: { min: 2, max: 8 },
            bestFor: ['simple_distribution', 'few_categories', 'clear_data'],
            sampleData: [
                { type: 'oxygen', value: '46.60' },
                { type: 'silicon', value: '27.72' },
                { type: 'aluminum', value: '8.13' },
                { type: 'iron', value: '5' },
                { type: 'calcium', value: '3.63' }
            ],
            vchartSpec: {
                type: 'pie',
                data: [
                    {
                        id: 'id0',
                        values: [] // Will be populated with actual data
                    }
                ],
                outerRadius: 0.8,
                valueField: 'value',
                categoryField: 'type',
                title: {
                    visible: true,
                    text: 'Distribution Chart'
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
                                value: datum => datum['value']
                            }
                        ]
                    }
                }
            },
            useCase: 'Basic categorical data distribution with small number of categories'
        },
        
        {
            name: 'nested_pie',
            description: 'Nested pie chart for hierarchical data with two levels',
            complexity: 'complex',
            categoryCount: { min: 4, max: 20 },
            bestFor: ['hierarchical_data', 'two_dimensions', 'detailed_breakdown'],
            requiresMultipleDimensions: true,
            sampleData: {
                outer: [
                    { type: '0~29', value: '126.04' },
                    { type: '30~59', value: '128.77' },
                    { type: '60 and over', value: '77.09' }
                ],
                inner: [
                    { type: '0~9', value: '39.12' },
                    { type: '10~19', value: '43.01' },
                    { type: '20~29', value: '43.91' },
                    { type: '30~39', value: '45.4' },
                    { type: '40~49', value: '40.89' },
                    { type: '50~59', value: '42.48' }
                ]
            },
            vchartSpec: {
                type: 'common',
                data: [
                    {
                        id: 'id0',
                        values: [] // Outer ring data
                    },
                    {
                        id: 'id1',
                        values: [] // Inner ring data
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
                    text: 'Hierarchical Distribution Analysis'
                },
                legends: {
                    visible: true,
                    orient: 'left'
                }
            },
            useCase: 'Two-level hierarchical data analysis with parent-child relationships'
        },

        {
            name: 'radius_mappable_pie',
            description: 'Pie chart with radius mapped to data values for advanced visualization',
            complexity: 'complex',
            categoryCount: { min: 5, max: 12 },
            bestFor: ['value_emphasis', 'advanced_visualization', 'numeric_ranges'],
            sampleData: [
                { type: '0~9', value: '39.12' },
                { type: '10~19', value: '43.01' },
                { type: '20~29', value: '43.91' },
                { type: '30~39', value: '45.4' },
                { type: '40~49', value: '40.89' }
            ],
            vchartSpec: {
                type: 'pie',
                data: [
                    {
                        id: 'id0',
                        values: []
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
                    text: 'Value-Mapped Distribution Analysis'
                },
                legends: {
                    visible: true,
                    orient: 'right'
                }
            },
            useCase: 'When you want to emphasize magnitude differences through visual radius mapping'
        },

        {
            name: 'ring_chart',
            description: 'Stylish ring chart with rounded corners and hover effects',
            complexity: 'medium',
            categoryCount: { min: 3, max: 10 },
            bestFor: ['modern_design', 'interactive_focus', 'professional_presentation'],
            sampleData: [
                { type: 'oxygen', value: '46.60' },
                { type: 'silicon', value: '27.72' },
                { type: 'aluminum', value: '8.13' },
                { type: 'iron', value: '5' },
                { type: 'calcium', value: '3.63' }
            ],
            vchartSpec: {
                type: 'pie',
                data: [
                    {
                        id: 'id0',
                        values: []
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
                    text: 'Modern Ring Chart'
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
                                value: datum => datum['value']
                            }
                        ]
                    }
                }
            },
            useCase: 'Modern, interactive presentation with emphasis on design and user experience'
        },

        {
            name: 'gradient_pie',
            description: 'Pie chart with linear gradient colors for enhanced visual appeal',
            complexity: 'medium',
            categoryCount: { min: 4, max: 8 },
            bestFor: ['visual_appeal', 'presentations', 'brand_focus'],
            sampleData: [
                { type: 'oxygen', value: '46.60' },
                { type: 'silicon', value: '27.72' },
                { type: 'aluminum', value: '8.13' },
                { type: 'iron', value: '5' }
            ],
            vchartSpec: {
                type: 'pie',
                data: [
                    {
                        id: 'id0',
                        values: []
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
                    orient: 'left'
                },
                label: {
                    visible: true
                }
            },
            useCase: 'High-impact visual presentations with gradient color schemes'
        },

        {
            name: 'auto_wrap_labels',
            description: 'Pie chart optimized for long category names with auto-wrap labels',
            complexity: 'medium',
            categoryCount: { min: 3, max: 8 },
            bestFor: ['long_labels', 'detailed_categories', 'text_heavy_data'],
            sampleData: [
                { type: 'Long Category Name for Product A', value: 24 },
                { type: 'Category B', value: 20 },
                { type: 'Extended Product Category C Description', value: 18 }
            ],
            vchartSpec: {
                type: 'pie',
                data: [
                    {
                        id: 'id0',
                        values: []
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
                                    text: `${data.value}%\n`,
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
                                value: datum => datum['value']
                            }
                        ]
                    }
                }
            },
            useCase: 'Data with long category names that need proper text wrapping and formatting'
        }
    ],
    
    styleVariations: [
        {
            name: 'minimal',
            description: 'Clean minimal style without labels or legends',
            modifications: {
                legends: { visible: false },
                label: { visible: false },
                title: { visible: false }
            },
            when_to_use: ['dashboard_widget', 'embedded_chart', 'space_constrained']
        },
        {
            name: 'detailed',
            description: 'Comprehensive style with all information visible',
            modifications: {
                label: {
                    visible: true,
                    formatMethod: (label, datum, data) => {
                        const total = data.reduce((s,d) => s + d.value, 0);
                        const percentage = ((datum.value / total) * 100).toFixed(1);
                        return `${datum.category}: ${datum.value} (${percentage}%)`;
                    }
                },
                tooltip: {
                    mark: {
                        content: [
                            { key: 'Category', value: (datum) => datum["category"] },
                            { key: 'Value', value: (datum) => datum["value"].toLocaleString() },
                            { key: 'Percentage', value: (datum, data) => `${((datum.value / data.reduce((s,d) => s + d.value, 0)) * 100).toFixed(1)}%` }
                        ]
                    }
                },
                legends: {
                    visible: true,
                    orient: 'right',
                    item: {
                        value: {
                            formatMethod: (text, item, index, data) => `${text} (${data[index].value})`
                        }
                    }
                }
            },
            when_to_use: ['presentation', 'report', 'detailed_analysis']
        },
        {
            name: 'colorful',
            description: 'Enhanced color palette with gradient effects',
            modifications: {
                color: [
                    '#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', 
                    '#E86452', '#6DC8EC', '#945FB9', '#FF9845'
                ],
                pie: {
                    style: {
                        stroke: '#ffffff',
                        lineWidth: 2
                    },
                    state: {
                        hover: {
                            outerRadius: 0.85,
                            stroke: '#000',
                            lineWidth: 1
                        }
                    }
                }
            },
            when_to_use: ['marketing_material', 'public_presentation', 'brand_focused']
        }
    ],

    priority: 85 // High priority for categorical data
};

// Future chart types can be added here following the same structure
const CHART_KNOWLEDGE_BASE = {
    pie: PIE_CHART_KNOWLEDGE
    // bar: BAR_CHART_KNOWLEDGE, // Phase 2
    // line: LINE_CHART_KNOWLEDGE, // Phase 3
    // scatter: SCATTER_CHART_KNOWLEDGE // Phase 4
};

// Utility functions for chart knowledge system
class ChartKnowledgeManager {
    
    /**
     * Get appropriate chart template based on data characteristics
     */
    static selectChartTemplate(chartType, dataCharacteristics) {
        const knowledge = CHART_KNOWLEDGE_BASE[chartType];
        if (!knowledge) return null;

        // Find best matching example
        const examples = knowledge.examples.filter(example => {
            // Filter by complexity
            if (dataCharacteristics.complexity !== example.complexity && 
                example.complexity !== 'simple') return false;
            
            // For pie charts, consider category count
            if (chartType === 'pie' && dataCharacteristics.categoryCount > 10) {
                return example.name === 'donut_chart'; // Better for more categories
            }
            
            return true;
        });

        // Return highest priority example
        return examples.length > 0 ? examples[0] : knowledge.examples[0];
    }

    /**
     * AI-driven template selection based on data characteristics and user intent
     */
    static async selectOptimalTemplate(chartType, data, dataCharacteristics, userIntent, llm) {
        const knowledge = CHART_KNOWLEDGE_BASE[chartType];
        if (!knowledge) return null;

        const categoryCount = data.length;
        const hasLongLabels = data.some(d => d.category && d.category.length > 20);
        const valueRange = Math.max(...data.map(d => d.value)) - Math.min(...data.map(d => d.value));
        
        // Create template selection prompt
        const templateOptions = knowledge.examples.map((example, index) => {
            return `${index + 1}. ${example.name}: ${example.description}
   - Best for: ${example.bestFor.join(', ')}
   - Category count range: ${example.categoryCount.min}-${example.categoryCount.max}
   - Complexity: ${example.complexity}
   - Use case: ${example.useCase}`;
        }).join('\n\n');

        const selectionPrompt = `
You are an expert data visualization consultant. Select the best pie chart template for the given data and user intent.

User Intent: "${userIntent}"

Data Characteristics:
- Number of categories: ${categoryCount}
- Has long category labels: ${hasLongLabels}
- Value range variation: ${valueRange > 100 ? 'high' : valueRange > 20 ? 'medium' : 'low'}
- Data sample: ${JSON.stringify(data.slice(0, 3))}${data.length > 3 ? '...' : ''}

Available Templates:
${templateOptions}

Analyze the user intent for:
1. Specific chart type requests (basic, nested, ring, etc.)
2. Visual style preferences (modern, gradient, etc.)
3. Functional requirements (hierarchical data, emphasis on values, etc.)
4. Label/text requirements

Return JSON response:
{
  "selected_template": "template_name",
  "reasoning": "Why this template was chosen",
  "confidence": 0.85,
  "customizations": {
    "title_text": "Suggested title based on user intent",
    "legend_orient": "left|right|bottom",
    "show_percentages": true|false,
    "color_scheme": "default|gradient|custom",
    "interactive_features": ["hover", "selection"]
  }
}`;

        try {
            const response = await llm.invoke([{ role: 'user', content: selectionPrompt }]);
            let result = JSON.parse(response.content);
            
            // Find the selected template
            const selectedTemplate = knowledge.examples.find(t => t.name === result.selected_template);
            if (selectedTemplate) {
                return {
                    ...selectedTemplate,
                    aiRecommendation: result
                };
            }
        } catch (error) {
            console.warn('AI template selection failed, falling back to rule-based selection:', error.message);
        }

        // Fallback to rule-based selection
        return this.selectChartTemplate(chartType, dataCharacteristics);
    }

    /**
     * Post-process chart specification to fix function serialization and data mapping
     */
    static postProcessChartSpec(chartSpec, data, fieldMapping) {
        // Clone the spec to avoid mutation
        let processedSpec = JSON.parse(JSON.stringify(chartSpec));
        
        // Ensure data is properly formatted for VChart
        if (processedSpec.data && Array.isArray(processedSpec.data)) {
            processedSpec.data[0].values = data;
        } else {
            processedSpec.data = [{ id: 'id0', values: data }];
        }
        
        // Fix field mappings based on actual data structure
        const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
        if (dataKeys.length >= 2) {
            // Use first key as category field, second as value field
            processedSpec.categoryField = dataKeys[0];
            processedSpec.valueField = dataKeys[1];
            
            // Update series if it exists (for nested charts)
            if (processedSpec.series && Array.isArray(processedSpec.series)) {
                processedSpec.series.forEach(series => {
                    if (series.type === 'pie') {
                        series.categoryField = dataKeys[0];
                        series.valueField = dataKeys[1];
                    }
                });
            }
        }
        
        // Fix tooltip content to use actual JavaScript functions
        if (processedSpec.tooltip && processedSpec.tooltip.mark && processedSpec.tooltip.mark.content) {
            const categoryField = processedSpec.categoryField || dataKeys[0];
            const valueField = processedSpec.valueField || dataKeys[1];
            
            // Replace with actual functions that VChart can execute
            processedSpec.tooltip.mark.content = [
                {
                    key: datum => datum[categoryField],
                    value: datum => datum[valueField]
                }
            ];
        } else if (processedSpec.tooltip && processedSpec.tooltip.mark) {
            // Add default tooltip if none exists
            const categoryField = processedSpec.categoryField || dataKeys[0];
            const valueField = processedSpec.valueField || dataKeys[1];
            
            processedSpec.tooltip.mark.content = [
                {
                    key: datum => datum[categoryField],
                    value: datum => datum[valueField]
                }
            ];
        }
        
        return processedSpec;
    }

    /**
     * Apply AI-driven customizations to chart specification
     */
    static async customizeChartSpec(baseSpec, template, data, userIntent, fieldMapping, llm) {
        const customizationPrompt = `
You are a VChart specification expert. Customize this chart specification based on user intent and data characteristics.

User Intent: "${userIntent}"
Field Mapping: Category="${fieldMapping.dimension}", Value="${fieldMapping.measure}"
Data Sample: ${JSON.stringify(data.slice(0, 5))}

Base Template: ${template.name}
Template Recommendation: ${template.aiRecommendation ? template.aiRecommendation.reasoning : 'Rule-based selection'}

Current VChart Spec:
${JSON.stringify(baseSpec, null, 2)}

Customization Tasks:
1. Set appropriate title based on user intent and field names
2. Adjust legend position for optimal layout
3. Configure labels (show percentages if beneficial)
4. Set color scheme (gradient, categorical, or custom)
5. Configure tooltip content
6. Handle any specific user requests (nested charts, radius mapping, etc.)

Special Instructions:
- If user mentions "nested" or "hierarchical": use nested_pie template structure
- If user wants emphasis on values: consider radius mapping or gradient colors
- If user specifies specific columns: use those for categoryField/valueField
- Always use the data structure: [{ id: 'id0', values: data_array }]

Return the complete customized VChart specification as JSON.
IMPORTANT: For tooltip content, use this format:
{
  "key": "Display Name",
  "value": "{field_name}"
}
Do NOT use function syntax like "datum => datum['field']" as it will not work when serialized.
`;

        try {
            const response = await llm.invoke([{ role: 'user', content: customizationPrompt }]);
            let customizedSpec = response.content;
            
            // Clean up the response if it contains markdown code blocks
            if (customizedSpec.includes('```json')) {
                customizedSpec = customizedSpec.split('```json')[1].split('```')[0];
            }
            
            const parsedSpec = JSON.parse(customizedSpec);
            return this.postProcessChartSpec(parsedSpec, data, fieldMapping);
        } catch (error) {
            console.warn('AI customization failed, using base template:', error.message);
            // Return base template with basic customizations and post-processing
            const fallbackSpec = {
                ...baseSpec,
                title: {
                    ...baseSpec.title,
                    text: `${fieldMapping.dimension} Analysis - ${userIntent}`
                }
            };
            return this.postProcessChartSpec(fallbackSpec, data, fieldMapping);
        }
    }

    /**
     * Get style variation based on use case
     */
    static getStyleVariation(chartType, useCase) {
        const knowledge = CHART_KNOWLEDGE_BASE[chartType];
        if (!knowledge) return null;

        return knowledge.styleVariations.find(variation => 
            variation.when_to_use.includes(useCase)
        ) || null;
    }

    /**
     * Validate data against chart requirements
     */
    static validateDataForChart(chartType, data, fieldMapping) {
        const knowledge = CHART_KNOWLEDGE_BASE[chartType];
        if (!knowledge) return { valid: false, issues: ['Unknown chart type'] };

        const issues = [];
        const requirements = knowledge.requirements;

        // Check dimension/measure requirements
        if (fieldMapping.dimensions.length < requirements.minDimensions) {
            issues.push(`Requires at least ${requirements.minDimensions} dimension field(s)`);
        }
        if (fieldMapping.measures.length < requirements.minMeasures) {
            issues.push(`Requires at least ${requirements.minMeasures} measure field(s)`);
        }

        // Check category count for pie charts
        if (chartType === 'pie' && requirements.maxCategories) {
            const uniqueCategories = new Set(data.map(d => d[knowledge.dataStructure.schema.categoryField]));
            if (uniqueCategories.size > requirements.maxCategories) {
                issues.push(`Too many categories (${uniqueCategories.size}), maximum recommended: ${requirements.maxCategories}`);
            }
        }

        // Check data constraints
        if (chartType === 'pie') {
            const hasNegativeValues = data.some(d => d[knowledge.dataStructure.schema.valueField] < 0);
            if (hasNegativeValues) {
                issues.push('Pie charts require all positive values');
            }
        }

        return { valid: issues.length === 0, issues };
    }
}

/**
 * Enhanced chart generation workflow with AI-driven selection and customization
 */
class AIChartGenerator {
    constructor(llm) {
        this.llm = llm;
    }

    /**
     * Generate complete chart specification with AI assistance
     */
    async generateChartSpec({
        chartType = 'pie',
        data,
        userIntent,
        fieldMapping,
        dataCharacteristics = {}
    }) {
        console.log(`Starting AI-driven chart generation for ${chartType}`);
        
        // Step 1: AI selects optimal template
        const template = await ChartKnowledgeManager.selectOptimalTemplate(
            chartType, 
            data, 
            dataCharacteristics, 
            userIntent, 
            this.llm
        );
        
        if (!template) {
            throw new Error(`No suitable template found for ${chartType}`);
        }

        console.log(`Selected template: ${template.name}`);
        if (template.aiRecommendation) {
            console.log(`AI reasoning: ${template.aiRecommendation.reasoning}`);
        }

        // Step 2: Prepare base specification
        let baseSpec = JSON.parse(JSON.stringify(template.vchartSpec));
        
        // Set the data
        if (baseSpec.data && Array.isArray(baseSpec.data)) {
            baseSpec.data[0].values = data;
        } else {
            baseSpec.data = [{ id: 'id0', values: data }];
        }

        // Step 3: AI customizes the specification
        const finalSpec = await ChartKnowledgeManager.customizeChartSpec(
            baseSpec,
            template,
            data,
            userIntent,
            fieldMapping,
            this.llm
        );

        return {
            chartSpec: finalSpec,
            template: template.name,
            aiRecommendation: template.aiRecommendation,
            metadata: {
                generationApproach: 'ai_driven',
                templateUsed: template.name,
                customizationsApplied: template.aiRecommendation?.customizations || {},
                confidence: template.aiRecommendation?.confidence || 0.5
            }
        };
    }
}

module.exports = { 
    PIE_CHART_KNOWLEDGE, 
    CHART_KNOWLEDGE_BASE, 
    ChartKnowledgeManager,
    AIChartGenerator
};