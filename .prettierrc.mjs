/** @type {import("prettier").Config} */
export default {
  semi: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "avoid",
  bracketSpacing: true,
  endOfLine: "lf",
  importOrder: [
    "<BUILTIN_MODULES>", // Node.js built-in modules
    "^react$", // React imports
    "^next$", // Next.js imports
    "", // Empty line
    "<THIRD_PARTY_MODULES>", // Imports not matched by other special words or groups.
    "",
    "^@/components(/.*)$", // Components
    "^@/hooks(/.*)$",
    "^@/lib(/.*)$",
    "^@/(.*)$",
    "",
    "^[./]",
    "^(?!.*[.]css$)[./].*$",
    ".css$",
  ],
  tailwindFunctions: ["cn", "cva"],
};
