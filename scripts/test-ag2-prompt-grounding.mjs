import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../agents/wikidata_ag2_agent.py", import.meta.url), "utf8");

assert.match(source, /GROUNDING_SYSTEM_INSTRUCTION = \(/);
assert.match(source, /End every answer with a `Grounding references` section/);
assert.match(source, /statement ID: not supplied/);
assert.match(source, /source URL: not supplied/);
assert.match(source, /def grounding_requirements_lines\(\) -> list\[str\]:/);
assert.match(source, /Include inline citation-style markers/);
assert.match(source, /statement=\{statement_id\}/);

const promptGroundingCount = (source.match(/\*grounding_requirements_lines\(\)/g) || []).length;
assert.ok(promptGroundingCount >= 7, `Expected entity summary, chat, and all workflow prompts to include grounding requirements, saw ${promptGroundingCount}`);

for (const action of ["research", "graph", "suggest", "verify", "report", "compare"]) {
  const actionBlock = new RegExp(`if action == "${action}":[\\s\\S]*?\\*grounding_requirements_lines\\(\\)`);
  assert.match(source, actionBlock, `Expected ${action} workflow prompt to include grounding requirements`);
}

assert.match(source, /build_chat_prompt\(messages: list\[dict\[str, str\]\], context: Any = None\)/);
assert.ok(source.includes('rendered.append("\\n".join(grounding_requirements_lines()))'));
assert.match(source, /f"\{GROUNDING_SYSTEM_INSTRUCTION\}"/);

console.log("PASS AG2 prompt grounding tests");
