const path = require("node:path");

/** @type {import('jest').Config} */
module.exports = {
  rootDir: path.join(__dirname, ".."),
  testEnvironment: "node",
  testMatch: ["<rootDir>/relay/test/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "babel-jest",
      {
        configFile: false,
        babelrc: false,
        presets: [["@babel/preset-typescript", { allowDeclareFields: true }]],
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      },
    ],
  },
};
