import gulp from 'gulp';
import { JSDOM as jsdom } from 'jsdom';
import { decode } from "whatwg-encoding";
import through2 from 'through2';
import fs from 'fs';
import path from 'path';
// Import the single function that runs all checks
import { runAllChecks } from './log/runChecks.js';

const logTitleMessage = "Log Report for Course Review";

export function log() {
  const reportsLog = [];
  reportsLog.push(logTitleMessage);
  reportsLog.push(`${new Date().toLocaleString()}`);
  reportsLog.push('--------------------------------------------------');
  let filesWithErrors = 0;

  gulp.task('log', () => {
    return gulp
      .src('_input/**/*.{html,htm}')
      .pipe(through2.obj(function (file, enc, callback) {
        if (file.isBuffer()) {
          // Decode the buffer to a string. whatwg-encoding will strip the BOM
          // and use it to detect encoding, falling back to utf-8.
          const content = decode(file.contents, "UTF-8");
          const dom = new jsdom(content, { includeNodeLocations: true });
          const document = dom.window.document;

          const errorsForFile = [];
          const tempErrorsContainer = { [file.path]: errorsForFile };

          runAllChecks({
            document,
            filePath: file.path,
            errors: tempErrorsContainer,
            html: content,
          });

          if (errorsForFile.length > 0) {
            filesWithErrors++;
            const r = path.relative('_input', file.path);
            const fileErrors = [`${filesWithErrors}. Errors in file "${r}":`];
            console.log(`${filesWithErrors}. Errors in file "${r}":`);

            for (const errorObj of errorsForFile) {
              let message;
              if (typeof errorObj === 'string') {
                message = errorObj;
              } else if (errorObj && typeof errorObj.line === 'number') {
                message = `${errorObj.message} (line ${errorObj.line})`;
              } else if (errorObj && errorObj.node) {
                const location = dom.nodeLocation(errorObj.node);
                if (!location) {
                  // For debugging: log when a node is passed but has no location info.
                  console.log(`[DEBUG] log.js: Node for error "${errorObj.message}" has no location. Node outerHTML:`, errorObj.node.outerHTML);
                }
                message = location
                  ? `${errorObj.message} (line ${location.startLine})`
                  : errorObj.message;
              } else {
                message = (errorObj && errorObj.message) || 'Unknown error structure';
              }
              console.log(` > ${message}`);
              fileErrors.push(` > ${message}`);
            }

            console.log('--------------------------------------------------');
            reportsLog.push(fileErrors.join('\n'));
          }
        }

        callback(null, file);
      }))
      .on('finish', () => {
        if (filesWithErrors === 0) {
          const noErrorsMessage = `--------------------------------------------------
No errors found.
--------------------------------------------------`;
          reportsLog.push(noErrorsMessage);
          console.log(noErrorsMessage);
        }

        // Write to a .txt file (or .json if you'd rather serialize it)
        const reportsPath = "./_reports/log-output.txt";

        fs.mkdirSync("_reports", { recursive: true });
        fs.writeFileSync(reportsPath, reportsLog.join('\n\n'), 'utf8');
        console.log(`Log written to: ${reportsPath}`);
      });
  });
}