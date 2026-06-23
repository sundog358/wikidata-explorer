import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aiAgentsEnabled } from "../lib/ai-feature-flags.mjs";

const source = readFileSync(new URL("../components/nav/main-nav.tsx", import.meta.url), "utf8");

assert.equal(aiAgentsEnabled({}), false, "AI nav should be disabled by default for public deployment.");
assert.equal(aiAgentsEnabled({ NEXT_PUBLIC_ENABLE_AI_AGENTS: "true" }), true, "AI nav should be enabled by explicit public flag.");
assert(source.includes('import { aiAgentsEnabled } from "@/lib/ai-feature-flags.mjs"'), "Main nav must use the shared AI feature flag helper.");
assert(source.includes("const coreNavItems"), "Main nav should keep core public links separate from AI links.");
assert(source.includes("const aiNavItems"), "Main nav should isolate AI links for feature-flagging.");
assert(source.includes("...(AI_AGENTS_ENABLED ? aiNavItems : [])"), "Main nav should only include AI links when the feature flag is enabled.");
assert(source.includes('href: "/agents"'), "Main nav AI set should include the Agents route.");
assert(source.includes('href: "/chat"'), "Main nav AI set should include the Research Assistant route.");
assert(source.includes('data-primary-nav={item.href === "/agents" ? "agents" : undefined}'), "Agents should have a stable top-level navigation marker when enabled.");
assert(source.includes('persistentLabel: true'), "Agents should keep a persistent visible label when enabled.");

console.log("PASS main nav feature-flags AI links");
