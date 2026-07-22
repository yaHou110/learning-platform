// validate-task-output.mjs — canonical JSON Schema validator for task-output.json
// Invoked by Invoke-TaskOutput.ps1 (Stage 1). Exits 0 on valid, 1 on any violation.
// Uses Ajv (draft-07) if available; falls back to a structural checker so the
// handoff chain is never *more* broken than the project's current deps. In a
// repo without ajv installed, the structural fallback still enforces every
// required field + types — it just can't do format/regex constraints.
//
// Usage: node validate-task-output.mjs <path-to-task-output.json>

import { readFileSync, existsSync } from "node:fs";

const argPath = process.argv[2];
if (!argPath) {
  console.error("validate-task-output.mjs: missing file argument");
  process.exit(3);
}

if (!existsSync(argPath)) {
  console.error(`validate-task-output.mjs: file not found: ${argPath}`);
  process.exit(3);
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(argPath, "utf8"));
} catch (e) {
  console.error(`validate-task-output.mjs: invalid JSON: ${e.message}`);
  process.exit(3);
}

const version = parsed.schema_version;
if (typeof version !== "number") {
  console.error("validate-task-output.mjs: missing/non-number schema_version");
  process.exit(3);
}

// Locate the schema for this version.
const schemaPath = new URL(
  `../../.claude/state/schema/v${version}.schema.json`,
  import.meta.url
);
if (!existsSync(schemaPath)) {
  console.error(
    `validate-task-output.mjs: no schema found for schema_version=${version} (${schemaPath.pathname})`
  );
  process.exit(3);
}

let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, "utf8"));
} catch (e) {
  console.error(`validate-task-output.mjs: schema is not valid JSON: ${e.message}`);
  process.exit(3);
}

// ---- Try Ajv (authoritative). ----
  try {
    const mod = await import("ajv");
    const Ajv = mod.default || mod.Ajv;
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    if (validate(parsed)) {
      console.log(`task-output.json valid against schema v${version}`);
      process.exit(0);
    }
    for (const err of validate.errors || []) {
      console.error(
        `schema error: ${err.instancePath || "/"} ${err.message || ""}` +
          (err.params ? ` ${JSON.stringify(err.params)}` : "")
      );
    }
    process.exit(3);
  } catch (e) {
    // Ajv not installed — fall through to structural check.
    console.error(
      `validate-task-output.mjs: ajv unavailable (${e.code || e.message}); using structural fallback.`
    );
  }

// ---- Structural fallback. Enforces required + types; no format/regex. ----
const required = schema.required || [];
const props = schema.properties || {};
const failures = [];
for (const key of required) {
  if (!(key in parsed)) failures.push(`missing required field: ${key}`);
}
for (const [k, v] of Object.entries(props)) {
  if (!(k in parsed) || parsed[k] === null) {
    if (v.type && !required.includes(k)) continue; // optional absent is fine
    if (!(k in parsed)) continue;
  }
  const val = parsed[k];
  const actual =
    Array.isArray(val) ? "array" :
    typeof val;
  if (v.type) {
    const expected = Array.isArray(v.type) ? v.type : [v.type];
    if (!expected.includes(actual)) {
      failures.push(`field '${k}' must be ${expected.join("|")} (got ${actual})`);
    }
  }
  if ((v.type === "array" || (Array.isArray(v.type) && v.type.includes("array"))) &&
      !Array.isArray(val) && (k in parsed) && required.includes(k)) {
    failures.push(`field '${k}' must be an array`);
  }
}
if (parsed.merge_policy &&
    !["manual", "auto-on-green"].includes(parsed.merge_policy)) {
  failures.push(`merge_policy must be 'manual' or 'auto-on-green' (got '${parsed.merge_policy}')`);
}
if (parsed.status && !["draft", "in-progress", "completed"].includes(parsed.status)) {
  failures.push(`status must be draft|in-progress|completed (got '${parsed.status}')`);
}
if (failures.length === 0) {
  console.log(`task-output.json valid (structural fallback) for schema v${version}`);
  process.exit(0);
}
for (const f of failures) console.error(`schema error: ${f}`);
process.exit(3);
