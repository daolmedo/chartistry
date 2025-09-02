// index.js - AWS Lambda handler for Step 1 (chart selection only)
// npm i @langchain/openai @langchain/langgraph @langchain/core zod pg

import { Pool } from "pg";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import {
  StateGraph,
  MessagesAnnotation,
  END
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  SystemMessage
} from "@langchain/core/messages";

/* ----------------------------- DB Utilities ----------------------------- */


const dbConfig = {
  host: "chartz-ai.cexryffwmiie.eu-west-2.rds.amazonaws.com",
  port: 5432,
  database: "chartz",
  user: "postgres",
  password: "ppddA4all.",
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
  const client = await pool.connect();
  try {
    const sql = `
      SELECT column_name, field_role, semantic_type, postgres_type,
             unique_count, cardinality_ratio, contains_nulls_pct
      FROM dataset_columns
      WHERE dataset_id = $1
      ORDER BY column_index ASC
    `;
    const { rows } = await client.query(sql, [dataset_id]);
    return rows;
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
      mapping: { required: ["step", "id"] },
      summary: "Conversion funnel with DISTINCT id per step."
    }
  ],

  // Rich, per-chart definitions (for Step 3). Key = `${type}.${subtype}`
  defs: {
    "pie.basic": {
      id: "pie_basic_v1",
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
      expectedDataShapes: [
        { outer: "[{ type: string, value: number }]", inner: "[{ type: string, value: number }]" },
        { outer: "[{ [categoryField]: string, [valueField]: number }]", inner: "[{ [categoryField]: string, [valueField]: number }]" }
      ],
      vchartGuidance: {
        chartType: "common",
        series: [
          { type: "pie", dataIndex: 0, outerRadius: 0.65, innerRadius: 0 },
          { type: "pie", dataIndex: 1, outerRadius: 0.8, innerRadius: 0.67 }
        ],
        defaultFields: { categoryField: "type", valueField: "value" },
        dataInjection: "two datasets: id 'id0' for outer, id 'id1' for inner",
        labelNotes: "Outer ring: inside labels; inner ring: outside labels as needed."
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
    }
  }
};


/* ----------------------------- Catalog Tools ----------------------------- */

// Small list for Step 1 selector
const listChartCatalogTool = tool({
  name: "list_chart_catalog",
  description:
    "Return the small index of supported charts/subtypes and required mappings. Use this to decide which chart to pick.",
  schema: z.object({}),
  func: async () => JSON.stringify(CHART_CATALOG.index)
});

// Targeted definition for Step 3 spec generation
const getChartDefinitionTool = tool({
  name: "get_chart_definition",
  description:
    "Return a detailed chart definition (examples, guidance) for a given { type, subtype }. Use this to generate a VChart spec that matches aggregated data.",
  schema: z.object({
    type: z.enum(["pie", "funnel"]),
    subtype: z.enum(["basic", "nested", "conversion"])
  }),
  func: async ({ type, subtype }) => {
    const key = `${type}.${subtype}`;
    const def = CHART_CATALOG.defs[key];
    if (!def) throw new Error(`No chart definition for ${key}`);
    return JSON.stringify({ type, subtype, ...def });
  }
});


/* ----------------------------- LLM + Graph ----------------------------- */

const llm = new ChatOpenAI({
  model: "gpt-5-mini",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0 // deterministic selection
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
  .addEntryPoint("agent");

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
    "For funnel.conversion, you MUST require an identifier column.",
    "",
    "Output format:",
    "Return ONLY one JSON object, no markdown, no prose.",
    "",
    "Schema:",
    JSON.stringify({
      chart: { type: "<pie|funnel>", subtype: "<basic|nested|conversion>", id: "<registry id>" },
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

  return tool({
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
    func: async ({ sql, max_rows }) => {
      const s = sql.trim();

      // Basic safety checks
      const lowered = s.toLowerCase();
      if (!/^\s*(with|select)\b/.test(lowered)) {
        throw new Error("Only SELECT/WITH queries are allowed.");
      }
      if (/[;](?!\s*$)/.test(s)) {
        throw new Error("Multiple statements are not allowed.");
      }
      if (/(insert|update|delete|merge|alter|drop|truncate|grant|revoke)\b/i.test(s)) {
        throw new Error("Only read-only queries are allowed.");
      }
      if (!lowered.includes(mustContain)) {
        throw new Error(`Query must reference ONLY the allowed table using exact syntax: ${fqExact}`);
      }

      // Enforce a LIMIT if missing (soft cap)
      const hasLimit = /\blimit\s+\d+\s*$/i.test(lowered);
      const finalSql = hasLimit ? s : `${s}\nLIMIT ${Math.min(max_rows, 1000)}`;

      const client = await poolRO.connect();
      try {
        // Use non-LOCAL variant (no transaction required)
        await client.query(`SET statement_timeout TO '5000ms'`);
        const { rows } = await client.query(finalSql);
        return JSON.stringify({ rows, rowCount: rows.length });
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
    temperature: 0
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
    .addEntryPoint("agent");

  return graph.compile();
}

/* -------- Prompts for Step 2 (with output example) -------- */

function buildStep2SystemPrompt() {
  return [
    "You are a SQL aggregation assistant.",
    "Goal: given {chart, mapping, table} produce exactly one read-only SQL query that returns the aggregated rows required by the chart.",
    "Then CALL the execute_sql tool with that query.",
    "Rules:",
    "- Use ONLY the provided fully-qualified table name.",
    "- SELECT or WITH ... SELECT only. No writes, no joins, no subqueries to other tables.",
    "- Alias output columns exactly as required:",
    "  * pie.basic: columns => type, value",
    "  * pie.nested (outer): type, value   (category total)",
    "  * pie.nested (inner): type, value   (category • subcategory)",
    "  * funnel.basic: columns => step, value",
    "  * funnel.conversion: columns => step, value (distinct identifier per step)",
    "- Prefer SUM for numeric measures, COUNT(DISTINCT id) for conversion if mapping includes 'id'.",
    "- Keep results small; add ORDER BY and LIMIT when sensible.",
    "",
    "After tool execution, return ONLY one JSON object:",
    JSON.stringify({
      chart: { type: "<pie|funnel>", subtype: "<basic|nested|conversion>" },
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

function buildStep2UserPrompt({ table_name, selection }) {
  return [
    `Table (use exactly as written): ${table_name}`,
    `Chart selection: ${JSON.stringify(selection.chart)}`,
    `Mapping: ${JSON.stringify(selection.mapping)}`,
    "",
    "Now:",
    "1) Write the SQL.",
    "2) Call execute_sql tool with { sql }.",
    "3) Return ONLY the JSON object with chart, mapping, sql, result."
  ].join("\n");
}

/* ----------------------------- Step 3: Spec Generation Agent ----------------------------- */

// Build a small graph that:
// 1) Calls get_chart_definition with {type, subtype}
// 2) Uses that guidance + selection + aggregated rows to emit a VChart spec object
function buildSpecGraph() {
  const specLLM = new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0
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
    .addEntryPoint("agent");

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
    "- Data injection:",
    "  * pie.basic -> data: [{ id: 'id0', values: rows }], and set valueField/categoryField appropriately.",
    "  * pie.nested -> if only one array of rows is available, gracefully fallback to a single-ring pie using those rows.",
    "  * funnel.basic/conversion -> data: [{ id: 'funnel', values: rows }], categoryField ('name' or 'step'), valueField 'value'.",
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

export const handler = async (event) => {
  const headers = { "Content-Type": "application/json" };
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
    const { user_intent, dataset_id, table_name } = body || {};

    if (!user_intent || !dataset_id || !table_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields: user_intent, dataset_id, table_name"
        })
      };
    }

    // 1) Read dataset schema/metadata
    const columns = await fetchDatasetColumns(dataset_id);
    if (!columns || columns.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "No column metadata found for dataset_id",
          dataset_id
        })
      };
    }

    // 2) Build helper candidates for the LLM
    const helper = summarizeColumns(columns);

    // 3) Run the graph (agent -> tool -> agent) until it returns a final message
    const system = new SystemMessage(buildSystemPrompt());
    const human = new HumanMessage(
      buildUserPrompt({ user_intent, table_name, columns, helper })
    );

    const finalState = await app.invoke({ messages: [system, human] });
    const last = finalState.messages[finalState.messages.length - 1];
    let selection;
    try {
      selection = JSON.parse(last.content);
    } catch (e) {
      // Fallback: try to extract JSON blob
      const match = (last.content || "").match(/\{[\s\S]*\}$/);
      if (match) selection = JSON.parse(match[0]);
    }

    if (!selection || !selection.chart || !selection.mapping) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: "Model did not return a valid selection.",
          raw: last?.content
        })
      };
    }

    // --- STEP 2: aggregate data via SQL using a tool-called by the LLM ---
    // Build a per-request graph bound to the *exact* table name
    const tableFQ = `public."${table_name}"`; // ensure the model uses this exact form
    const step2App = buildAggregationGraph({ table_name: tableFQ, selection });

    const step2System = new SystemMessage(buildStep2SystemPrompt());
    const step2Human = new HumanMessage(buildStep2UserPrompt({ table_name: tableFQ, selection }));

    const step2State = await step2App.invoke({ messages: [step2System, step2Human] });
    const step2Last = step2State.messages[step2State.messages.length - 1];

    let aggregation;
    try {
      aggregation = JSON.parse(step2Last.content);
    } catch (e) {
      const m = (step2Last.content || "").match(/\{[\s\S]*\}$/);
      if (m) aggregation = JSON.parse(m[0]);
    }

    if (!aggregation || !aggregation.result || !Array.isArray(aggregation.result.rows)) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: "Aggregation step did not return valid rows.",
          raw: step2Last?.content
        })
      };
    }

// --- STEP 3: generate VChart spec using the chosen chart + aggregated rows ---
    const step3App = buildSpecGraph();
    const step3System = new SystemMessage(buildStep3SystemPrompt());
    const step3Human = new HumanMessage(buildStep3UserPrompt({ selection, aggregation }));

    const step3State = await step3App.invoke({ messages: [step3System, step3Human] });
    const step3Last = step3State.messages[step3State.messages.length - 1];

    let specOut;
    try {
      specOut = JSON.parse(step3Last.content);
    } catch (e) {
      const m = (step3Last.content || "").match(/\{[\s\S]*\}$/);
      if (m) specOut = JSON.parse(m[0]);
    }

    if (!specOut || !specOut.spec) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: "Spec generation step did not return a valid { spec } object.",
          raw: step3Last?.content
        })
      };
    }

    // --- Final response: Step 1 + Step 2 + Step 3 (frontend expects 'spec') ---
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        step: "spec",
        selection,
        aggregation,
        spec: specOut.spec
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: String(err?.message || err) })
    };
  }
};
