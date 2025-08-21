const VMind = require("@visactor/vmind").default;
const { Model } = require("@visactor/vmind");

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        const body = JSON.parse(event.body || '{}');
        const { csv, prompt, apiKey } = body;
        
        if (!csv || !prompt || !apiKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "CSV data, prompt, and API key are required"
                })
            };
        }
        
        // Initialize VMind with OpenAI
        const vmind = new VMind({
            url: 'https://api.openai.com/v1/chat/completions',
            model: Model.GPT_4o,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'api-key': apiKey
            }
        });

        const startTime = Date.now();
        
        try {
            // Parse CSV data
            const { fieldInfo, dataset } = vmind.parseCSVData(csv);
            console.log('Parsed CSV - Fields:', fieldInfo.length, 'Rows:', dataset.length);
            
            // Generate chart specification
            const result = await vmind.generateChart(
                prompt,
                fieldInfo,
                dataset,
                {
                    theme: 'light',
                    enableDataQuery: true
                }
            );
            
            const endTime = Date.now();
            const generationTime = endTime - startTime;
            
            console.log('Chart generated successfully in', generationTime, 'ms');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    spec: result.spec,
                    time: generationTime,
                    chartType: result.chartType,
                    message: "Chart specification generated successfully"
                })
            };
            
        } catch (vmindError) {
            console.error('VMind generation error:', vmindError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: "Failed to generate chart specification",
                    details: vmindError.message
                })
            };
        }
        
    } catch (error) {
        console.error('Error in chart generator:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: "Internal server error",
                details: error.message
            })
        };
    }
};