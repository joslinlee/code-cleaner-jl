import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM as jsdom } from "jsdom";
import { decode } from "whatwg-encoding";

// Import the single function that runs all checks
import { runAllChecks } from "./log/runChecks.js";

const LOG_TITLE = "Log Report for Course Review";

/**
 * Scans all HTML/HTM files under inputDir, running the same checks as your gulp task,
 * but returns a structured JSON report + a text version for writing to _reports.
 */
export async function runWebScan(scanPath) {
  const stats = await fs.stat(scanPath);
  let filesToScan = [];

  // Determine if we're scanning a directory or a single file.
  if (stats.isDirectory()) {
    filesToScan = await listHtmlFiles(scanPath);
  } else if (stats.isFile()) {
    // If it's a file, only scan it if it's an HTML file.
    if (/\.(html?|htm)$/i.test(scanPath)) {
      filesToScan.push(scanPath);
    }
  }

  const byFile = {}; // relPath -> [{ message }]
  const reportLines = [LOG_TITLE, new Date().toLocaleString(), "--------------------------------------------------"];
  let filesWithIssuesCount = 0;
  let totalIssueCount = 0;
  
  // The root directory for calculating relative paths for the report.
  const rootDirForRelativePaths = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '_input');

  for (const absPath of filesToScan) {
    const relPath = path.relative(rootDirForRelativePaths, absPath).replace(/\\/g, "/");

    // Read file as a buffer to handle encoding detection and BOM stripping.
    const buffer = await fs.readFile(absPath);
    // Decode the buffer to a string. whatwg-encoding will strip the BOM
    // and use it to detect encoding, falling back to utf-8.
    const html = decode(buffer, "UTF-8");
    const dom = new jsdom(html, {
      contentType: "text/html",
      includeNodeLocations: true
    });
    const document = dom.window.document;

    // The check functions will push error objects into this array.
    const errorsForFile = [];
    const tempErrorsContainer = { [absPath]: errorsForFile };

    runAllChecks({
      document,
      filePath: absPath,
      errors: tempErrorsContainer,
      html,
    });

    if (errorsForFile.length > 0) {
      filesWithIssuesCount++;
      reportLines.push(`${filesWithIssuesCount}. Errors in file "${relPath}":`);
      
      const processedErrors = [];
      for (const errorObj of errorsForFile) {
        let message;
        let line = null;

        if (typeof errorObj === 'string') {
          message = errorObj;
        } else if (errorObj && typeof errorObj.line === 'number') {
          message = errorObj.message;
          line = errorObj.line;
        } else if (errorObj && errorObj.node) {
          message = errorObj.message;
          const location = dom.nodeLocation(errorObj.node);
          if (location) {
            line = location.startLine;
          } else {
            console.log(`[DEBUG] scanRunner: Node for error "${errorObj.message}" has no location. Node outerHTML:`, errorObj.node.outerHTML);
          }
        } else {
          message = (errorObj && errorObj.message) || 'Unknown error structure';
        }

        reportLines.push(line ? ` > ${message} (line ${line})` : ` > ${message}`);
        totalIssueCount++;
        processedErrors.push({ message, line }); // Pass structured data to UI
      }

      byFile[relPath] = processedErrors;
      reportLines.push("--------------------------------------------------");
    }
  }

  if (totalIssueCount === 0) {
    reportLines.push("--------------------------------------------------");
    reportLines.push("No errors found.");
    reportLines.push("--------------------------------------------------");
  }

  return {
    summary: {
      filesScanned: filesToScan.length,
      filesWithIssues: filesWithIssuesCount,
      issues: totalIssueCount,
    },
    byFile,                 // UI will render this
    reportText: reportLines.join("\n"), // optional: still write to _reports
  };
}

/**
 * Recursively finds all HTML files in a given directory.
 * @param {string} root The absolute path to the directory to start walking.
 * @returns {Promise<string[]>} A promise that resolves to an array of absolute file paths.
 */
async function listHtmlFiles(root) {
  const acc = [];
  async function walk(dir) {
    const ents = await fs.readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (/\.(html?|htm)$/i.test(e.name)) {
        acc.push(full);
      }
    }
  }
  await walk(root);
  return acc;
}

/**
 * Recursively counts all files in a directory.
 * @param {string} dir The directory to start in.
 * @returns {Promise<number>} The total number of files.
 */
export async function countAllFiles(dir) {
    let fileCount = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            fileCount += await countAllFiles(fullPath);
        } else {
            fileCount++;
        }
    }
    return fileCount;
}
