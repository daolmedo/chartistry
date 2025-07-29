
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
- React (useState, useEffect, useMemo, etc.) - access via React.useState, etc.
- Framer Motion (motion components) - access via motion
- Visx modules: visx.scale, visx.axis, visx.shape, visx.group, visx.grid, visx.curve, visx.gradient, visx.pattern, visx.tooltip

The component will be rendered in a container, so make it fill the available space appropriately.

CRITICAL SYNTAX REQUIREMENTS:
- DO NOT use ES6 import statements (import ... from ...)
- DO NOT use export default or export statements
- Instead, destructure from the provided objects at the top of your code
- Example: const { useState, useEffect, useMemo } = React;
- Example: const { scaleLinear, scaleBand } = visx.scale;
- Example: const { Group } = visx.group;
- Example: const { Bar } = visx.shape;
- Example: const { AxisLeft, AxisBottom } = visx.axis;

CRITICAL: Return ONLY the raw JavaScript/React code without any markdown formatting, code blocks, or explanations. Do NOT wrap the code in \`\`\`jsx or \`\`\` blocks. The code should start directly with const declarations for destructuring.`;

        const userPrompt = `Create a React chart component based on this request: ${message}

Generate complete, executable JavaScript/React code without any markdown formatting.`;

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

        let chartCode = response.content[0].text;
        
        // Strip markdown code blocks as a safety measure
        if (chartCode.includes('```')) {
            chartCode = chartCode
                .replace(/^```(?:jsx|javascript|js|react)?\n?/gm, '')
                .replace(/\n?```$/gm, '')
                .trim();
        }

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
