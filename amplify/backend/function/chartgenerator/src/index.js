const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({
    region: 'eu-west-2'
});

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
        const { csv, prompt } = body;
        
        if (!csv || !prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "CSV data and prompt are required"
                })
            };
        }
        
        const startTime = Date.now();
        
        try {
            // Call the vmind lambda function
            const vmindParams = {
                FunctionName: 'arn:aws:lambda:eu-west-2:252326958099:function:vmind',
                Payload: JSON.stringify({
                    body: JSON.stringify({
                        csv,
                        prompt
                    })
                })
            };
            
            console.log('Invoking vmind lambda with payload:', vmindParams.Payload);
            
            const vmindResult = await lambda.invoke(vmindParams).promise();
            
            if (vmindResult.StatusCode !== 200) {
                throw new Error(`VMind lambda returned status ${vmindResult.StatusCode}`);
            }
            
            const vmindResponse = JSON.parse(vmindResult.Payload);
            
            if (vmindResponse.statusCode !== 200) {
                throw new Error(`VMind lambda failed: ${vmindResponse.body}`);
            }
            
            const vmindData = JSON.parse(vmindResponse.body);
            
            const endTime = Date.now();
            const generationTime = endTime - startTime;
            
            console.log('Chart generated successfully in', generationTime, 'ms');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    spec: vmindData.spec,
                    time: generationTime,
                    chartType: vmindData.chartType,
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