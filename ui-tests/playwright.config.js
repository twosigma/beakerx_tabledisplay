// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

const baseConfig = require("@jupyterlab/galata/lib/playwright-config");

module.exports = {
  ...baseConfig,
  use: {},
  webServer: {
    command: "jlpm start",
    url: "http://localhost:8888/lab",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "benchmark",
      testMatch: "tests/benchmark/**",
    },
  ],
  reporter: [
    [process.env.CI ? "dot" : "list"],
    ["@jupyterlab/galata/lib/benchmarkReporter", { outputFile: "bearkerx-benchmark.json" }],
  ],
  use: {
    ...baseConfig.use,
    video: "off",
    baseURL: process.env.TARGET_URL ?? "http://127.0.0.1:8888",
  },
  preserveOutput: "failures-only",
  workers: 1,
};
