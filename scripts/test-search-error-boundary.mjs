import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const searchPage = readFileSync(new URL("../app/search/page.tsx", import.meta.url), "utf8");
const errorBoundary = readFileSync(new URL("../components/ErrorBoundary.tsx", import.meta.url), "utf8");

assert.match(searchPage, /import \{ ErrorBoundary \} from "@\/components\/ErrorBoundary"/);
assert.match(searchPage, /function SearchWorkbench\(\)/);
assert.match(searchPage, /export default function SearchPage\(\)/);
assert.match(searchPage, /<ErrorBoundary/);
assert.match(searchPage, /data-testid="search-error-boundary"/);
assert.match(searchPage, /event: "client_error_boundary"/);
assert.match(searchPage, /message: "Search workbench render failed\."/);
assert.doesNotMatch(searchPage, /console\.warn\([^)]*searchTerm/);
assert.doesNotMatch(searchPage, /console\.warn\([^)]*selectedItem/);

assert.match(errorBoundary, /"use client"/);
assert.match(errorBoundary, /fallback\?:/);
assert.match(errorBoundary, /onError\?:/);
assert.match(errorBoundary, /componentDidCatch/);
assert.match(errorBoundary, /data-testid="error-boundary-fallback"/);

console.log("PASS search error boundary tests");
