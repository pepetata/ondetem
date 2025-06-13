import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { globals: globals.browser },
    rules: {
      "react/react-in-jsx-scope": "off", // <-- Add this line
    },
    settings: {
      react: {
        version: "detect", // <-- Add this line for React version warning
      },
    },
    ignores: ["node_modules", "dist", ".eslintrc.cjs", "vite.config.js"],
  },
  pluginReact.configs.flat.recommended,
]);
