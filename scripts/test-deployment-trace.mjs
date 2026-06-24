import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const apiTracePaths = [
  ["ag2-workflow", new URL("../.next/server/app/api/ag2-workflow/route.js.nft.json", import.meta.url)],
  ["chat", new URL("../.next/server/app/api/chat/route.js.nft.json", import.meta.url)],
  ["entity-summary", new URL("../.next/server/app/api/entity-summary/route.js.nft.json", import.meta.url)],
];

async function readTrace(tracePath) {
  const trace = JSON.parse(await readFile(tracePath, "utf8"));
  return trace.files || [];
}

const includes = (files, pattern) => files.some((file) => file.includes(pattern));
const includesAny = (files, patterns) => patterns.some((pattern) => includes(files, pattern));
const normalizeTracePath = (file) => file.replaceAll("\\", "/");
const includesRepoPath = (files, repoPath) =>
  files.some((file) => normalizeTracePath(file).includes(`../../../../../${repoPath}`));

function assertApiTrace(routeName, files) {
  assert.ok(
    includesAny(files, ["lib/ag2.ts", "lib\\ag2.ts"]),
    `${routeName} API route trace should keep the AG2 bridge module.`
  );
  for (const helper of [
    "next/dist/shared/lib/router/utils/app-paths.js",
    "next/dist/shared/lib/page-path/ensure-leading-slash.js",
    "next/dist/shared/lib/segment.js",
    "next/dist/shared/lib/server-reference-info.js",
    "next/dist/server/lib/router-utils/instrumentation-globals.external.js",
    "next/dist/server/lib/router-utils/instrumentation-node-extensions.js",
    "next/dist/lib/client-and-server-references.js",
    "next/dist/lib/constants.js",
    "next/dist/lib/interop-default.js",
    "next/dist/lib/is-error.js",
  ]) {
    assert.ok(
      includesAny(files, [helper, helper.replaceAll("/", "\\")]),
      `${routeName} API route trace should include ${helper}.`
    );
  }
  assert.equal(includes(files, "next.config.js"), false, "next.config.js should not be bundled into API route traces.");
  assert.equal(includes(files, "pywikibot.lwp"), false, "local Pywikibot login cache must not be bundled into API route traces.");
  assert.equal(includes(files, "user-password.py"), false, "local bot password file must not be bundled into API route traces.");
  assert.equal(includesRepoPath(files, "out/"), false, "static export output should not be bundled into API route traces.");
  assert.equal(includesRepoPath(files, "utils/"), false, "legacy utility scripts should not be bundled into API route traces.");
  assert.equal(includesRepoPath(files, "docs/screenshots"), false, "portfolio screenshots should not be bundled into API route traces.");
}

let tracedFileCount = 0;
for (const [routeName, tracePath] of apiTracePaths) {
  const files = await readTrace(tracePath);
  tracedFileCount += files.length;
  assertApiTrace(routeName, files);
}

const previewTrace = await readTrace(new URL("../.next/server/app/opengraph-image/route.js.nft.json", import.meta.url));
assert.ok(
  includesAny(previewTrace, [
    "public/images/jean-francois-millet-gleaners-google-art-project-2.jpg",
    "public\\images\\jean-francois-millet-gleaners-google-art-project-2.jpg",
  ]),
  "social preview image should stay in the Open Graph image route trace."
);

console.log(`PASS deployment trace keeps API bridge and social preview assets while excluding repo clutter (${tracedFileCount} API traced files)`);
