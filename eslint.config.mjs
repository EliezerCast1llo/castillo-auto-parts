import coreVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
