const gulp = require("gulp"),
  dom = require("gulp-dom"),
  beautify = require("gulp-jsbeautifier"),
  path = require("path"),
  through2 = require("through2"),
  { JSDOM } = require("jsdom");

let fileErrors = {};

const filesWithMissingHeaderOrContentWrapperMsg = "Missing <header> with class 'header' or <div> with id 'content-wrapper'";
const filesWithInvalidIframesMsg = "Invalid iframes detected (not contained within a <div> with class 'media-object')";
const invalidYtPanoptoTitleMsg = "Invalid iframes detected (Incorrect title attribute)";

gulp.task("default", async () => {
  console.log(`
  Hello, human.
  I am Ebee version 1.00
  an automation tool developed to format your code 
  and prepare it for upload into the PimaOnline template system.

  To clean your code run the command "npm run clean".
`);
});

gulp.task("info", async () => {
  console.log(`
  npm run start - Displays latest news and info.    
  npm run clean - Runs the command to clean your code.
`);
});

gulp.task("clean", () =>
  gulp
    .src("_input/**/*.html")
    .pipe(
      through2.obj(function (file, enc, cb) {
        if (file.isBuffer()) {
          let content = file.contents.toString();
          let dom = new JSDOM(content, { includeNodeLocations: true });
          let document = dom.window.document;

          if (!document.doctype || "html" !== document.doctype.name.toLowerCase()) {
            if (!fileErrors[file.path]) {
              fileErrors[file.path] = [];
            }
            fileErrors[file.path].push("Missing DOCTYPE or DOCTYPE is not html");
          }

          let html = document.querySelector("html");
          if (!html || "en" !== html.getAttribute("lang")) {
            if (!fileErrors[file.path]) {
              fileErrors[file.path] = [];
            }
            fileErrors[file.path].push("Missing html lang attribute or lang is not 'en'");
          }

          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )
    .pipe(
      through2.obj(function (file, enc, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;
      
          let headerElement = doc.querySelector("header.header");
          let divElement = doc.querySelector("div#content-wrapper");
      
          if (!headerElement || !divElement) {
            if (!fileErrors[file.path]) {
              fileErrors[file.path] = [];
            }
            fileErrors[file.path].push(filesWithMissingHeaderOrContentWrapperMsg);
          }
      
          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )
    // Log if youtube or panopto iframes exist outside of media container
    .pipe(
      through2.obj(function (file, enc, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;
      
          let iframes = doc.querySelectorAll("iframe");
          let invalidIframes = Array.from(iframes).filter((iframe) => {
            let src = iframe.getAttribute("src");
            if (src && (src.includes("https://www.youtube.com") || src.includes("https://pima-cc.hosted.panopto.com"))) {
              let parent = iframe.parentElement;
              while (parent != null) {
                if (parent.tagName.toLowerCase() === "div" && parent.getAttribute("class") === "media-object") {
                  return false;
                }
                parent = parent.parentElement;
              }
              return true;
            }
            return false;
          });
    
          if (invalidIframes.length > 0) {
            if (!fileErrors[file.path]) {
              fileErrors[file.path] = [];
            }
            fileErrors[file.path].push(filesWithInvalidIframesMsg);
          }
      
          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )
    //
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;
    
          // Check if the document contains an <iframe> with title "YouTube video player"
          let iframeElement = Array.from(doc.querySelectorAll("iframe")).find(iframe => iframe.title.includes("YouTube video player"));
    
          // If such an iframe is present, add the file path to the fileErrors object with appropriate message
          if (iframeElement) {
            if (!fileErrors[file.path]) {
              fileErrors[file.path] = [];
            }
            fileErrors[file.path].push(invalidYtPanoptoTitleMsg);
          }
    
          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )
    

    // .pipe(
    //   dom(function () {
    //     // ... Rest of your code ...
    //   })
    // )
    .on("end", () => {
      for (let filePath in fileErrors) {
        console.log(`Errors in file ${filePath}:`);
        for (let error of fileErrors[filePath]) {
          console.log(` > ${error}`);
        }
      }
    })
);
