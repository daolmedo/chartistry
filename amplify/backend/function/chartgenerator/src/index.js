const OpenAI = require("openai");

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
  
    // Handle pre‑flight requests
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }
  
    try {
        const body = JSON.parse(event.body || "{}");
        console.log(`Parsed body: ${JSON.stringify(body)}`);
        const { message } = body;

        if (!message) {
            console.log("No message provided in the request");
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Message is required" })
            };
        }

        // Initialise OpenAI client – picks up OPENAI_API_KEY from env
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log("OpenAI client initialized");

        const systemPrompt = `You are an expert data visualization consultant specializing in chart selection and configuration.

        Your task is to analyze user requests and return a JSON configuration object for pre-built chart templates.

        # Available Chart Types:
        - "bar": Vertical bar charts for categorical data
        - "line": Line charts for time series or continuous data
        - "pie": Pie charts for parts-of-a-whole data

        # Configuration Structure:
        Return a JSON object with this exact structure:
        {
          "type": "bar|line|pie",
          "data": [
            { "label": "Category", "value": 100, "date": "2024-01-01" (optional) }
          ],
          "styling": {
            "colors": ["#4f46e5", "#6366f1", "#8b5cf6"],
            "title": "Chart Title",
            "xLabel": "X Axis Label (optional)",
            "yLabel": "Y Axis Label (optional)"
          },
          "animation": {
            "duration": 0.6,
            "stagger": 0.04
          },
          "showValues": true (for bar charts),
          "showDots": true (for line charts),
          "fillArea": false (for line charts),
          "showLabels": true (for pie charts)
        }

        # Guidelines:
        1. Generate realistic sample data (5-8 data points) based on the user's request
        2. Choose appropriate chart types based on data characteristics
        3. Use professional color palettes (blues, greens, purples)
        4. Create meaningful titles and labels
        5. Set appropriate animation timing
        6. Include date fields for time-series data

        # Examples:
        - "Sales by month" → bar chart with monthly data
        - "Temperature over time" → line chart with dates and smooth curves
        - "Market share breakdown" → pie chart with percentages
        - "Revenue trends" → line chart with area fill

        CRITICAL: Return ONLY the JSON configuration object. No markdown, no explanations, just valid JSON.`;

        const userPrompt = `Create a chart configuration for this request: ${message}

        Return only the JSON configuration object.`;

        console.log("Sending request to OpenAI");
        const completion = await openai.chat.completions.create({
            model: "o4-mini",
            messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt }
            ]
        });

        let chartConfig = completion.choices[0].message.content;
        console.log("Received chart config from OpenAI");

        // Parse and validate JSON response
        let parsedConfig;
        try {
            // Strip any markdown code fences if present
            if (chartConfig.includes("```")) {
                chartConfig = chartConfig
                    .replace(/^```(?:json)?\\n?/gm, "")
                    .replace(/\\n?```$/gm, "")
                    .trim();
            }
            
            parsedConfig = JSON.parse(chartConfig);
            console.log("Successfully parsed chart configuration");
            
            // Validate required fields
            if (!parsedConfig.type || !parsedConfig.data || !parsedConfig.styling) {
                throw new Error("Missing required configuration fields");
            }
            
        } catch (parseError) {
            console.error("Failed to parse chart configuration:", parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "Invalid chart configuration generated",
                    details: parseError.message
                })
            };
        }

    console.log("Returning successful response");
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            config: parsedConfig,
            message: "Chart configuration generated successfully"
        })
    };

    } catch (error) {
        console.error("Error:", error);
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