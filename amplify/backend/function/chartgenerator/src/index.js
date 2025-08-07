const OpenAI = require("openai");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            config: parsedConfig,
            message: "Chart configuration generated successfully"
        })
    };
};