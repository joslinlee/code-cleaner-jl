import gulp from 'gulp';
import { JSDOM as jsdom } from 'jsdom';
import through2 from 'through2';
import fs from 'fs';
import path from 'path';
import { checkContentBody } from "./log/checkContentBody.js"
import { checkHead } from "./log/checkHead.js"
import { checkDeprecated } from "./log/checkDeprecated.js"
import { checkHeader } from "./log/checkHeader.js"
import { checkFirstColumn } from './log/checkFirstColumn.js';
import { checkMedia } from './log/checkMedia.js';
import { checkIframeOnlyPages } from './log/checkIframeOnlyPages.js';
import { checkIframeTitles } from './log/checkMedia/checkIframeTitles.js';
import { checkText } from './log/checkText.js';

const logTitleMessage = "Log Report for Course Review"

export function log() {
  let errors = {};

  gulp.task('log', () => 
    gulp.src('_input/**/*.{html,htm}')
      .pipe(through2.obj(function(file, enc, callback) {
        if (file.isBuffer()) {
          let content = file.contents.toString();
          let dom = new jsdom(content, { includeNodeLocations: true });
          let document = dom.window.document;

          // Check if the page contains only <iframe> elements
          const isIframeOnlyPage = checkIframeOnlyPages(document);

          if (isIframeOnlyPage) {
            // Only run iframe title check
            checkIframeTitles(document, file.path, errors);
          } else {
            // Run all checks
						checkHead(document, file.path, errors);
            checkHeader(document, file.path, errors);
            checkFirstColumn(document, file.path, errors);
            checkContentBody(document, file.path, errors);
            checkDeprecated(document, file.path, errors);
						checkMedia(document, file.path, errors);
						checkText(document, file.path, errors);
          }

          file.contents = Buffer.from(dom.serialize());
        }
        callback(null, file);
      }))
      .pipe(through2.obj(function(file, enc, callback) {
        callback(null, file);
      }))
      .on('finish', () => {
        let hasErrors = false;
        let t = 1;

				const reportsLog = [];
				reportsLog.push(logTitleMessage);
				reportsLog.push(`${new Date().toLocaleString()}`);
				reportsLog.push('--------------------------------------------------');
      
        for (let e in errors) {
          if (errors[e].length > 0) {
            let r = path.relative('_input', e);
            console.log(`${t}. Errors in file "${r}":`);
						let fileErrors = [`${t}. Errors in file "${r}":`];
            for (let n of errors[e]) {
              console.log(` > ${n}`);
							fileErrors.push(` > ${n}`);
            }
            console.log('--------------------------------------------------');
						reportsLog.push(fileErrors.join('\n'));
            t++;
            hasErrors = true;
          }
        }
      
        if (!hasErrors) {
					if (!hasErrors) {
						reportsLog.push(`--------------------------------------------------\nNo errors found.\n--------------------------------------------------`);
					}
          console.log(`--------------------------------------------------
No errors found.
--------------------------------------------------`);
        }

				 // Write to a .txt file (or .json if you'd rather serialize it)
				 const reportsPath = "./_reports/log-output.txt";

				 if (!fs.existsSync("_reports")) {
					fs.mkdirSync("_reports");
				}

				 fs.writeFileSync(reportsPath, reportsLog.join('\n\n'), 'utf8');
				 console.log(`Log written to: ${reportsPath}`);
      })            
  );
}
