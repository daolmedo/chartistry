
const Anthropic = require('@anthropic-ai/sdk');

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Parse the request body
        const body = JSON.parse(event.body || '{}');
        const { message } = body;

        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        // Initialize Claude client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const systemPrompt = `You are an expert React developer specializing in data visualization with Visx and Framer Motion. 

Your task is to generate complete, working React component code that creates beautiful, animated charts based on user requests.

Requirements:
1. Always create a functional React component named "ChartComponent"
2. Use Visx for chart primitives (available as visx.scale, visx.shape, visx.axis, etc.)
3. Use Framer Motion for animations (available as motion)
4. Include sample data when not provided by the user
5. Make charts responsive and visually appealing
6. Add smooth animations and transitions
7. Use modern React patterns (hooks, functional components)
8. Include proper TypeScript types when beneficial

Available libraries:
- React (useState, useEffect, useMemo, etc.)
- Framer Motion (motion components)
- Visx modules (scale, axis, shape, group, grid, curve, gradient, pattern, tooltip)

The component will be rendered in a container, so make it fill the available space appropriately.

Return ONLY the JavaScript/React code, no markdown or explanations.`;

        const userPrompt = `Create a React chart component based on this request: ${message}

Generate complete, working code that I can execute directly.`;

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });

        const chartCode = response.content[0].text;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                chartCode,
                message: 'Chart generated successfully'
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
