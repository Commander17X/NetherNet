const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: ["relay/**", "dist/**", "node_modules/**", ".expo/**", "coverage/**"],
  },
  expoConfig,
]);
