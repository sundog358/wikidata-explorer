import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".claude/**",
      ".codex/**",
      ".next/**",
      ".tmp/**",
      ".vercel/**",
      "data/**",
      "images/**",
      "metagenauto/**",
      "node_modules/**",
      "notebooks/**",
      "out/**",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
];

export default eslintConfig;
