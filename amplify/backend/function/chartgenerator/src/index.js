// index.js - AWS Lambda handler with streaming support 
// npm i @langchain/openai @langchain/langgraph @langchain/core zod pg

const { Pool } = require("pg");
const { z } = require("zod");
const { ChatOpenAI } = require("@langchain/openai");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const {
  StateGraph,
  MessagesAnnotation,
  END
} = require("@langchain/langgraph");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const {
  HumanMessage,
  SystemMessage
} = require("@langchain/core/messages");

/* ----------------------------- DB Utilities ----------------------------- */


const dbConfig = {
  host: "chartz-ai.cexryffwmiie.eu-west-2.rds.amazonaws.com",
  port: 5432,
  database: "chartz",
  user: "postgres",
  password: "ppddA4all.P",
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  // 🔑 enable TLS – this makes pg send the SSLRequest packet
  ssl: {
      require: true,
      rejectUnauthorized: false
  }
};

const pool = new Pool(dbConfig);
const poolRO = new Pool(dbConfig);


async function fetchDatasetColumns(dataset_id) {
  console.log('fetchDatasetColumns called with dataset_id:', dataset_id);
  const client = await pool.connect();
  try {
    const sql = `
      SELECT column_name, field_role, semantic_type, postgres_type,
             unique_count, cardinality_ratio, contains_nulls_pct
      FROM dataset_columns
      WHERE dataset_id = $1
      ORDER BY column_index ASC
    `;
    console.log('Executing SQL query for dataset columns');
    const { rows } = await client.query(sql, [dataset_id]);
    console.log('Query returned', rows.length, 'columns');
    return rows;
  } catch (error) {
    console.error('Error fetching dataset columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

/** Build a compact helper summary for the LLM */
function summarizeColumns(cols) {
  // Lightweight heuristics for suggestions
  const dims = [];
  const measures = [];
  const ids = [];
  for (const c of cols) {
    const name = c.column_name;
    const role = (c.field_role || "").toLowerCase();
    const sem = (c.semantic_type || "").toLowerCase();
    const pg = (c.postgres_type || "").toLowerCase();

    // identifiers (by role or name hint)
    if (role === "identifier" || /(^|_)(id|uuid|session|user|account)(_|$)/i.test(name)) {
      ids.push(name);
      continue; // id fields shouldn't also be recommended as dims/measures
    }

    // measures (numerical)
    if (
      role === "measure" ||
      sem === "numerical" ||
      ["int", "integer", "bigint", "smallint", "decimal", "numeric", "double", "real", "float"].some(t => pg.includes(t))
    ) {
      measures.push(name);
    }

    // dimensions (categorical/text/bool) with sensible cardinality
    const card = Number(c.cardinality_ratio ?? 0);
    if (
      role === "dimension" ||
      sem === "categorical" ||
      sem === "text" ||
      sem === "boolean"
    ) {
      // Avoid extremely high cardinality dims unless nothing else exists
      if (isFinite(card) && card <= 0.8) {
        dims.push(name);
      } else if (!isFinite(card)) {
        dims.push(name);
      }
    }
  }

  return {
    dimension_candidates: dims.slice(0, 20),
    measure_candidates: measures.slice(0, 20),
    identifier_candidates: ids.slice(0, 20)
  };
}

/* ----------------------------- Chart Registry Tool ----------------------------- */

/**
 * Tool returns the current "chart registry" — the single source of truth for:
 *  - type/subtype IDs
 *  - requirements
 *  - mapping keys expected for each subtype
 *  - (later) SQL/templates/specs; specs are placeholdered as [CHARTSPEC]
 */
/* ----------------------------- Chart Catalog (MVP) ----------------------------- */
/**
 * Catalog is split in two parts:
 *  - index: tiny list used by Step 1 (chart selector)
 *  - defs: rich per-chart definitions used by Step 3 (spec generator)
 *
 * Step 1 calls: list_chart_catalog  -> returns CHART_CATALOG.index
 * Step 3 calls: get_chart_definition -> returns CHART_CATALOG.defs[key]
 */

const CHART_CATALOG = {
  index: [
    {
      type: "pie",
      subtype: "basic",
      id: "pie_basic_v1",
      mapping: { required: ["dimension", "measure"] },
      summary: "Pie chart of one categorical field aggregated by a numeric measure."
    },
    {
      type: "pie",
      subtype: "nested",
      id: "pie_nested_v1",
      mapping: { required: ["dimension1", "dimension2", "measure"] },
      summary: "Nested pie: outer ring by first category, inner ring by second category."
    },
    {
      type: "funnel",
      subtype: "basic",
      id: "funnel_basic_v1",
      mapping: { required: ["step", "measure"] },
      summary: "Funnel with steps and aggregated numeric values."
    },
    {
      type: "funnel",
      subtype: "conversion",
      id: "funnel_conversion_v1",
      mapping: { required: ["step", "measure"] },
      summary: "Richer funnel with steps and aggregated numeric values that automatically shows percentages between steps."
    },
    {
      type: "line",
      subtype: "basic",
      id: "line_basic_v1",
      mapping: { required: ["x", "y"], optional: ["series"] },
      summary: "Basic line chart: plot y over x; supports optional multi-series via a series field."
    }
  ],

  // Streamlined chart definitions for AI agents. Key = `${type}.${subtype}`
  defs: {
    "pie.basic": {
      id: "pie_basic_v1",

      // Clear contract for dynamic data fetching
      dynamicData: {
        sqlTemplate: {
          pattern: "GROUP BY {dimension} as type, SUM({measure}) as value",
          orderBy: "value DESC",
          expectedFields: ["type", "value"],
          guidance: "Use SUM for numeric measures, COUNT for frequency analysis, COUNT(DISTINCT id) for unique identifiers. COALESCE null categories to 'Unknown'. Limit to top 10-12 categories."
        },
        injection: {
          target: "data.0.values",
          chartFields: { categoryField: "type", valueField: "value" }
        }
      },

      // VChart configuration defaults
      chartDefaults: {
        type: "pie",
        outerRadius: 0.8,
        legends: { visible: true, orient: "left" },
        label: { visible: true }
      },
      exampleSpecs: [
        {
          name: "Pie • Basic",
          js: String.raw`const spec = {
            type: 'pie',
            data: [{ id: 'id0', values: [{ type: 'oxygen', value: 46.60 }, { type: 'silicon', value: 27.72 }] }],
            outerRadius: 0.8,
            valueField: 'value',
            categoryField: 'type',
            title: { visible: true, text: 'Statistics of Surface Element Content' },
            legends: { visible: true, orient: 'left' },
            label: { visible: true },
            tooltip: { mark: { content: [{ key: d => d['type'], value: d => d['value'] + '%' }] } }
          };`
        }
      ]
    },

    "pie.nested": {
      id: "pie_nested_v1",

      // Clear contract for dynamic data fetching - Multi-query chart
      dynamicData: {
        queries: {
          inner: {
            sqlTemplate: {
              pattern: "GROUP BY {dimension1} as type, SUM({measure}) as value",
              orderBy: "value DESC",
              limit: "8-12",
              expectedFields: ["type", "value"],
              guidance: "INNER ring (small circle) - shows dimension1 categories. Use SUM for measures, COUNT(DISTINCT id) for identifiers."
            },
            injection: {
              target: "data.0.values",
              chartFields: { categoryField: "type", valueField: "value" }
            }
          },
          outer: {
            sqlTemplate: {
              pattern: "GROUP BY {dimension1} as parent, {dimension2} as type, SUM({measure}) as value",
              orderBy: "parent, value DESC",
              expectedFields: ["parent", "type", "value"],
              guidance: "OUTER ring (large circle) - shows dimension2 breakdown within each dimension1. Filter to same parents as inner query. COALESCE nulls to 'Unknown'."
            },
            injection: {
              target: "data.1.values",
              chartFields: { categoryField: "type", valueField: "value" }
            }
          }
        }
      },

      // VChart configuration defaults
      chartDefaults: {
        type: "common",
        series: [
          { type: "pie", dataIndex: 0, outerRadius: 0.65, innerRadius: 0, valueField: "value", categoryField: "type" },
          { type: "pie", dataIndex: 1, outerRadius: 0.8, innerRadius: 0.67, valueField: "value", categoryField: "type" }
        ],
        legends: { visible: true, orient: "left" }
      },
      exampleSpecs: [
        {
          name: "Pie • Nested",
          js: String.raw`const spec = {
            type: 'common',
            data: [
              { id: 'id0', values: [{ type: '0~29', value: 126.04 }, { type: '30~59', value: 128.77 }] },
              { id: 'id1', values: [{ type: '0~9', value: 39.12 }, { type: '10~19', value: 43.01 }] }
            ],
            series: [
              { type: 'pie', dataIndex: 0, outerRadius: 0.65, innerRadius: 0, valueField: 'value', categoryField: 'type',
                label: { position: 'inside', visible: true }, pie: { style: { stroke: '#ffffff', lineWidth: 2 } } },
              { type: 'pie', dataIndex: 1, outerRadius: 0.8, innerRadius: 0.67, valueField: 'value', categoryField: 'type',
                label: { visible: true }, pie: { style: { stroke: '#ffffff', lineWidth: 2 } } }
            ],
            legends: { visible: true, orient: 'left' },
            title: { visible: true, text: 'Population Distribution by Age' }
          };`
        }
      ]
    },

    "funnel.basic": {
      id: "funnel_basic_v1",

      // Clear contract for dynamic data fetching
      dynamicData: {
        sqlTemplate: {
          pattern: "GROUP BY {step} as name, SUM({measure}) as value",
          orderBy: "funnel sequence",
          expectedFields: ["name", "value"],
          guidance: "Create funnel progression with sequential stages. Use SUM for volume metrics, COUNT(DISTINCT id) for user counts. Values should generally decrease from top to bottom. Keep to 4-8 meaningful steps."
        },
        injection: {
          target: "data.0.values",
          chartFields: { categoryField: "name", valueField: "value" }
        }
      },

      // VChart configuration defaults
      chartDefaults: {
        type: "funnel",
        label: { visible: true },
        legends: { visible: true, orient: "bottom" }
      },
      exampleSpecs: [
        {
          name: "Funnel • Basic",
          js: String.raw`const spec = {
            type: 'funnel',
            categoryField: 'name',
            valueField: 'value',
            data: [{ id: 'funnel', values: [{ value: 100, name: 'Step1' }, { value: 80, name: 'Step2' }] }],
            label: { visible: true },
            legends: { visible: true, orient: 'bottom' }
          };`
        }
      ]
    },

    "funnel.conversion": {
      id: "funnel_conversion_v1",

      // Clear contract for dynamic data fetching
      dynamicData: {
        sqlTemplate: {
          pattern: "GROUP BY {step} as name, COUNT(DISTINCT {user_id}) as value",
          orderBy: "conversion sequence",
          expectedFields: ["name", "value"],
          guidance: "Build conversion steps with absolute counts at each stage. Focus on user journey progression. Provide raw counts rather than percentages - visualization will calculate conversion rates automatically."
        },
        injection: {
          target: "data.0.values",
          chartFields: { categoryField: "name", valueField: "value" }
        }
      },

      // VChart configuration defaults
      chartDefaults: {
        type: "funnel",
        isTransform: true,
        isCone: false,
        label: { visible: true },
        transformLabel: { visible: true },
        outerLabel: { position: "right", visible: true },
        legends: { visible: true, orient: "top" }
      },
      exampleSpecs: [
        {
          name: "Funnel • Conversion",
          js: String.raw`const spec = {
            type: 'funnel',
            categoryField: 'name',
            valueField: 'value',
            isTransform: true,
            isCone: false,
            data: [{ id: 'funnel', values: [{ value: 5676, name: 'Sent' }, { value: 3872, name: 'Viewed' }] }],
            title: { visible: true, text: 'Percentage of customers dropped' },
            label: { visible: true },
            transformLabel: { visible: true },
            outerLabel: { position: 'right', visible: true },
            legends: { visible: true, orient: 'top' }
          };`
        }
      ]
    },

    "line.basic": {
      id: "line_basic_v1",

      // Clear contract for dynamic data fetching
      dynamicData: {
        sqlTemplate: {
          pattern: "GROUP BY {x} as x[, {series} as series] SUM({measure}) as value",
          orderBy: "x ASC",
          expectedFields: ["x", "value", "series?"],
          guidance: "Return ordered time/category series. Use SUM/AVG appropriately; for events over time, SUM per bucket is common. Handle null measures by returning NULL (chart will break line between valid points)."
        },
        injection: {
          target: "data.values",
          chartFields: { xField: "x", yField: "value", seriesField: "series" }
        }
      },

      // VChart configuration defaults
      chartDefaults: {
        type: "line",
        legends: { visible: true, orient: "top" },
        tooltip: { visible: true },
        invalidType: "link"
      },
      exampleSpecs: [
        {
          name: "Line • Basic (single series)",
          js: String.raw`const spec = {
            type: 'line',
            data: { values: [
              { x: '2:00', value: 8 }, { x: '4:00', value: 9 }, { x: '6:00', value: 11 },
              { x: '8:00', value: 14 }, { x: '10:00', value: 16 }, { x: '12:00', value: 17 },
              { x: '14:00', value: 17 }, { x: '16:00', value: 16 }, { x: '18:00', value: 15 }
            ]},
            xField: 'x',
            yField: 'value',
            legends: { visible: false }
          };`
        },
        {
          name: "Line • Basic (smooth)",
          js: String.raw`const spec = {
            type: 'line',
            data: { values: [
              { x: '2:00', value: 38 }, { x: '4:00', value: 56 }, { x: '6:00', value: 10 },
              { x: '8:00', value: 70 }, { x: '10:00', value: 36 }, { x: '12:00', value: 94 },
              { x: '14:00', value: 24 }, { x: '16:00', value: 44 }, { x: '18:00', value: 36 },
              { x: '20:00', value: 68 }, { x: '22:00', value: 22 }
            ]},
            xField: 'x',
            yField: 'value',
            line: { style: { curveType: 'monotone' } }
          };`
        },
        {
          name: "Line • Multi-series with null handling",
          js: String.raw`const spec = {
            type: 'line',
            data: { values: [
              { series: 'Gold Medals', x: '1952', value: 40 },
              { series: 'Gold Medals', x: '1956', value: 32 },
              { series: 'Gold Medals', x: '1960', value: 34 },
              { series: 'Gold Medals', x: '1980', value: null },
              { series: 'Gold Medals', x: '1984', value: 83 },
              { series: 'Silver Medals', x: '1952', value: 19 },
              { series: 'Silver Medals', x: '1980', value: null },
              { series: 'Silver Medals', x: '1984', value: 60 },
              { series: 'Bronze Medals', x: '1952', value: 17 },
              { series: 'Bronze Medals', x: '1980', value: null },
              { series: 'Bronze Medals', x: '1984', value: 30 }
            ]},
            xField: 'x',
            yField: 'value',
            seriesField: 'series',
            invalidType: 'link',
            legends: { visible: true, orient: 'top' }
          };`
        }
      ]
    }
  }
};


/* ----------------------------- Dynamic Schema Generation ----------------------------- */

// Extract all unique types and subtypes from catalog
function getAvailableTypes() {
  const types = [...new Set(CHART_CATALOG.index.map(item => item.type))];
  console.log('Available chart types from catalog:', types);
  return types;
}

function getAvailableSubtypes() {
  const subtypes = [...new Set(CHART_CATALOG.index.map(item => item.subtype))];
  console.log('Available chart subtypes from catalog:', subtypes);
  return subtypes;
}

function generateTypesExample() {
  const types = getAvailableTypes();
  return types.length > 0 ? `<${types.join('|')}>` : '<type>';
}

function generateSubtypesExample() {
  const subtypes = getAvailableSubtypes();
  return subtypes.length > 0 ? `<${subtypes.join('|')}>` : '<subtype>';
}

/* ----------------------------- Catalog Tools ----------------------------- */

// Small list for Step 1 selector
const listChartCatalogTool = new DynamicStructuredTool({
  name: "list_chart_catalog",
  description:
    "Return the small index of supported charts/subtypes and required mappings. Use this to decide which chart to pick.",
  schema: z.object({}),
  func: async () => {
    console.log('Tool: list_chart_catalog called');
    const result = JSON.stringify(CHART_CATALOG.index);
    console.log('Tool: list_chart_catalog returning catalog with', CHART_CATALOG.index.length, 'charts');
    return result;
  }
});

// Targeted definition for Step 3 spec generation
const getChartDefinitionTool = new DynamicStructuredTool({
  name: "get_chart_definition",
  description:
    "Return a detailed chart definition (examples, guidance) for a given { type, subtype }. Use this to generate a VChart spec that matches aggregated data.",
  schema: z.object({
    type: z.enum(getAvailableTypes()),
    subtype: z.enum(getAvailableSubtypes())
  }),
  func: async ({ type, subtype }) => {
    console.log('Tool: get_chart_definition called with:', { type, subtype });
    const key = `${type}.${subtype}`;
    const def = CHART_CATALOG.defs[key];
    if (!def) {
      console.error(`No chart definition found for ${key}`);
      throw new Error(`No chart definition for ${key}`);
    }
    console.log('Tool: get_chart_definition returning definition for', key);
    return JSON.stringify({ type, subtype, ...def });
  }
});


/* ----------------------------- LLM + Graph ----------------------------- */

const llm = new ChatOpenAI({
  model: "gpt-5-mini",
  apiKey: process.env.OPENAI_API_KEY,
}).bindTools([listChartCatalogTool]);

// Agent node: talk to LLM
async function agentNode(state) {
  const res = await llm.invoke(state.messages);
  return { messages: [res] };
}

// Decide whether to run tools or finish
function shouldContinue(state) {
  const last = state.messages[state.messages.length - 1];
  if (last.tool_calls && last.tool_calls.length > 0) {
    return "tools";
  }
  return END;
}

const toolsNode = new ToolNode([listChartCatalogTool]);

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .setEntryPoint("agent");

const app = workflow.compile();

/* ----------------------------- Prompting ----------------------------- */

function buildSystemPrompt() {
  return [
    "You are a chart-selection specialist.",
    "Your job: given a user's intent and dataset columns, select exactly ONE chart {type, subtype} and a valid mapping.",
    "You MUST call the tool list_chart_catalog to retrieve the latest chart registry before deciding.",
    "Only choose among the returned registry items.",
    "Mapping must use actual column names from the dataset.",
    "If requirements for the user's preferred chart aren't met, pick the closest valid option.",
    "Prefer low-cardinality dimensions for pies; ensure numeric measures when required.",
    "",
    "Output format:",
    "Return ONLY one JSON object, no markdown, no prose.",
    "",
    "Schema:",
    JSON.stringify({
      chart: { type: generateTypesExample(), subtype: generateSubtypesExample(), id: "<registry id>" },
      mapping: { "<role>": "<column name>" },
      reason: "short string",
      confidence: "number between 0 and 1"
    }),
    "",
    "Example output:",
    JSON.stringify({
      chart: { type: "pie", subtype: "basic", id: "pie_basic_v1" },
      mapping: { dimension: "category", measure: "count" },
      reason: "User asked for distribution, dataset has categorical 'category' and numeric 'count'.",
      confidence: 0.92
    }, null, 2)
  ].join("\n");
}

function buildUserPrompt({ user_intent, table_name, columns, helper }) {
  return [
    `User intent: ${user_intent}`,
    `Table: ${table_name}`,
    `Columns: ${JSON.stringify(columns, null, 2)}`,
    `Helper candidates: ${JSON.stringify(helper, null, 2)}`,
    "Steps:",
    "1) Call list_chart_catalog.",
    "2) Pick the best chart/subtype.",
    "3) Provide mapping using column names.",
    "4) Return ONLY JSON (no markdown, no text)."
  ].join("\n");
}

function makeExecuteSqlToolForTable(allowedTableNameFQ) {
  // keep the exact FQ name for the prompt & enforcement message
  const fqExact = allowedTableNameFQ;
  const mustContain = `from ${fqExact.toLowerCase()}`;

  return new DynamicStructuredTool({
    name: "execute_sql",
    description: [
      "Execute a single read-only SQL query (SELECT or WITH ... SELECT) against the provided dataset table.",
      "You MUST reference ONLY this table and MUST fully qualify it exactly as:",
      `  ${fqExact}`,
      "Do not join other tables. Do not modify data. Keep results small and aggregated.",
      "Return columns named as the chart expects (e.g., 'type' and 'value' for pie; 'step' and 'value' for funnel)."
    ].join("\n"),
    schema: z.object({
      sql: z.string().min(1),
      max_rows: z.number().int().positive().default(1000)
    }),
    func: async ({ sql, max_rows = 1000 }) => {
      console.log('Tool: execute_sql called with SQL:', sql);
      const s = sql.trim();

      // Basic safety checks
      const lowered = s.toLowerCase();
      if (!/^\s*(with|select)\b/.test(lowered)) {
        console.error('SQL validation failed: not a SELECT/WITH query');
        throw new Error("Only SELECT/WITH queries are allowed.");
      }
      if (/[;](?!\s*$)/.test(s)) {
        console.error('SQL validation failed: multiple statements');
        throw new Error("Multiple statements are not allowed.");
      }
      if (/(insert|update|delete|merge|alter|drop|truncate|grant|revoke)\b/i.test(s)) {
        console.error('SQL validation failed: non-read-only query');
        throw new Error("Only read-only queries are allowed.");
      }
      if (!lowered.includes(mustContain)) {
        console.error('SQL validation failed: wrong table reference');
        throw new Error(`Query must reference ONLY the allowed table using exact syntax: ${fqExact}`);
      }

      // Enforce a LIMIT if missing (soft cap)
      const hasLimit = /\blimit\s+\d+\s*$/i.test(lowered);
      const finalSql = hasLimit ? s : `${s}\nLIMIT ${Math.min(max_rows, 1000)}`;
      console.log('Executing SQL query:', finalSql);

      const client = await poolRO.connect();
      try {
        // Use non-LOCAL variant (no transaction required)
        await client.query(`SET statement_timeout TO '5000ms'`);
        const { rows } = await client.query(finalSql);
        console.log('SQL query returned', rows.length, 'rows');
        return JSON.stringify({ rows, rowCount: rows.length });
      } catch (error) {
        console.error('SQL execution error:', error);
        throw error;
      } finally {
        client.release();
      }
    }
  });
}


// Build the agent for step 2 at request-time so we can bind the table-specific tool
function buildAggregationGraph({ table_name, selection }) {
  const executeSqlTool = makeExecuteSqlToolForTable(table_name);

  const step2LLM = new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.OPENAI_API_KEY,
  }).bindTools([executeSqlTool]);

  async function agentNode(state) {
    const res = await step2LLM.invoke(state.messages);
    return { messages: [res] };
    // If the model decides it needs to call the tool, LangGraph will route to ToolNode
  }

  function shouldContinue(state) {
    const last = state.messages[state.messages.length - 1];
    if (last.tool_calls && last.tool_calls.length > 0) return "tools";
    return END;
  }

  const toolsNode = new ToolNode([executeSqlTool]);

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .setEntryPoint("agent");

  return graph.compile();
}

/* -------- Prompts for Step 2 (with output example) -------- */

function buildStep2SystemPrompt(chartDef) {
  const isMultiQuery = chartDef && chartDef.dynamicData && chartDef.dynamicData.queries;

  if (isMultiQuery) {
    // Multi-query chart - use new dynamicData.queries structure
    const queryDescriptions = Object.entries(chartDef.dynamicData.queries)
      .map(([key, query]) => `  * ${key}: ${query.sqlTemplate.guidance} - Expected fields: ${query.sqlTemplate.expectedFields.join(', ')}`)
      .join('\n');

    const exampleQueries = Object.fromEntries(
      Object.entries(chartDef.dynamicData.queries).map(([key, query]) => [
        key,
        {
          sql: `SELECT ${query.sqlTemplate.expectedFields.join(', ')} FROM table WHERE ... ${query.sqlTemplate.pattern} ORDER BY ${query.sqlTemplate.orderBy}`,
          result: { rows: [], rowCount: 0 }
        }
      ])
    );

    return [
      "You are a multi-query SQL aggregation assistant.",
      "Goal: generate MULTIPLE separate SQL queries for a complex chart that requires different data views.",
      "This chart requires the following queries:",
      queryDescriptions,
      "",
      "Process:",
      "1) First, explore the data with SELECT * LIMIT 5 to understand the table structure",
      "2) Generate and execute EACH query separately using the execute_sql tool",
      "3) Each query should return VChart-ready data for its specific purpose",
      "",
      "Rules:",
      "- Use ONLY the provided fully-qualified table name",
      "- SELECT or WITH ... SELECT only. No writes, no joins, no subqueries to other tables",
      "- Alias output columns exactly as specified in expectedFields",
      "- Follow the guidance provided for each query",
      "- Keep results small; add ORDER BY and LIMIT when sensible",
      "",
      "After executing ALL queries, return ONLY one JSON object:",
      JSON.stringify({
        chart: { type: generateTypesExample(), subtype: generateSubtypesExample() },
        mapping: { "<role>": "<column>" },
        queries: exampleQueries
      }, null, 2)
    ].join("\n");
  } else {
    // Single query chart - use new dynamicData.sqlTemplate structure
    const sqlTemplate = chartDef?.dynamicData?.sqlTemplate;
    const expectedFields = sqlTemplate?.expectedFields?.join(', ') || 'field1, field2';

    return [
      "You are a SQL aggregation assistant.",
      "Goal: given {chart, mapping, table} produce exactly one read-only SQL query that returns the aggregated rows required by the chart.",
      "Then CALL the execute_sql tool with that query.",
      "",
      "SQL Template Guidance:",
      sqlTemplate?.guidance || "Follow the chart requirements for field aliasing and aggregation.",
      "",
      "Rules:",
      "- Use ONLY the provided fully-qualified table name",
      "- First, explore the data with SELECT * LIMIT 5 to understand the table structure",
      "- Then, generate and execute the aggregation query",
      "- SELECT or WITH ... SELECT only. No writes, no joins, no subqueries to other tables",
      `- Alias output columns exactly as: ${expectedFields}`,
      "- Keep results small; add ORDER BY and LIMIT when sensible",
      "",
      "After tool execution, return ONLY one JSON object:",
      JSON.stringify({
        chart: { type: generateTypesExample(), subtype: generateSubtypesExample() },
        mapping: { "<role>": "<column>" },
        sql: "<the query you executed>",
        result: { rows: [/* tool rows */], rowCount: 0 }
      }, null, 2)
    ].join("\n");
  }
}

function buildStep2UserPrompt({ table_name, selection, chartDef }) {
  const promptParts = [
    `Table (use exactly as written): ${table_name}`,
    `Chart selection: ${JSON.stringify(selection.chart)}`,
    `Mapping: ${JSON.stringify(selection.mapping)}`
  ];

  // Add SQL Template Pattern if available
  const isMultiQuery = chartDef?.dynamicData?.queries;
  if (isMultiQuery) {
    promptParts.push(
      "",
      "SQL Template Patterns:",
      Object.entries(chartDef.dynamicData.queries)
        .map(([key, query]) => `  ${key}: ${query.sqlTemplate.pattern}`)
        .join('\n')
    );
  } else if (chartDef?.dynamicData?.sqlTemplate?.pattern) {
    promptParts.push(
      "",
      "SQL Template Pattern:",
      chartDef.dynamicData.sqlTemplate.pattern
    );
  }

  promptParts.push(
    "",
    "Now:",
    "1) Explore the data structure with SELECT * LIMIT 5",
    "2) Generate and execute the required SQL queries",
    "3) Return ONLY the JSON object with chart, mapping, and data"
  );

  return promptParts.join("\n");
}

/* ----------------------------- Step 3: Spec Generation Agent ----------------------------- */

// Build a small graph that:
// 1) Calls get_chart_definition with {type, subtype}
// 2) Uses that guidance + selection + aggregated rows to emit a VChart spec object
function buildSpecGraph() {
  const specLLM = new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.OPENAI_API_KEY,
  }).bindTools([getChartDefinitionTool]);

  async function agentNode(state) {
    const res = await specLLM.invoke(state.messages);
    return { messages: [res] };
  }

  function shouldContinue(state) {
    const last = state.messages[state.messages.length - 1];
    if (last.tool_calls && last.tool_calls.length > 0) return "tools";
    return END;
  }

  const toolsNode = new ToolNode([getChartDefinitionTool]);

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .setEntryPoint("agent");

  return graph.compile();
}

/* -------- Prompts for Step 3 (only returns { spec }) -------- */

function buildStep3SystemPrompt(targetPaths) {
  const isMultiQuery = targetPaths && typeof targetPaths === 'object' && !targetPaths.single;

  let targetExample;
  if (isMultiQuery) {
    // Multi-query example with actual target paths
    const exampleQueries = {};
    Object.entries(targetPaths).forEach(([key, target]) => {
      exampleQueries[key] = { sql: "SELECT ...", target: target };
    });
    targetExample = JSON.stringify({ dataMapping: { queries: exampleQueries } }, null, 2);
  } else {
    // Single-query example with actual target path
    const singleTarget = targetPaths?.single || targetPaths || "data.values";
    targetExample = JSON.stringify({ dataMapping: { sql: "SELECT ...", target: singleTarget } }, null, 2);
  }

  return [
    "You are a VChart spec template generator.",
    "Input context will include: (a) chart selection {type, subtype, mapping}, (b) SQL queries and results.",
    "You MUST first call get_chart_definition with { type, subtype } to retrieve targeted guidance and examples.",
    "Then produce ONE valid VChart spec template WITHOUT embedded data + dataMapping instructions.",
    "",
    "Very important output constraints:",
    "- The output MUST be valid JSON. Do NOT include functions, code, or comments anywhere.",
    "- Only use JSON-serializable values (strings, numbers, booleans, arrays, objects, null).",
    "- DO NOT embed actual data in the spec - create empty data containers instead.",
    "",
    "Rules:",
    "- Create a template spec with EMPTY data containers (empty arrays).",
    "- Use field names per guidance defaults from the chart definition.",
    "- For multi-query charts, create multiple empty data containers.",
    "- Add reasonable defaults from guidance (legends/labels/title).",
    "- Use the EXACT target paths provided in the user prompt - do NOT modify them.",
    "- Output ONLY a JSON object with keys 'spec' and 'dataMapping'. No markdown, no extra text.",
    "",
    "Target format example for this chart type:",
    targetExample
  ].join("\n");
}


function buildStep3UserPrompt({ selection, aggregation, targetPaths }) {
  let sqlInfo, sampleRowsInfo, targetInfo;

  if (aggregation.queries) {
    // Multi-query format
    const queryEntries = Object.entries(aggregation.queries);
    sqlInfo = `SQL queries used:\n${queryEntries.map(([key, query]) => `  ${key}: ${query.sql}`).join('\n')}`;

    // Show sample rows from each query
    const sampleRows = {};
    queryEntries.forEach(([key, query]) => {
      sampleRows[key] = query.result.rows.slice(0, 2); // 2 samples per query
    });
    sampleRowsInfo = `Sample rows by query: ${JSON.stringify(sampleRows)}`;

    // Multi-query target paths
    targetInfo = `Required target paths: ${JSON.stringify(targetPaths)}`;

  } else {
    // Single-query format (legacy)
    sqlInfo = `SQL used: ${aggregation.sql}`;
    sampleRowsInfo = `Sample rows: ${JSON.stringify(aggregation.result.rows.slice(0, 3))}`;

    // Single-query target path
    const singleTarget = targetPaths?.single || targetPaths;
    targetInfo = `Required target path: "${singleTarget}"`;
  }

  return [
    `Chart selection: ${JSON.stringify(selection.chart)}`,
    `Mapping: ${JSON.stringify(selection.mapping)}`,
    sqlInfo,
    sampleRowsInfo,
    targetInfo,
    "",
    "Steps:",
    "1) Call get_chart_definition with { type, subtype }.",
    "2) Generate a VChart spec template with EMPTY data containers that match the target structure.",
    aggregation.queries ?
      "3) Return ONLY: { \"spec\": <template>, \"dataMapping\": { \"queries\": { \"<queryKey>\": { \"sql\": <sql>, \"target\": <exact_target_provided> }, ... } } }" :
      "3) Return ONLY: { \"spec\": <template>, \"dataMapping\": { \"sql\": <sql>, \"target\": <exact_target_provided> } }",
    "4) CRITICAL: Use the EXACT target paths provided above. Do NOT modify them.",
    "5) DON'T return your comments, markdown, quotes, triple quotes or anything. Just the JSON"
  ].join("\n");
}


/* ----------------------------- Helper Functions ----------------------------- */

/**
 * Extract field names that the VChart spec expects from the data
 * This helps detect mismatches between SQL results and chart expectations
 */
function extractFieldsFromSpec(spec) {
  const fields = [];
  
  try {
    // Extract common field mappings
    if (spec.categoryField) fields.push(spec.categoryField);
    if (spec.valueField) fields.push(spec.valueField);
    if (spec.xField) fields.push(spec.xField);
    if (spec.yField) fields.push(spec.yField);
    if (spec.seriesField) fields.push(spec.seriesField);
    
    // For multi-series charts, check series configurations
    if (spec.series && Array.isArray(spec.series)) {
      spec.series.forEach(s => {
        if (s.categoryField) fields.push(s.categoryField);
        if (s.valueField) fields.push(s.valueField);
        if (s.xField) fields.push(s.xField);
        if (s.yField) fields.push(s.yField);
      });
    }
    
    // Look at data structure if available (for validation)
    if (spec.data && Array.isArray(spec.data) && spec.data.length > 0) {
      const firstDataset = spec.data[0];
      if (firstDataset.values && Array.isArray(firstDataset.values) && firstDataset.values.length > 0) {
        const sampleRow = firstDataset.values[0];
        if (typeof sampleRow === 'object' && sampleRow !== null) {
          Object.keys(sampleRow).forEach(key => {
            if (!fields.includes(key)) {
              fields.push(key);
            }
          });
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting fields from spec:', error);
  }
  
  return [...new Set(fields)]; // Remove duplicates
}

/**
 * Store chart generation metadata in database for tracking and future dynamic fetching
 */
async function storeChartGenerationMetadata(params) {
  const {
    user_intent,
    dataset_id,
    user_id,
    selection,
    aggregation,
    spec,
    sqlFields,
    specFields,
    execution_time_ms
  } = params;
  
  const client = await pool.connect();
  try {
    // Check if fields are compatible
    const fieldsCompatible = JSON.stringify([...sqlFields].sort()) === JSON.stringify([...specFields].sort());
    
    const insertResult = await client.query(`
      INSERT INTO chart_generations (
        user_id, dataset_id, user_prompt, generated_chart_spec,
        chart_type, columns_used, model_used, execution_time_ms,
        was_successful, sql_query, field_mappings, confidence_score,
        generated_sql_query, sql_fields, spec_fields, fields_compatible,
        dynamic_fetch_ready
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING generation_id
    `, [
      user_id || 'anonymous', // user_id from request
      dataset_id,
      user_intent,
      JSON.stringify(spec),
      `${selection.chart.type}.${selection.chart.subtype}`,
      JSON.stringify(sqlFields),
      'gpt-5-mini',
      execution_time_ms || 0,
      true,
      aggregation.sql,
      JSON.stringify(selection.mapping),
      selection.confidence || 0.5,
      aggregation.sql, // generated_sql_query (same as sql_query for now)
      JSON.stringify(sqlFields),
      JSON.stringify(specFields),
      fieldsCompatible,
      true // dynamic_fetch_ready - Phase 1 is ready for dynamic fetching
    ]);
    
    console.log('Chart generation metadata stored with ID:', insertResult.rows[0].generation_id);
    return insertResult.rows[0].generation_id;
    
  } catch (error) {
    console.error('Error storing chart generation metadata:', error);
    // Don't fail the entire request if metadata storage fails
    return null;
  } finally {
    client.release();
  }
}

/* ----------------------------- Lambda Handler ----------------------------- */

// Helper to create streaming response chunks
function createStreamChunk(type, content) {
  return `data: ${JSON.stringify({ type, content, timestamp: new Date().toISOString() })}\n\n`;
}

exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    console.log('=== Lambda Handler Started (Streaming) ===');
    console.log('Event:', JSON.stringify(event));
    
    // Check if streaming is requested
    const isStreaming = event.queryStringParameters?.stream === 'true';
    
    if (isStreaming) {
      // Real streaming mode using responseStream
      const addStreamChunk = (content, type = 'progress') => {
        const chunk = createStreamChunk(type, content);
        responseStream.write(chunk);
        // Strip emojis from console logs while keeping them in the stream
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const cleanContent = contentStr.replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
        console.log(`Streamed ${type} chunk: ${cleanContent.substring(0, 50)}...`);
      };

      try {
        addStreamChunk('🚀 Starting AI Agent...');
        
        const result = await processChartGeneration(event, addStreamChunk);
        
        // Send final result
        addStreamChunk(result, 'complete');
        
        console.log('Streaming completed successfully');
        responseStream.end();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorChunk = createStreamChunk('error', `Error: ${error.message}`);
        responseStream.write(errorChunk);
        responseStream.end();
      }
    } else {
      // Non-streaming version (original logic) - return JSON directly
      try {
        const result = await processChartGeneration(event);
        responseStream.write(JSON.stringify(result));
        responseStream.end();
      } catch (error) {
        console.error('=== Lambda Error ===');
        console.error('Error message:', error?.message || error);
        responseStream.write(JSON.stringify({ error: String(error?.message || error) }));
        responseStream.end();
      }
    }
  }
);


// Main processing function that can work with or without streaming
async function processChartGeneration(event, streamThought = null) {
  const startTime = Date.now(); // Track total execution time
  const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
  console.log('Parsed body:', JSON.stringify(body));
  
  const { user_intent, dataset_id, table_name, user_id } = body || {};
  console.log('Extracted params:', { user_intent, dataset_id, table_name, user_id });

  if (!user_intent || !dataset_id || !table_name) {
    throw new Error("Missing required fields: user_intent, dataset_id, table_name");
  }

  // 1) Read dataset schema/metadata
  streamThought?.("🔍 Analyzing dataset structure and column types...");
  console.log('Step 1: Fetching dataset columns for dataset_id:', dataset_id);
  const columns = await fetchDatasetColumns(dataset_id);
  console.log('Fetched columns count:', columns?.length);
  
  if (!columns || columns.length === 0) {
    throw new Error("No column metadata found for dataset_id: " + dataset_id);
  }

  // 2) Build helper candidates for the LLM
  streamThought?.("🧠 Building AI-friendly column analysis...");
  console.log('Step 2: Building helper candidates');
  const helper = summarizeColumns(columns);
  console.log('Helper candidates:', JSON.stringify(helper));

  // 3) Step 1: Chart Selection
  streamThought?.("📊 Choosing the best chart type for your dataset...");
  console.log('Step 3: Creating system and human messages for chart selection');

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({ user_intent, table_name, columns, helper });

  console.log('\n=== STEP 1: CHART SELECTION AGENT PROMPTS ===');
  console.log('SYSTEM PROMPT:', systemPrompt);
  console.log('USER PROMPT:', userPrompt);
  console.log('=== END STEP 1 PROMPTS ===\n');

  const system = new SystemMessage(systemPrompt);
  const human = new HumanMessage(userPrompt);

  console.log('Invoking chart selection graph...');
  const finalState = await app.invoke({ messages: [system, human] });
  console.log('Chart selection graph completed');
  const last = finalState.messages[finalState.messages.length - 1];
  console.log('Last message content:', last?.content);
  
  let selection;
  try {
    selection = JSON.parse(last.content);
    console.log('Parsed selection:', JSON.stringify(selection));
  } catch (e) {
    console.log('Failed to parse JSON directly, trying fallback:', e.message);
    const match = (last.content || "").match(/\{[\s\S]*\}$/);
    if (match) {
      selection = JSON.parse(match[0]);
      console.log('Fallback parsing successful:', JSON.stringify(selection));
    }
  }

  if (!selection || !selection.chart || !selection.mapping) {
    throw new Error("Model did not return a valid selection: " + last?.content);
  }

  streamThought?.(`✅ Selected: ${selection.chart.type} ${selection.chart.subtype} chart`);

  // --- STEP 2: Data Aggregation ---
  streamThought?.("🔧 Generating and executing SQL query to aggregate your data...");
  console.log('\n=== Step 2: Data Aggregation ===');
  
  const tableFQ = `public."${table_name}"`; 
  console.log('Building aggregation graph for table:', tableFQ);
  const step2App = buildAggregationGraph({ table_name: tableFQ, selection });

  // Get chart definition from catalog
  const chartKey = `${selection.chart.type}.${selection.chart.subtype}`;
  const chartDef = CHART_CATALOG.defs[chartKey];

  const step2SystemPrompt = buildStep2SystemPrompt(chartDef);
  const step2UserPrompt = buildStep2UserPrompt({ table_name: tableFQ, selection, chartDef });

  console.log('\n=== STEP 2: SQL GENERATION AGENT PROMPTS ===');
  console.log('SYSTEM PROMPT:', step2SystemPrompt);
  console.log('USER PROMPT:', step2UserPrompt);
  console.log('=== END STEP 2 PROMPTS ===\n');

  const step2System = new SystemMessage(step2SystemPrompt);
  const step2Human = new HumanMessage(step2UserPrompt);

  console.log('Invoking aggregation graph...');
  const step2State = await step2App.invoke({ messages: [step2System, step2Human] });
  console.log('Aggregation graph completed');
  const step2Last = step2State.messages[step2State.messages.length - 1];
  console.log('Step 2 last message content:', step2Last?.content);

  let aggregation;
  try {
    aggregation = JSON.parse(step2Last.content);
    console.log('Parsed aggregation:', JSON.stringify(aggregation));
  } catch (e) {
    console.log('Failed to parse aggregation JSON directly, trying fallback:', e.message);
    const m = (step2Last.content || "").match(/\{[\s\S]*\}$/);
    if (m) {
      aggregation = JSON.parse(m[0]);
      console.log('Fallback aggregation parsing successful');
    }
  }

  // Validate aggregation format - handle both single-query and multi-query formats
  let totalRowCount = 0;
  if (aggregation?.queries) {
    // Multi-query format
    const queryKeys = Object.keys(aggregation.queries);
    if (queryKeys.length === 0) {
      throw new Error("Multi-query aggregation step did not return any queries: " + step2Last?.content);
    }
    
    for (const [queryKey, queryData] of Object.entries(aggregation.queries)) {
      if (!queryData?.result || !Array.isArray(queryData.result.rows)) {
        throw new Error(`Multi-query aggregation step query '${queryKey}' did not return valid rows: ` + step2Last?.content);
      }
      totalRowCount += queryData.result.rows.length;
    }
    console.log(`Multi-query aggregation: ${queryKeys.length} queries with total ${totalRowCount} rows`);
    
  } else if (aggregation?.result && Array.isArray(aggregation.result.rows)) {
    // Single-query format (legacy)
    totalRowCount = aggregation.result.rows.length;
    console.log('Single-query aggregation rows count:', totalRowCount);
    
  } else {
    throw new Error("Aggregation step did not return valid format (expected either 'result.rows' or 'queries'): " + step2Last?.content);
  }
  
  streamThought?.(`📈 Data processed: ${totalRowCount} data points ready for visualization`);

  // --- STEP 3: VChart Spec Generation ---
  streamThought?.("🎨 Building interactive chart specification...");
  console.log('\n=== Step 3: VChart Spec Generation ===');

  // Extract target paths from new dynamicData structure
  let targetPaths;

  if (chartDef?.dynamicData?.queries) {
    // Multi-query chart
    targetPaths = {};
    Object.entries(chartDef.dynamicData.queries).forEach(([key, query]) => {
      targetPaths[key] = query.injection.target;
    });
  } else if (chartDef?.dynamicData?.injection?.target) {
    // Single query chart
    targetPaths = chartDef.dynamicData.injection.target;
  } else {
    // Fallback to default
    targetPaths = "data.values";
  }

  console.log('Extracted target paths from chart definition:', targetPaths);

  const step3App = buildSpecGraph();
  const step3SystemPrompt = buildStep3SystemPrompt(targetPaths);
  const step3UserPrompt = buildStep3UserPrompt({ selection, aggregation, targetPaths });

  console.log('\n=== STEP 3: VCHART SPEC GENERATION AGENT PROMPTS ===');
  console.log('SYSTEM PROMPT:', step3SystemPrompt);
  console.log('USER PROMPT:', step3UserPrompt);
  console.log('=== END STEP 3 PROMPTS ===\n');

  const step3System = new SystemMessage(step3SystemPrompt);
  const step3Human = new HumanMessage(step3UserPrompt);

  console.log('Invoking spec generation graph...');
  const step3State = await step3App.invoke({ messages: [step3System, step3Human] });
  console.log('Spec generation graph completed');
  const step3Last = step3State.messages[step3State.messages.length - 1];
  console.log('Step 3 last message content:', step3Last?.content);

  let specOut;
  try {
    specOut = JSON.parse(step3Last.content);
    console.log('Parsed spec output successfully');
  } catch (e) {
    console.log('Failed to parse spec JSON directly, trying fallback:', e.message);
    const m = (step3Last.content || "").match(/\{[\s\S]*\}$/);
    if (m) {
      specOut = JSON.parse(m[0]);
      console.log('Fallback spec parsing successful');
    }
  }

  if (!specOut || !specOut.spec || !specOut.dataMapping) {
    throw new Error("Spec generation step did not return a valid { spec, dataMapping } object: " + step3Last?.content);
  }

  streamThought?.("✨ Chart ready! Rendering your visualization...");
  
  // --- Final response ---
  console.log('\n=== Success! Returning final response ===');
  
  // Extract field information for future dynamic fetching
  let sqlFields = [];
  if (aggregation.queries) {
    // Multi-query format - extract fields from all queries
    const allFields = new Set();
    Object.values(aggregation.queries).forEach(query => {
      if (query.result?.rows?.length > 0) {
        Object.keys(query.result.rows[0]).forEach(field => allFields.add(field));
      }
    });
    sqlFields = Array.from(allFields);
  } else if (aggregation.result?.rows?.length > 0) {
    // Single-query format (legacy)
    sqlFields = Object.keys(aggregation.result.rows[0]);
  }
  const specFields = extractFieldsFromSpec(specOut.spec);
  
  // Store chart generation metadata in database (async, non-blocking)
  const executionTime = Date.now() - startTime;
  
  storeChartGenerationMetadata({
    user_intent,
    dataset_id,
    user_id,
    selection,
    aggregation,
    spec: specOut.spec,
    sqlFields,
    specFields,
    execution_time_ms: executionTime
  }).catch(error => {
    console.error('Failed to store chart metadata (non-blocking):', error);
  });
  
  const result = {
    step: "spec",
    selection,
    aggregation: {
      ...aggregation,
      // Add metadata for future dynamic data fetching
      sql: aggregation.sql,
      table_name: tableFQ,
      dataSchema: {
        sqlFields: sqlFields,
        specFields: specFields,
        chartType: selection.chart.type,
        subtype: selection.chart.subtype
      }
    },
    spec: specOut.spec,
    dataMapping: specOut.dataMapping
  };
  
  console.log('Response ready with field mapping metadata:', result.aggregation.dataSchema);
  return result;
}
