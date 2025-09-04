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

  // Rich, per-chart definitions (for Step 3). Key = `${type}.${subtype}`
  defs: {
    "pie.basic": {
      id: "pie_basic_v1",
      requirement: "pie.basic: columns => type, value",
      sql_guidance: "Produce a single dataset with categorical breakdown. Group by the dimension field as `type`, aggregate the measure as `value`. Use SUM for numeric measures, COUNT for frequency analysis, or COUNT(DISTINCT id) for unique identifiers. COALESCE null categories to 'Unknown'. Limit to top 10-12 categories and consider creating an 'Other' bucket for remaining small categories. Order by `value` DESC to show largest segments first.",
      expectedDataShapes: [
        // Agent should adapt to any of these shapes and produce a valid spec.
        { rows: "[{ type: string, value: number }]" },
        { rows: "[{ [categoryField]: string, [valueField]: number }]" }
      ],
      vchartGuidance: {
        chartType: "pie",
        defaultFields: { categoryField: "type", valueField: "value" },
        dataInjection: "single dataset with id 'id0'",
        commonOptions: {
          outerRadius: 0.8,
          legends: { visible: true, orient: "left" },
          label: { visible: true }
        },
        tooltipNote: "If values are percentages, show '%' in tooltip; otherwise raw value."
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
      requirement:
        "pie.nested: inner ring (dimension1 totals) => { type, value }; outer ring (dimension2 within dimension1) => { parent, type, value }",
      sql_guidance: "Produce two datasets with consistent totals. Inner (id0): group by dimension1 as `type`, aggregate measure as `value`. Outer (id1): group by dimension1,dimension2; alias dimension1 as `parent`, dimension2 as `type`, aggregate as `value`. Filter outer to the same parent set as inner (e.g., top 8–12). Ensure per-parent child sums equal the inner `value`. Use COUNT(DISTINCT id) for identifier measures; otherwise SUM(measure). COALESCE nulls to 'Unknown'/'Other'. Keep categories per parent ≤ 8 and allow an 'Other' bucket. Alias columns exactly as specified and order by `value` desc.",
      expectedDataShapes: [
        { inner: "[{ type: string, value: number }]",
          outer: "[{ parent: string, type: string, value: number }]" }
      ],
      vchartGuidance: {
        chartType: "common",
        dataInjection: "two datasets: id 'id0' (inner/parents), id 'id1' (outer/children)",
        series: [
          { type: "pie", dataIndex: 0, outerRadius: 0.65, innerRadius: 0, valueField: "value", categoryField: "type" },
          { type: "pie", dataIndex: 1, outerRadius: 0.8, innerRadius: 0.67, valueField: "value", categoryField: "type" }
        ],
        labelNotes: "Inner ring: inside labels; outer ring: outside labels as needed.",
        colorNotes: "If possible, use a shared palette keyed by `parent` so child slices inherit related hues."
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
      requirement: "funnel.basic: columns => step, value",
      sql_guidance: "Create a funnel progression dataset showing step-by-step flow. Group by the step/stage field as `step` (or alias as `name`), aggregate the measure as `value`. Steps should represent sequential stages in a process (e.g., 'Awareness', 'Interest', 'Purchase'). Use SUM for volume metrics, COUNT(DISTINCT id) for user counts. Values should generally decrease from top to bottom of funnel. Order by a sequence field or explicitly by funnel position. Keep to 4-8 meaningful steps.",
      expectedDataShapes: [
        { rows: "[{ step: string, value: number }]" },
        { rows: "[{ name: string, value: number }]" }
      ],
      vchartGuidance: {
        chartType: "funnel",
        defaultFields: { categoryField: "name|step", valueField: "value" },
        dataInjection: "single dataset with id 'funnel'",
        labelAndLegends: { label: { visible: true }, legends: { visible: true, orient: "bottom" } }
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
      requirement: "funnel.conversion: columns => step, value",
      sql_guidance: "Build conversion step data with absolute counts at each stage. Focus on user journey progression where each step represents a conversion point. The visualization will automatically calculate conversion rates between steps, so provide raw counts rather than percentages.",
      expectedDataShapes: [
        { rows: "[{ step: string, value: number }]" }
      ],
      vchartGuidance: {
        chartType: "funnel",
        defaultFields: { categoryField: "name|step", valueField: "value" },
        transformProps: { isTransform: true, isCone: false },
        labels: { label: { visible: true }, transformLabel: { visible: true }, outerLabel: { position: "right", visible: true } },
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
      requirement: "line.basic: columns => x, value [, series]",
      sql_guidance:
        "Return an ordered time/category series. Alias the horizontal axis as `x` and the numeric measure as `value`. If a grouping field is provided (e.g., product/region), alias it as `series`. Use SUM/AVG appropriately; for events over time, SUM per bucket is common. Ensure a sensible ORDER BY (time ascending, or categorical order) and LIMIT for safety. Handle null measures by returning NULL (the chart will break the line between valid points).",
      expectedDataShapes: [
        { rows: "[{ x: string|number|date, value: number }]" },
        { rows: "[{ x: string|number|date, value: number, series: string }]" },
        { rows: "[{ [xField]: any, [yField]: number }]" }
      ],
      vchartGuidance: {
        chartType: "line",
        defaultFields: { xField: "x", yField: "value", seriesField: "series" },
        dataInjection: "single dataset with id 'id0'",
        commonOptions: {
          axes: { visible: true },
          legends: { visible: true, orient: "top" },
          tooltip: { visible: true },
          // Break lines across nulls rather than drawing to them
          invalidType: "link"
        }
      },
      exampleSpecs: [
        {
          name: "Line • Basic (single series)",
          js: String.raw`const spec = {
            type: 'line',
            data: [{ id: 'id0', values: [
              { x: '2:00', value: 8 }, { x: '4:00', value: 9 }, { x: '6:00', value: 11 },
              { x: '8:00', value: 14 }, { x: '10:00', value: 16 }, { x: '12:00', value: 17 },
              { x: '14:00', value: 17 }, { x: '16:00', value: 16 }, { x: '18:00', value: 15 }
            ]}],
            xField: 'x',
            yField: 'value',
            legends: { visible: false }
          };`
        },
        {
          name: "Line • Basic (smooth)",
          js: String.raw`const spec = {
            type: 'line',
            data: [{ id: 'id0', values: [
              { x: '2:00', value: 38 }, { x: '4:00', value: 56 }, { x: '6:00', value: 10 },
              { x: '8:00', value: 70 }, { x: '10:00', value: 36 }, { x: '12:00', value: 94 },
              { x: '14:00', value: 24 }, { x: '16:00', value: 44 }, { x: '18:00', value: 36 },
              { x: '20:00', value: 68 }, { x: '22:00', value: 22 }
            ]}],
            xField: 'x',
            yField: 'value',
            line: { style: { curveType: 'monotone' } }
          };`
        },
        {
          name: "Line • Multi-series with null handling",
          js: String.raw`const spec = {
            type: 'line',
            data: [{ id: 'id0', values: [
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
            ]}],
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

function buildStep2SystemPrompt(chartRequirement) {
  return [
    "You are a SQL aggregation assistant.",
    "Goal: given {chart, mapping, table} produce exactly one read-only SQL query that returns the aggregated rows required by the chart.",
    "Then CALL the execute_sql tool with that query.",
    "Rules:",
    "- Use ONLY the provided fully-qualified table name.",
    "- First, explore the data with a simple SELECT * LIMIT 5 to understand all the fields and how the data can be mapped to the mapping.",
    "- Then, perform the query and execute it to validate it.",
    "- SELECT or WITH ... SELECT only. No writes, no joins, no subqueries to other tables.",
    "- Alias output columns exactly as required:",
    `  * ${chartRequirement}`,
    "- Prefer SUM for numeric measures, COUNT(DISTINCT id) for conversion if mapping includes 'id'.",
    "- Keep results small; add ORDER BY and LIMIT when sensible.",
    "",
    "After tool execution, return ONLY one JSON object:",
    JSON.stringify({
      chart: { type: generateTypesExample(), subtype: generateSubtypesExample() },
      mapping: { "<role>": "<column>" },
      sql: "<the query you executed>",
      result: { rows: [/* tool rows */], rowCount: 0 }
    }, null, 2),
    "",
    "Example output:",
    JSON.stringify({
      chart: { type: "pie", subtype: "basic" },
      mapping: { dimension: "category", measure: "count" },
      sql: 'SELECT "category" AS type, SUM("count") AS value FROM public."user_KOJgQolKnCSIwJea4cvZoRB4LGF2_pie_chart_extended_c_1" GROUP BY 1 ORDER BY 2 DESC LIMIT 1000',
      result: { rows: [ { type: "Images", value: 45 }, { type: "Videos", value: 30 } ], rowCount: 2 }
    }, null, 2)
  ].join("\n");
}

function buildStep2UserPrompt({ table_name, selection, sqlGuidance = null }) {
  const promptParts = [
    `Table (use exactly as written): ${table_name}`,
    `Chart selection: ${JSON.stringify(selection.chart)}`,
    `Mapping: ${JSON.stringify(selection.mapping)}`
  ];

  // Add SQL Conceptual Guidance if available
  if (sqlGuidance) {
    promptParts.push(
      "",
      "SQL Conceptual Guidance:",
      sqlGuidance
    );
  }

  promptParts.push(
    "",
    "Now:",
    "1) Write the SQL.",
    "2) Call execute_sql tool with { sql }.",
    "3) Return ONLY the JSON object with chart, mapping, sql, result."
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

function buildStep3SystemPrompt() {
  return [
    "You are a VChart spec generator.",
    "Input context will include: (a) chart selection {type, subtype, mapping}, (b) aggregated rows from SQL.",
    "You MUST first call get_chart_definition with { type, subtype } to retrieve targeted guidance and examples.",
    "Then produce ONE valid VChart spec JSON object that matches the aggregated rows.",
    "",
    "Very important output constraints:",
    "- The output MUST be valid JSON. Do NOT include functions, code, or comments anywhere (no arrow functions in tooltip, etc.).",
    "- Only use JSON-serializable values (strings, numbers, booleans, arrays, objects, null).",
    "",
    "Rules:",
    "- Use the aggregated rows AS-IS; do not hallucinate values.",
    "- Use field names per guidance defaults, but adapt if rows use 'step' vs 'name' or 'type' etc.",
    "- Follow the dataInjection, defaultFields, and other guidance from the chart definition.",
    "- Add reasonable defaults from guidance (legends/labels/title).",
    "- Output ONLY a JSON object with key 'spec'. No markdown, no extra text.",
    "",
    "Example output:",
    JSON.stringify({
      spec: {
        type: "pie",
        data: [{ id: "id0", values: [ { type: "Images", value: 45 }, { type: "Videos", value: 30 } ] }],
        outerRadius: 0.8,
        valueField: "value",
        categoryField: "type",
        legends: { visible: true, orient: "left" },
        label: { visible: true },
        title: { visible: true, text: "Files by Category" },
        tooltip: {
          // Use plain strings only; do NOT use functions
          // If you need formatting, bake it into the value strings beforehand.
        }
      }
    }, null, 2)
  ].join("\n");
}


function buildStep3UserPrompt({ selection, aggregation }) {
  return [
    `Chart selection: ${JSON.stringify(selection.chart)}`,
    `Mapping: ${JSON.stringify(selection.mapping)}`,
    `Aggregated rows (sample or all): ${JSON.stringify(aggregation.result.rows)}`,
    "",
    "Steps:",
    "1) Call get_chart_definition with { type, subtype }.",
    "2) Generate a VChart spec that uses the aggregated rows.",
    "3) Return ONLY: { \"spec\": <object> }",
    "4) DON'T return your comments, markdown, quotes, triple quotes or anything. Just the JSON }"
  ].join("\n");
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
  const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
  console.log('Parsed body:', JSON.stringify(body));
  
  const { user_intent, dataset_id, table_name } = body || {};
  console.log('Extracted params:', { user_intent, dataset_id, table_name });

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
  const system = new SystemMessage(buildSystemPrompt());
  const human = new HumanMessage(
    buildUserPrompt({ user_intent, table_name, columns, helper })
  );

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

  // Get chart requirement and SQL guidance from catalog
  const chartKey = `${selection.chart.type}.${selection.chart.subtype}`;
  const chartDef = CHART_CATALOG.defs[chartKey];
  const chartRequirement = chartDef?.requirement || `${selection.chart.type}.${selection.chart.subtype}: columns => [specify based on chart definition]`;
  const sqlGuidance = chartDef?.sql_guidance || null;
  
  const step2System = new SystemMessage(buildStep2SystemPrompt(chartRequirement));
  const step2Human = new HumanMessage(buildStep2UserPrompt({ table_name: tableFQ, selection, sqlGuidance }));

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

  if (!aggregation || !aggregation.result || !Array.isArray(aggregation.result.rows)) {
    throw new Error("Aggregation step did not return valid rows: " + step2Last?.content);
  }
  console.log('Aggregation rows count:', aggregation.result.rows.length);
  
  streamThought?.(`📈 Data processed: ${aggregation.result.rows.length} data points ready for visualization`);

  // --- STEP 3: VChart Spec Generation ---
  streamThought?.("🎨 Building interactive chart specification...");
  console.log('\n=== Step 3: VChart Spec Generation ===');
  const step3App = buildSpecGraph();
  const step3System = new SystemMessage(buildStep3SystemPrompt());
  const step3Human = new HumanMessage(buildStep3UserPrompt({ selection, aggregation }));

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

  if (!specOut || !specOut.spec) {
    throw new Error("Spec generation step did not return a valid { spec } object: " + step3Last?.content);
  }

  streamThought?.("✨ Chart ready! Rendering your visualization...");
  
  // --- Final response ---
  console.log('\n=== Success! Returning final response ===');
  const result = {
    step: "spec",
    selection,
    aggregation,
    spec: specOut.spec
  };
  
  console.log('Response ready');
  return result;
}
