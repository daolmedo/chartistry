/**
 * VMind-Inspired Error Recovery System
 * AI-powered error analysis and correction with retry loops
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage } = require('@langchain/core/messages');

class ErrorRecoverySystem {
    constructor(pool, llm, maxRetries = 3) {
        this.pool = pool;
        this.llm = llm;
        this.maxRetries = maxRetries;
    }

    /**
     * Execute a workflow step with error recovery capabilities
     */
    async executeWithRecovery(stepName, stepFunction, state, executionContext) {
        const startTime = Date.now();
        const attemptNumber = (state.attemptCount?.[stepName] || 0) + 1;
        
        // Initialize attempt count
        if (!state.attemptCount) {
            state.attemptCount = {};
        }
        state.attemptCount[stepName] = attemptNumber;

        console.log(`Executing step "${stepName}", attempt ${attemptNumber}`);

        try {
            // Log step start
            await this.logAttemptStart(state, stepName, attemptNumber, executionContext);

            // Execute the step function
            const result = await stepFunction(state);
            const executionTime = Date.now() - startTime;

            // Log successful completion
            await this.logAttemptSuccess(
                state, 
                stepName, 
                attemptNumber, 
                result, 
                executionTime
            );

            console.log(`Step "${stepName}" completed successfully in ${executionTime}ms`);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`Step "${stepName}" failed on attempt ${attemptNumber}:`, error.message);

            // Log failure
            await this.logAttemptFailure(
                state,
                stepName,
                attemptNumber,
                error,
                executionTime
            );

            // Check if we should retry
            if (attemptNumber >= this.maxRetries) {
                console.error(`Step "${stepName}" failed after ${this.maxRetries} attempts`);
                throw new Error(
                    `${stepName} failed after ${this.maxRetries} attempts. Last error: ${error.message}`
                );
            }

            // Analyze error and apply corrections
            const correctedState = await this.analyzeAndCorrect(
                stepName,
                error,
                state,
                attemptNumber,
                executionContext
            );

            // Recursive retry with corrected state
            return this.executeWithRecovery(stepName, stepFunction, correctedState, executionContext);
        }
    }

    /**
     * AI-powered error analysis and state correction
     */
    async analyzeAndCorrect(stepName, error, state, attemptNumber, executionContext) {
        console.log(`Analyzing error for step "${stepName}", attempt ${attemptNumber}`);

        try {
            // Get error context from previous attempts
            const errorContext = await this.getErrorContext(state.generationId, stepName);
            
            // Create comprehensive error analysis prompt
            const errorAnalysisPrompt = this.createErrorAnalysisPrompt(
                stepName,
                error,
                state,
                attemptNumber,
                errorContext,
                executionContext
            );

            // Get AI analysis
            const aiResponse = await this.llm.invoke([new HumanMessage(errorAnalysisPrompt)]);
            
            let errorAnalysis;
            try {
                let content = aiResponse.content;
                if (content.includes('```json')) {
                    content = content.split('```json')[1].split('```')[0];
                }
                errorAnalysis = JSON.parse(content);
            } catch (parseError) {
                console.error('Failed to parse error analysis:', parseError);
                return await this.applyHeuristicCorrection(stepName, error, state);
            }

            console.log(`Error analysis: ${errorAnalysis.correction_strategy}`);

            // Apply corrections based on AI analysis
            const correctedState = await this.applyCorrections(
                state,
                errorAnalysis,
                stepName,
                attemptNumber
            );

            return correctedState;

        } catch (analysisError) {
            console.error('Error analysis failed:', analysisError);
            
            // Fall back to heuristic correction
            return await this.applyHeuristicCorrection(stepName, error, state);
        }
    }

    /**
     * Create comprehensive error analysis prompt for AI
     */
    createErrorAnalysisPrompt(stepName, error, state, attemptNumber, errorContext, executionContext) {
        return `
        You are an expert at debugging data visualization workflows. Analyze this error and provide corrections.

        STEP: ${stepName}
        ATTEMPT: ${attemptNumber}
        ERROR: ${error.message}
        ERROR STACK: ${error.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace'}

        CURRENT STATE:
        ${JSON.stringify({
            userIntent: state.userIntent,
            datasetId: state.datasetId,
            tableName: state.tableName,
            currentStep: state.currentStep,
            fieldMapping: state.fieldMapping,
            sqlQuery: state.sqlQuery,
            queryResults: state.queryResults ? `${state.queryResults.length} rows` : 'null'
        }, null, 2)}

        EXECUTION CONTEXT:
        ${JSON.stringify(executionContext || {}, null, 2)}

        PREVIOUS ERRORS FOR THIS STEP:
        ${JSON.stringify(errorContext, null, 2)}

        Common error patterns and solutions:

        **SQL Generation Errors:**
        - Syntax errors: Fix SELECT, FROM, WHERE, GROUP BY structure
        - Column not found: Use exact column names from field analysis
        - Data type mismatches: Apply proper casting or filtering
        - Empty results: Adjust WHERE conditions or aggregation logic

        **Field Mapping Errors:**
        - Field not found: Use available fields from fieldAnalysis
        - Wrong field types: Ensure dimension fields are categorical, measure fields are numerical
        - Data validation: Check for required non-null values

        **Chart Specification Errors:**
        - JSON parsing: Fix JSON structure and syntax
        - Invalid VChart config: Use proper VChart specification format
        - Data format mismatch: Ensure data matches expected { category, value } format

        **Data Processing Errors:**
        - Type conversion: Handle string/number conversion properly
        - Missing values: Add NULL handling or filtering
        - Range issues: Check for negative values in pie charts

        Based on this analysis, provide corrections:

        {
            "error_type": "sql_error|json_parse_error|field_mapping_error|data_validation_error|unknown_error",
            "root_cause": "detailed explanation of what went wrong",
            "suggested_corrections": {
                "field_mapping": {},
                "sql_query": "corrected SQL if needed",
                "data_processing": {},
                "chart_config": {},
                "validation_rules": {}
            },
            "correction_strategy": "step-by-step explanation of how to fix this",
            "confidence": 0.8,
            "retry_recommended": true,
            "prevention_advice": "how to avoid this error in the future"
        }

        Focus on providing actionable corrections that can be directly applied to the workflow state.
        `;
    }

    /**
     * Apply AI-suggested corrections to workflow state
     */
    async applyCorrections(state, errorAnalysis, stepName, attemptNumber) {
        const correctedState = { ...state };
        const corrections = errorAnalysis.suggested_corrections;

        // Apply field mapping corrections
        if (corrections.field_mapping) {
            correctedState.fieldMapping = {
                ...correctedState.fieldMapping,
                ...corrections.field_mapping
            };
            console.log('Applied field mapping corrections');
        }

        // Apply SQL corrections
        if (corrections.sql_query) {
            correctedState.sqlQuery = corrections.sql_query;
            console.log('Applied SQL query corrections');
        }

        // Apply data processing corrections
        if (corrections.data_processing) {
            // Store correction instructions for step functions to use
            correctedState.dataProcessingCorrections = corrections.data_processing;
            console.log('Applied data processing corrections');
        }

        // Apply chart configuration corrections
        if (corrections.chart_config) {
            correctedState.chartSpec = {
                ...correctedState.chartSpec,
                ...corrections.chart_config
            };
            console.log('Applied chart configuration corrections');
        }

        // Log the correction applied
        await this.logCorrection(
            state.generationId,
            stepName,
            attemptNumber,
            errorAnalysis.correction_strategy,
            corrections
        );

        return correctedState;
    }

    /**
     * Heuristic-based corrections when AI analysis fails
     */
    async applyHeuristicCorrection(stepName, error, state) {
        const correctedState = { ...state };
        const errorMessage = error.message.toLowerCase();

        console.log('Applying heuristic corrections for:', stepName);

        // SQL-related errors
        if (stepName.includes('sql') || errorMessage.includes('sql')) {
            if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
                // Column not found - try to fix field mapping
                if (state.fieldAnalysis?.fields) {
                    const availableFields = state.fieldAnalysis.fields.map(f => f.column_name);
                    console.log('Available fields for correction:', availableFields);
                    
                    // Reset to first available dimension and measure
                    const dimension = availableFields.find(f => 
                        state.fieldAnalysis.fields.find(field => 
                            field.column_name === f && field.field_role === 'dimension'
                        )
                    );
                    const measure = availableFields.find(f => 
                        state.fieldAnalysis.fields.find(field => 
                            field.column_name === f && field.field_role === 'measure'
                        )
                    );

                    if (dimension && measure) {
                        correctedState.fieldMapping = {
                            ...correctedState.fieldMapping,
                            recommended_dimension: dimension,
                            recommended_measure: measure
                        };
                    }
                }
            }
        }

        // JSON parsing errors
        if (errorMessage.includes('json') || errorMessage.includes('parse')) {
            // Reset problematic JSON structures
            if (stepName.includes('chart')) {
                correctedState.chartSpec = null; // Will trigger fallback generation
            }
        }

        // Field mapping errors
        if (stepName.includes('field') || errorMessage.includes('field')) {
            // Reset field analysis to trigger re-detection
            correctedState.fieldMapping = null;
        }

        return correctedState;
    }

    /**
     * Get error context from previous attempts
     */
    async getErrorContext(generationId, stepName) {
        if (!generationId || generationId.startsWith('mock_') || generationId.includes('-')) {
            return [];
        }

        const client = await this.pool.connect();
        try {
            const query = `
                SELECT attempt_number, error_message, correction_applied, was_successful
                FROM chart_generation_attempts
                WHERE generation_id = $1 AND step_name = $2
                ORDER BY attempt_number DESC
                LIMIT 5
            `;
            const result = await client.query(query, [generationId, stepName]);
            return result.rows;
        } catch (error) {
            console.error('Failed to get error context:', error);
            return [];
        } finally {
            client.release();
        }
    }

    /**
     * Log attempt start
     */
    async logAttemptStart(state, stepName, attemptNumber, executionContext) {
        if (!state.generationId || state.generationId.startsWith('mock_') || state.generationId.includes('-')) {
            // Skip logging for mock/test generation IDs since we're not tracking generations
            return;
        }

        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO chart_generation_attempts 
                (generation_id, attempt_number, step_name, step_input, step_output, was_successful)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (generation_id, attempt_number, step_name) 
                DO UPDATE SET step_input = EXCLUDED.step_input
            `, [
                state.generationId,
                attemptNumber,
                stepName,
                JSON.stringify({ state: this.sanitizeStateForLogging(state), context: executionContext }),
                JSON.stringify({ status: 'started' }),
                false
            ]);
        } catch (error) {
            console.error('Failed to log attempt start:', error);
        } finally {
            client.release();
        }
    }

    /**
     * Log successful attempt completion
     */
    async logAttemptSuccess(state, stepName, attemptNumber, result, executionTime) {
        if (!state.generationId || state.generationId.startsWith('mock_') || state.generationId.includes('-')) {
            return;
        }

        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE chart_generation_attempts 
                SET 
                    step_output = $1,
                    was_successful = true,
                    execution_time_ms = $2
                WHERE generation_id = $3 
                AND attempt_number = $4 
                AND step_name = $5
            `, [
                JSON.stringify({ 
                    status: 'completed',
                    result: this.sanitizeStateForLogging(result)
                }),
                executionTime,
                state.generationId,
                attemptNumber,
                stepName
            ]);
        } catch (error) {
            console.error('Failed to log attempt success:', error);
        } finally {
            client.release();
        }
    }

    /**
     * Log attempt failure
     */
    async logAttemptFailure(state, stepName, attemptNumber, error, executionTime) {
        if (!state.generationId || state.generationId.startsWith('mock_') || state.generationId.includes('-')) {
            return;
        }

        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE chart_generation_attempts 
                SET 
                    step_output = $1,
                    error_message = $2,
                    was_successful = false,
                    execution_time_ms = $3
                WHERE generation_id = $4 
                AND attempt_number = $5 
                AND step_name = $6
            `, [
                JSON.stringify({ status: 'failed', error_details: error.message }),
                error.message,
                executionTime,
                state.generationId,
                attemptNumber,
                stepName
            ]);
        } catch (logError) {
            console.error('Failed to log attempt failure:', logError);
        } finally {
            client.release();
        }
    }

    /**
     * Log correction applied
     */
    async logCorrection(generationId, stepName, attemptNumber, strategy, corrections) {
        if (!generationId || generationId.startsWith('mock_') || generationId.includes('-')) {
            return;
        }

        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE chart_generation_attempts 
                SET correction_applied = $1
                WHERE generation_id = $2 
                AND attempt_number = $3 
                AND step_name = $4
            `, [
                JSON.stringify({ strategy, corrections }),
                generationId,
                attemptNumber,
                stepName
            ]);
        } catch (error) {
            console.error('Failed to log correction:', error);
        } finally {
            client.release();
        }
    }

    /**
     * Sanitize state for logging (remove sensitive/large data)
     */
    sanitizeStateForLogging(state) {
        const sanitized = { ...state };
        
        // Remove or truncate large data
        if (sanitized.queryResults && Array.isArray(sanitized.queryResults)) {
            sanitized.queryResults = {
                count: sanitized.queryResults.length,
                sample: sanitized.queryResults.slice(0, 3)
            };
        }

        if (sanitized.fieldAnalysis?.fields) {
            sanitized.fieldAnalysis = {
                fieldCount: sanitized.fieldAnalysis.fields.length,
                fields: sanitized.fieldAnalysis.fields.map(f => ({
                    name: f.column_name,
                    role: f.field_role,
                    type: f.semantic_type
                }))
            };
        }

        // Remove functions and complex objects
        delete sanitized.pool;
        delete sanitized.llm;

        return sanitized;
    }
}

module.exports = { ErrorRecoverySystem };