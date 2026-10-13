import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "app/generated/**", // Prisma's generated client
      "service/**", // the Python ingest service
      "public/ort/**", // onnxruntime's build, copied from node_modules
      ".impeccable/**", // design prototypes and review captures (gitignored)
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
