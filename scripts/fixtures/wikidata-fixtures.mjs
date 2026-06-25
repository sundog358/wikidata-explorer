const fixtureEntities = {
  Q42: {
    id: "Q42",
    type: "item",
    labels: { en: "Douglas Adams", fr: "Douglas Adams" },
    descriptions: { en: "British science fiction writer and humorist (1952-2001)" },
    aliases: { en: ["Douglas Noel Adams", "DNA"] },
    sitelinks: {
      enwiki: {
        title: "Douglas Adams",
        badges: [],
        url: "https://en.wikipedia.org/wiki/Douglas_Adams",
      },
    },
    statements: {
      P31: [
        {
          id: "Q42$fixture-P31-Q5",
          rank: "normal",
          propertyId: "P31",
          explorable: true,
          property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q5", label: "human" } },
          qualifiers: [],
          references: [
            {
              hash: "fixture-reference-q42-p31",
              parts: [
                {
                  property: { id: "P248", label: "stated in", data_type: "wikibase-item" },
                  value: { type: "wikibase-entityid", content: { id: "Q5375741", label: "Encyclopaedia Britannica Online" } },
                },
                {
                  property: { id: "P813", label: "retrieved", data_type: "time" },
                  value: { type: "time", content: { time: "+2024-01-01T00:00:00Z", precision: 11 } },
                },
              ],
            },
          ],
        },
      ],
      P106: [
        {
          id: "Q42$fixture-P106-Q36180",
          rank: "normal",
          propertyId: "P106",
          explorable: true,
          property: { id: "P106", label: "occupation", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q36180", label: "writer" } },
          qualifiers: [],
          references: [],
        },
      ],
      P569: [
        {
          id: "Q42$fixture-P569",
          rank: "normal",
          propertyId: "P569",
          explorable: true,
          property: { id: "P569", label: "date of birth", data_type: "time" },
          value: { type: "time", content: { time: "+1952-03-11T00:00:00Z", precision: 11 } },
          qualifiers: [
            {
              property: { id: "P1480", label: "sourcing circumstances", data_type: "wikibase-item" },
              value: { type: "wikibase-entityid", content: { id: "Q5727902", label: "approximately" } },
            },
          ],
          references: [],
        },
      ],
      P800: [
        {
          id: "Q42$fixture-P800-Q25169",
          rank: "normal",
          propertyId: "P800",
          explorable: true,
          property: { id: "P800", label: "notable work", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q25169", label: "The Hitchhiker's Guide to the Galaxy" } },
          qualifiers: [],
          references: [
            {
              hash: "fixture-reference-q42-p800",
              parts: [
                {
                  property: { id: "P854", label: "reference URL", data_type: "url", formatter_url: null },
                  value: { type: "url", content: { value: "https://www.wikidata.org/wiki/Q25169" } },
                },
              ],
            },
          ],
        },
      ],
      P18: [
        {
          id: "Q42$fixture-P18",
          rank: "normal",
          propertyId: "P18",
          explorable: true,
          property: { id: "P18", label: "image", data_type: "commonsMedia" },
          value: { type: "commonsMedia", content: { value: "Douglas adams portrait cropped.jpg" } },
          qualifiers: [],
          references: [],
        },
      ],
    },
  },
  Q25169: {
    id: "Q25169",
    type: "item",
    labels: { en: "The Hitchhiker's Guide to the Galaxy", fr: "Le Guide du voyageur galactique" },
    descriptions: { en: "science fiction comedy series created by Douglas Adams" },
    aliases: { en: ["Hitchhiker's Guide", "HHGTTG"] },
    sitelinks: {
      enwiki: {
        title: "The Hitchhiker's Guide to the Galaxy",
        badges: [],
        url: "https://en.wikipedia.org/wiki/The_Hitchhiker%27s_Guide_to_the_Galaxy",
      },
    },
    statements: {
      P31: [
        {
          id: "Q25169$fixture-P31-Q7725634",
          rank: "normal",
          propertyId: "P31",
          explorable: true,
          property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q7725634", label: "literary work" } },
          qualifiers: [],
          references: [],
        },
      ],
      P50: [
        {
          id: "Q25169$fixture-P50-Q42",
          rank: "normal",
          propertyId: "P50",
          explorable: true,
          property: { id: "P50", label: "author", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q42", label: "Douglas Adams" } },
          qualifiers: [],
          references: [
            {
              hash: "fixture-reference-q25169-p50",
              parts: [
                {
                  property: { id: "P854", label: "reference URL", data_type: "url", formatter_url: null },
                  value: { type: "url", content: { value: "https://www.wikidata.org/wiki/Q42" } },
                },
              ],
            },
          ],
        },
      ],
      P577: [
        {
          id: "Q25169$fixture-P577",
          rank: "normal",
          propertyId: "P577",
          explorable: true,
          property: { id: "P577", label: "publication date", data_type: "time" },
          value: { type: "time", content: { time: "+1979-10-12T00:00:00Z", precision: 11 } },
          qualifiers: [],
          references: [],
        },
      ],
    },
  },
  Q80: {
    id: "Q80",
    type: "item",
    labels: { en: "Tim Berners-Lee" },
    descriptions: { en: "English computer scientist (born 1955)" },
    aliases: { en: ["Sir Tim Berners-Lee"] },
    sitelinks: {
      enwiki: {
        title: "Tim Berners-Lee",
        badges: [],
        url: "https://en.wikipedia.org/wiki/Tim_Berners-Lee",
      },
    },
    statements: {
      P31: [
        {
          id: "Q80$fixture-P31-Q5",
          rank: "normal",
          propertyId: "P31",
          explorable: true,
          property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q5", label: "human" } },
          qualifiers: [],
          references: [
            {
              hash: "fixture-reference-q80-p31",
              parts: [
                {
                  property: { id: "P248", label: "stated in", data_type: "wikibase-item" },
                  value: { type: "wikibase-entityid", content: { id: "Q5375741", label: "Encyclopaedia Britannica Online" } },
                },
              ],
            },
          ],
        },
      ],
      P106: [
        {
          id: "Q80$fixture-P106-Q82594",
          rank: "preferred",
          propertyId: "P106",
          explorable: true,
          property: { id: "P106", label: "occupation", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q82594", label: "computer scientist" } },
          qualifiers: [],
          references: [],
        },
      ],
      P27: [
        {
          id: "Q80$fixture-P27-Q145",
          rank: "normal",
          propertyId: "P27",
          explorable: true,
          property: { id: "P27", label: "country of citizenship", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q145", label: "United Kingdom" } },
          qualifiers: [],
          references: [],
        },
      ],
    },
  },
  P31: {
    id: "P31",
    type: "property",
    labels: { en: "instance of" },
    descriptions: { en: "that class of which this subject is a particular example and member" },
    aliases: { en: ["is a", "is an"] },
    sitelinks: {},
    statements: {
      P31: [
        {
          id: "P31$fixture-P31-Q18616576",
          rank: "normal",
          propertyId: "P31",
          explorable: true,
          property: { id: "P31", label: "instance of", data_type: "wikibase-item" },
          value: { type: "wikibase-entityid", content: { id: "Q18616576", label: "Wikidata property for items about classes" } },
          qualifiers: [],
          references: [],
        },
      ],
    },
  },
};

const fixtureSearchIndex = [
  { term: "douglas", ids: ["Q42"] },
  { term: "adams", ids: ["Q42"] },
  { term: "tim", ids: ["Q80"] },
  { term: "berners", ids: ["Q80"] },
  { term: "hitchhiker", ids: ["Q25169"] },
  { term: "galaxy", ids: ["Q25169"] },
  { term: "instance", ids: ["P31"] },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function searchResultFromEntity(entity) {
  return {
    id: entity.id,
    type: entity.type,
    labels: { en: entity.labels.en || entity.id },
    descriptions: { en: entity.descriptions.en || "" },
    aliases: { en: entity.aliases.en || [] },
    statements: {},
    sitelinks: {},
  };
}

export function fixtureSearchWikidata(searchTerm) {
  const normalizedTerm = String(searchTerm || "").trim().toLowerCase();
  if (/^[PQ]\d+$/.test(normalizedTerm.toUpperCase()) && fixtureEntities[normalizedTerm.toUpperCase()]) {
    return [searchResultFromEntity(fixtureEntities[normalizedTerm.toUpperCase()])];
  }

  const ids = new Set();
  for (const entry of fixtureSearchIndex) {
    if (normalizedTerm.includes(entry.term)) {
      for (const id of entry.ids) ids.add(id);
    }
  }

  return Array.from(ids).map((id) => searchResultFromEntity(fixtureEntities[id]));
}

export function fixtureDetailedEntity(id) {
  const entity = fixtureEntities[String(id || "").trim().toUpperCase()];
  if (!entity) throw new Error(`No fixture Wikidata entity found for ${id}`);
  return clone(entity);
}

export function fixtureEntityIds() {
  return Object.keys(fixtureEntities);
}

export { fixtureEntities };
