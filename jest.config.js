/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.spec.json",
    },
  },
  preset: "ts-jest",
  // preset: "ts-jest/presets/js-with-babel",
  testEnvironment: "jsdom",
  transformIgnorePatterns: ["node_modules/(?!(@tuteria/shared-lib)/)"],
};
