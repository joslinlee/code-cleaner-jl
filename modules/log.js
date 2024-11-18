import gulp from 'gulp';
import { JSDOM as jsdom } from 'jsdom';
import through2 from 'through2';
import path from 'path';
import { checkContentBody } from "./log/checkContentBody.js"
import { checkContentWrapper } from "./log/checkContentWrapper.js"
import { checkDeprecatedClasses } from "./log/checkDeprecatedClasses.js"
import { checkDoctype } from "./log/checkDoctype.js"
import { checkHeader } from "./log/checkHeader.js"
import { checkHtmlLang } from "./log/checkHtmlLang.js"
import { checkIframes } from "./log/checkIframes.js"
import { checkImgAlt } from "./log/checkImgAlt.js"
import { checkTables } from "./log/checkTables.js"
import { checkTitleAndH1 } from "./log/checkTitleAndH1.js"
import { checkIframeTitles } from './log/checkIframeTitles.js';
import { checkPanoptoWrapper } from './log/checkPanoptoContainer.js';
import { checkHeadings } from './log/checkHeadings.js';
import { checkScriptTagsLocation } from './log/checkJsScripts.js';
import { checkJquery } from './log/checkJquery.js';

export function log() {
  let errors = {};

  gulp.task('log', () => 
    gulp.src('_input/**/*.{html,htm}')
      .pipe(through2.obj(function(file, enc, callback) {
        if (file.isBuffer()) {
          let content = file.contents.toString();
          let dom = new jsdom(content, { includeNodeLocations: true });
          let document = dom.window.document;

          checkDoctype(document, file.path, errors);
          checkHtmlLang(document, file.path, errors);
					checkHeadings(document, file.path, errors);
          checkHeader(document, file.path, errors);
          checkContentWrapper(document, file.path, errors);
          checkIframes(document, file.path, errors);
					checkPanoptoWrapper(document, file.path, errors);
					checkScriptTagsLocation(document, file.path, errors);
          checkIframeTitles(document, file.path, errors);
          checkContentBody(document, file.path, errors);
          checkDeprecatedClasses(document, file.path, errors);
          checkTables(document, file.path, errors);
          checkTitleAndH1(document, file.path, errors);
          checkImgAlt(document, file.path, errors);
					checkJquery(document, file.path, errors);

          file.contents = Buffer.from(dom.serialize());
        }
        callback(null, file);
      }))
      .pipe(through2.obj(function(file, enc, callback) {
        callback(null, file);
      }))
      .on('finish', () => {
        let hasErrors = false;
      
        for (let e in errors) {
          if (errors[e].length > 0) {
            let r = path.relative('_input', e);
            console.log(`Errors in file "${r}":`);
            for (let n of errors[e]) {
              console.log(` > ${n}`);
            }
            console.log('--------------------------------------------------');
            hasErrors = true;
          }
        }
      
        if (!hasErrors) {
          console.log("No errors found.");
        }
      })            
  );
}
