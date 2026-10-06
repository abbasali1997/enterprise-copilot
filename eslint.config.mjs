import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",

      // Generated Prisma client
      "**/src/generated/**",
    ],
  },

  js.configs.recommended,

  {
    files: ["**/*.js", "**/*.mjs"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-console": "off",

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": "warn",
    },
  },
];
