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
            sampleData: [
                { category: 'Product A', value: 30 },
                { category: 'Product B', value: 45 },
                { category: 'Product C', value: 25 }
            ],
            vchartSpec: {
                type: 'pie',
                data: {
                    values: [] // Will be populated with actual data
                },
                categoryField: 'category',
                valueField: 'value',
                outerRadius: 0.8,
                title: {
                    visible: true,
                    text: 'Distribution Chart'
                },
                legends: {
                    visible: true,
                    orient: 'right'
                },
                label: {
                    visible: true
                },
                tooltip: {
                    mark: {
                        content: [
                            {
                                key: 'Category',
                                value: (datum) => datum['category']
                            },
                            {
                                key: 'Value',
                                value: (datum) => datum['value']
                            }
                        ]
                    }
                }
            },
            useCase: 'Basic categorical data distribution with small number of categories'
        },
        
        {
            name: 'donut_chart',
            description: 'Donut chart variation with inner radius for better center focus',
            complexity: 'simple',
            sampleData: [
                { category: 'Region North', value: 120 },
                { category: 'Region South', value: 95 },
                { category: 'Region East', value: 87 },
                { category: 'Region West', value: 110 }
            ],
            vchartSpec: {
                type: 'pie',
                data: {
                    values: [] // Will be populated
                },
                categoryField: 'category',
                valueField: 'value',
                outerRadius: 0.8,
                innerRadius: 0.4, // Creates donut effect
                title: {
                    visible: true,
                    text: 'Regional Distribution'
                },
                legends: {
                    visible: true,
                    orient: 'bottom'
                },
                label: {
                    visible: true
                },
                tooltip: {
                    mark: {
                        content: [
                            {
                                key: 'Region',
                                value: (datum) => datum['category']
                            },
                            {
                                key: 'Value',
                                value: (datum) => datum['value']
                            }
                        ]
                    }
                }
            },
            useCase: 'When you want to emphasize the relationship between parts and include total context'
        },

        {
            name: 'detailed_pie_with_percentages',
            description: 'Pie chart with percentage labels and detailed tooltips',
            complexity: 'medium',
            sampleData: [
                { category: 'Mobile', value: 156 },
                { category: 'Desktop', value: 98 },
                { category: 'Tablet', value: 45 },
                { category: 'Other', value: 23 }
            ],
            vchartSpec: {
                type: 'pie',
                data: {
                    values: []
                },
                categoryField: 'category',
                valueField: 'value',
                outerRadius: 0.8,
                title: {
                    visible: true,
                    text: 'Traffic Distribution by Device'
                },
                legends: {
                    visible: true,
                    orient: 'right'
                },
                label: {
                    visible: true,
                    formatMethod: (label, datum, data) => {
                        const total = data.reduce((sum, d) => sum + d.value, 0);
                        const percentage = ((datum.value / total) * 100).toFixed(1);
                        return `${datum.category}\n${percentage}%`;
                    }
                },
                tooltip: {
                    mark: {
                        content: [
                            {
                                key: 'Device Type',
                                value: (datum) => datum['category']
                            },
                            {
                                key: 'Count',
                                value: (datum) => datum['value'].toLocaleString()
                            },
                            {
                                key: 'Percentage',
                                value: (datum, data) => {
                                    const total = data.reduce((sum, d) => sum + d.value, 0);
                                    return `${((datum.value / total) * 100).toFixed(1)}%`;
                                }
                            }
                        ]
                    }
                }
            },
            useCase: 'Detailed analysis where percentages and exact values are important'
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

module.exports = { 
    PIE_CHART_KNOWLEDGE, 
    CHART_KNOWLEDGE_BASE, 
    ChartKnowledgeManager 
};