/**
 * VMind-Inspired Field Detection System
 * Uses PostgreSQL metadata and AI analysis to intelligently detect field roles
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage } = require('@langchain/core/messages');

class FieldDetectionService {
    constructor(pool, llm) {
        this.pool = pool;
        this.llm = llm;
    }

    /**
     * Enhanced field detection using PostgreSQL analysis + AI reasoning
     */
    async analyzeFields(datasetId, tableName) {
        console.log(`Starting field analysis for dataset ${datasetId}, table ${tableName}`);

        try {
            // Step 1: Get comprehensive field information from PostgreSQL
            const fieldCharacteristics = await this.getFieldCharacteristics(datasetId, tableName);
            
            // Step 2: Update field analysis in database (this runs our stored function)
            await this.updateFieldAnalysis(datasetId, tableName);
            
            // Step 3: Get sample data for context
            const sampleData = await this.getSampleData(tableName, 5);
            
            // Step 4: AI-powered field role refinement
            const refinedAnalysis = await this.refineFieldRolesWithAI(
                fieldCharacteristics, 
                sampleData, 
                tableName
            );

            return refinedAnalysis;

        } catch (error) {
            console.error('Field analysis failed:', error);
            throw new Error(`Field analysis failed: ${error.message}`);
        }
    }

    /**
     * Get field characteristics using our enhanced PostgreSQL functions
     */
    async getFieldCharacteristics(datasetId, tableName) {
        const client = await this.pool.connect();
        
        try {
            // Enhanced query that gets comprehensive field information
            const query = `
                WITH field_analysis AS (
                    SELECT 
                        dc.column_name,
                        dc.data_type,
                        dc.postgres_type,
                        dc.unique_count,
                        dc.cardinality_ratio,
                        dc.contains_nulls_pct,
                        dc.sample_values,
                        dc.min_value,
                        dc.max_value,
                        dc.field_role,
                        dc.semantic_type,
                        dc.field_stats,
                        d.row_count
                    FROM dataset_columns dc
                    JOIN datasets d ON dc.dataset_id = d.dataset_id
                    WHERE dc.dataset_id = $1
                    ORDER BY dc.column_index
                ),
                enhanced_stats AS (
                    SELECT 
                        fa.*,
                        CASE 
                            WHEN fa.cardinality_ratio IS NULL THEN
                                (fa.unique_count::FLOAT / GREATEST(fa.row_count, 1))
                            ELSE fa.cardinality_ratio
                        END as computed_cardinality,
                        CASE
                            WHEN fa.contains_nulls_pct IS NULL THEN 0
                            ELSE fa.contains_nulls_pct
                        END as computed_null_pct
                    FROM field_analysis fa
                )
                SELECT 
                    column_name,
                    data_type,
                    postgres_type,
                    unique_count,
                    computed_cardinality as cardinality_ratio,
                    computed_null_pct as null_percentage,
                    sample_values,
                    min_value,
                    max_value,
                    COALESCE(field_role, 'unknown') as field_role,
                    COALESCE(semantic_type, 'text') as semantic_type,
                    COALESCE(field_stats, '{}'::jsonb) as field_stats
                FROM enhanced_stats
            `;

            const result = await client.query(query, [datasetId]);
            return result.rows;

        } finally {
            client.release();
        }
    }

    /**
     * Update field analysis using our stored function
     */
    async updateFieldAnalysis(datasetId, tableName) {
        const client = await this.pool.connect();
        
        try {
            await client.query('SELECT update_field_analysis($1, $2)', [datasetId, tableName]);
            console.log(`Field analysis updated for dataset ${datasetId}`);
        } finally {
            client.release();
        }
    }

    /**
     * Get sample data for AI context
     */
    async getSampleData(tableName, limit = 5) {
        const client = await this.pool.connect();
        
        try {
            // Get column names first (excluding system columns)
            const columnsQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 
                AND column_name NOT IN ('id', 'created_at')
                ORDER BY ordinal_position
            `;
            const columnsResult = await client.query(columnsQuery, [tableName]);
            const columns = columnsResult.rows.map(r => r.column_name);

            if (columns.length === 0) {
                return [];
            }

            // Get sample data
            const sampleQuery = `
                SELECT ${columns.map(col => `"${col}"`).join(', ')} 
                FROM "${tableName}" 
                LIMIT $1
            `;
            const sampleResult = await client.query(sampleQuery, [limit]);
            return sampleResult.rows;

        } finally {
            client.release();
        }
    }

    /**
     * Use AI to refine field role detection and provide pie chart recommendations
     */
    async refineFieldRolesWithAI(fieldCharacteristics, sampleData, tableName) {
        
        const analysisPrompt = `
        You are a data analysis expert. Analyze this dataset to determine the best fields for creating a pie chart.

        Dataset: "${tableName}"
        
        Field Characteristics:
        ${JSON.stringify(fieldCharacteristics.map(f => ({
            name: f.column_name,
            data_type: f.data_type,
            unique_count: f.unique_count,
            cardinality_ratio: f.cardinality_ratio,
            null_percentage: f.null_percentage,
            sample_values: f.sample_values?.slice(0, 3) || [],
            suggested_role: f.field_role,
            semantic_type: f.semantic_type
        })), null, 2)}

        Sample Data (first few rows):
        ${JSON.stringify(sampleData, null, 2)}

        For PIE CHART suitability, analyze:
        1. Which field would work best as DIMENSION (categories for pie slices)
           - Should be categorical with reasonable cardinality (2-15 unique values)
           - Text/string fields with low cardinality ratio
           - Should represent meaningful categories
        
        2. Which field would work best as MEASURE (values for pie slice sizes)
           - Should be numerical and suitable for aggregation
           - Positive numbers preferred for pie charts
           - Should represent quantities/amounts that can be summed
        
        3. Data quality assessment
           - Check for missing values, outliers, data consistency
           - Rate overall data quality for visualization

        Return your analysis as JSON:
        {
            "field_analysis": [
                {
                    "field_name": "column_name",
                    "recommended_role": "dimension|measure|identifier|exclude",
                    "confidence": 0.0-1.0,
                    "reasoning": "why this role fits",
                    "data_quality_issues": ["any issues found"]
                }
            ],
            "pie_chart_recommendation": {
                "suitable": true/false,
                "recommended_dimension": "field_name or null",
                "recommended_measure": "field_name or null",
                "confidence": 0.0-1.0,
                "reasoning": "detailed explanation",
                "estimated_pie_slices": number,
                "suggested_aggregation": "SUM|COUNT|AVG|MAX|MIN"
            },
            "data_quality": {
                "overall_score": 0.0-1.0,
                "issues": ["list of data quality concerns"],
                "recommendations": ["suggestions for improvement"]
            }
        }
        `;

        try {
            const response = await this.llm.invoke([new HumanMessage(analysisPrompt)]);
            
            let aiAnalysis;
            try {
                let content = response.content;
                if (content.includes('```json')) {
                    content = content.split('```json')[1].split('```')[0];
                }
                aiAnalysis = JSON.parse(content);
            } catch (parseError) {
                console.error('Failed to parse AI analysis:', parseError);
                throw new Error('AI analysis returned invalid JSON');
            }

            // Merge AI insights with field characteristics
            const enhancedFields = fieldCharacteristics.map(field => {
                const aiField = aiAnalysis.field_analysis.find(f => f.field_name === field.column_name);
                if (aiField) {
                    // Update field role based on AI analysis if confidence is high
                    if (aiField.confidence > 0.7) {
                        field.field_role = aiField.recommended_role === 'exclude' ? 'unknown' : aiField.recommended_role;
                    }
                }
                return field;
            });

            return {
                fields: enhancedFields,
                recommendedForPieChart: {
                    dimension: aiAnalysis.pie_chart_recommendation.recommended_dimension,
                    measure: aiAnalysis.pie_chart_recommendation.recommended_measure,
                    suitable: aiAnalysis.pie_chart_recommendation.suitable,
                    reason: aiAnalysis.pie_chart_recommendation.reasoning,
                    confidence: aiAnalysis.pie_chart_recommendation.confidence
                },
                dataQuality: {
                    score: aiAnalysis.data_quality.overall_score,
                    issues: aiAnalysis.data_quality.issues || []
                }
            };

        } catch (error) {
            console.error('AI field refinement failed:', error);
            
            // Fallback to PostgreSQL-only analysis
            return this.createFallbackAnalysis(fieldCharacteristics);
        }
    }

    /**
     * Fallback analysis when AI fails
     */
    createFallbackAnalysis(fieldCharacteristics) {
        // Simple heuristic-based recommendation
        const dimensions = fieldCharacteristics.filter(f => 
            f.field_role === 'dimension' && 
            f.cardinality_ratio < 0.5 &&
            f.unique_count >= 2 && 
            f.unique_count <= 20
        );
        
        const measures = fieldCharacteristics.filter(f => 
            f.field_role === 'measure' &&
            f.semantic_type === 'numerical'
        );

        const bestDimension = dimensions.length > 0 ? dimensions[0] : null;
        const bestMeasure = measures.length > 0 ? measures[0] : null;

        return {
            fields: fieldCharacteristics,
            recommendedForPieChart: {
                dimension: bestDimension?.column_name || null,
                measure: bestMeasure?.column_name || null,
                suitable: !!(bestDimension && bestMeasure),
                reason: bestDimension && bestMeasure 
                    ? `Found suitable dimension (${bestDimension.column_name}) and measure (${bestMeasure.column_name}) fields`
                    : 'No suitable combination of dimension and measure fields found',
                confidence: bestDimension && bestMeasure ? 0.7 : 0.3
            },
            dataQuality: {
                score: 0.8, // Assume decent quality if we got this far
                issues: []
            }
        };
    }

    /**
     * Validate field selection for pie chart
     */
    async validateFieldSelection(tableName, dimensionField, measureField) {
        const client = await this.pool.connect();
        const issues = [];

        try {
            // Test query to validate fields and get preview
            const testQuery = `
                SELECT 
                    "${dimensionField}" as category,
                    "${measureField}" as value,
                    COUNT(*) as record_count
                FROM "${tableName}"
                WHERE "${dimensionField}" IS NOT NULL 
                AND "${measureField}" IS NOT NULL
                GROUP BY "${dimensionField}"
                ORDER BY "${measureField}" DESC
                LIMIT 20
            `;

            const result = await client.query(testQuery);
            
            if (result.rows.length === 0) {
                issues.push('No valid data found for selected fields');
                return { valid: false, issues, preview: [] };
            }

            // Check for negative values (not suitable for pie charts)
            const negativeValues = result.rows.filter(row => row.value < 0);
            if (negativeValues.length > 0) {
                issues.push(`Found ${negativeValues.length} negative values - pie charts work best with positive values`);
            }

            // Check category count
            if (result.rows.length > 15) {
                issues.push(`Too many categories (${result.rows.length}) - consider grouping smaller categories`);
            } else if (result.rows.length < 2) {
                issues.push('Need at least 2 categories for meaningful pie chart');
            }

            return {
                valid: issues.length === 0 || (issues.length === 1 && issues[0].includes('negative values')),
                issues,
                preview: result.rows
            };

        } catch (error) {
            issues.push(`Field validation failed: ${error.message}`);
            return { valid: false, issues, preview: [] };
        } finally {
            client.release();
        }
    }
}

module.exports = { FieldDetectionService };