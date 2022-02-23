// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect, test } from "@playwright/test";
import { benchmark, galata } from "@jupyterlab/galata";
import path from "path";

const tmpPath = "bench-large-table";
const largeTable = "large_table.ipynb";

// Build test parameters list [file, index]
const parameters = [].concat(
  ...[largeTable].map((file) => new Array<number>(benchmark.nSamples).fill(0).map((_, index) => [file, index]))
);

test.describe("Benchmark", () => {
  // Generate the files for the benchmark
  test.beforeAll(async ({ baseURL }) => {
    const content = galata.newContentsHelper(baseURL);
    const codeContent = galata.Notebook.makeNotebook([
      galata.Notebook.makeCell({
        cell_type: "code",
        source: `import beakerx_tabledisplay
import pandas as pd
table = pd.DataFrame({k: range(10) for k in range(1000)})`,
      }),
      galata.Notebook.makeCell({ cell_type: "code", source: "display(table)" }),
    ]);

    await content.uploadContent(JSON.stringify(codeContent), "text", `${tmpPath}/${largeTable}`);
  });

  // Remove benchmark files
  test.afterAll(async ({ baseURL }) => {
    const content = galata.newContentsHelper(baseURL);
    await content.deleteDirectory(tmpPath);
  });

  // Loop on benchmark files nSamples times
  for (const [file, sample] of parameters) {
    test(`measure ${file} - ${sample + 1}`, async ({ baseURL, browserName, page }, testInfo) => {
      const attachmentCommon = {
        nSamples: benchmark.nSamples,
        browser: browserName,
        file: path.basename(file, ".ipynb"),
        project: testInfo.project.name,
      };
      const perf = galata.newPerformanceHelper(page);

      await page.goto(baseURL + "?reset");

      await page.click("#filebrowser >> .jp-BreadCrumbs-home");
      await page.dblclick(`#filebrowser >> text=${tmpPath}`);

      // Open the notebook and wait for the spinner
      await Promise.all([
        page.waitForSelector('[role="main"] >> .jp-SpinnerContent'),
        page.dblclick(`#filebrowser >> text=${file}`),
      ]);

      // Wait for spinner to be hidden
      await page.waitForSelector('[role="main"] >> .jp-SpinnerContent', {
        state: "hidden",
      });

      const executionTime = await perf.measure(async () => {
        await page.click('li[role="menuitem"]:has-text("Run")')
        await page.click('ul[role="menu"] >> text=Run All Cells');

        await page.waitForSelector('.beaker-table-display')
      })

      testInfo.attachments.push(
        benchmark.addAttachment({
          ...attachmentCommon,
          test: "load-table",
          time: executionTime,
        })
      );

      // Check the notebook is correctly opened
      let panel = await page.$('[role="main"] >> .jp-NotebookPanel');
      // Get only the document node to avoid noise from kernel and debugger in the toolbar
      let document = await panel.$(".jp-Notebook");
      expect(await document.screenshot()).toMatchSnapshot(`${file.replace(".", "-")}.png`);

      // Shutdown the kernel to be sure it does not get in our way (especially for the close action)
      await page.click('li[role="menuitem"]:has-text("Kernel")');
      await page.click('ul[role="menu"] >> text=Shut Down All Kernels…');
      await page.click(':nth-match(button:has-text("Shut Down All"), 3)');

      // Close notebook
      await page.click('li[role="menuitem"]:has-text("File")');
      await page.click('ul[role="menu"] >> text=Close Tab');

      // Revert changes so we don't measure saving
      const dimissButton = page.locator('button:has-text("Discard")');
      if (await dimissButton.isVisible({ timeout: 50 })) {
        await dimissButton.click();
      }
    });
  }
});
