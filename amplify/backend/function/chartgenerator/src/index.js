const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
        const { message } = body;
        
        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "Message is required"
                })
            };
        }
        
        const systemPrompt = `You are a chart specification generator. Based on the user's message, generate a JSON specification for a Chart.js pie chart.

Return ONLY a JSON object with this exact structure:
{
  "type": "pie",
  "data": {
    "labels": ["Label1", "Label2", "Label3"],
    "datasets": [{
      "data": [value1, value2, value3],
      "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56"]
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "legend": {
        "position": "bottom"
      },
      "title": {
        "display": true,
        "text": "Chart Title"
      }
    }
  }
}

Generate realistic data based on the user's request. Use meaningful labels and appropriate colors.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        const chartSpecText = completion.choices[0].message.content;
        let chartConfig;
        
        try {
            chartConfig = JSON.parse(chartSpecText);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response as JSON:', chartSpecText);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: "Failed to generate valid chart configuration"
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                config: chartConfig,
                message: "Chart configuration generated successfully"
            })
        };
        
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