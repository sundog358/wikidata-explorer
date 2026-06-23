import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../components/nav/main-nav.tsx", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const agentsIndex = source.indexOf('name: "Agents"');
const researchIndex = source.indexOf('name: "Research Assistant"');

assert(source.includes('href: "/agents"'), "Main nav must include the Agents route.");
assert(agentsIndex !== -1, "Main nav must label the Agents route as Agents.");
assert(researchIndex !== -1, "Main nav should still include Research Assistant.");
assert(agentsIndex < researchIndex, "Agents should be promoted before Research Assistant in top nav.");
assert(source.includes("persistentLabel: true"), "Agents should keep a persistent visible label at small widths.");
assert(source.includes('data-primary-nav={item.href === "/agents" ? "agents" : undefined}'), "Agents should have a stable top-level navigation marker.");
assert(source.includes('shrink-0'), "Primary nav links should not collapse away in the header.");
assert(source.includes('border border-sky-200 bg-sky-50 text-sky-800'), "Agents should render as a visibly promoted top-level nav item.");
assert(source.includes('aria-label="Primary"'), "Main nav should expose a primary navigation landmark.");

console.log("PASS main nav includes a persistent top-level Agents link");
