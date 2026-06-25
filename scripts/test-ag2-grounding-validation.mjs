import assert from "node:assert/strict";
import {
  AG2_GROUNDING_ERROR_MESSAGE,
  assertAg2Grounding,
  collectAg2GroundingIds,
  validateAg2Grounding,
} from "../lib/ag2-grounding-validation.mjs";

const context = {
  entity: {
    id: "Q42",
    statements: [
      {
        propertyId: "P31",
        value: "human (Q5)",
        references: [{ parts: [{ propertyId: "P248", value: "Integrated Authority File" }] }],
      },
    ],
  },
  graphFocus: {
    id: "Q5",
    propertyId: "P31",
  },
};

assert.deepEqual(collectAg2GroundingIds(context), ["P31", "P248", "Q5", "Q42"]);

const grounded = validateAg2Grounding(
  "Douglas Adams (Q42) has instance-of evidence through P31.\n\nGrounding references\n- Wikidata IDs: Q42, P31\n- statement ID: not supplied\n- source URL: not supplied",
  context,
  { requiredIds: ["Q42"] },
);
assert.equal(grounded.ok, true);
assert.equal(grounded.hasGroundingReferences, true);
assert.deepEqual(grounded.matchedIds, ["P31", "Q42"]);

const missingSection = validateAg2Grounding("Douglas Adams (Q42) has instance-of evidence through P31.", context);
assert.equal(missingSection.ok, false);
assert.match(missingSection.errors.join(" "), /Grounding references/);

const wrongIds = validateAg2Grounding(
  "This cites Q1 only.\n\nGrounding references\n- Wikidata IDs: Q1",
  context,
  { requiredIds: ["Q42"] },
);
assert.equal(wrongIds.ok, false);
assert.match(wrongIds.errors.join(" "), /required ID/);
assert.match(wrongIds.errors.join(" "), /enough Wikidata IDs/);

const noContext = validateAg2Grounding("General answer.\n\nGrounding references\n- statement ID: not supplied", {});
assert.equal(noContext.ok, true);
assert.deepEqual(noContext.expectedIds, []);

assert.throws(
  () => assertAg2Grounding("No grounding here.", context),
  (error) => error.message === AG2_GROUNDING_ERROR_MESSAGE && error.validation?.ok === false,
);

console.log("PASS AG2 grounding validation tests");
