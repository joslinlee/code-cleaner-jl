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
const nestedContentBodiesMsg = "Invalid '.content-body' (Nested within another .content-body)";
const invalidContentBodyMsg = "A 'content-body' is not inside #content-wrapper, #second-column, or #third-column";
const deprecatedClassOrIdMsg = "Contains deprecated class or id";

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
    // check for doctype and missing <html>
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
    //check for header and content-wrapper
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
    // Log if iframes include "youtube video player"
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
    // Check for .content-body.
    // Log if any are nested within another .content-body
    // Log if any are not inside #content-wrapper, #second-column, or #third-column
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;
    
          let contentBodies = doc.querySelectorAll(".content-body");
          Array.from(contentBodies).forEach((contentBody) => {
            // Check for nested "content-body" divs not only in direct children but in any descendant
            let nestedContentBodies = contentBody.querySelectorAll(".content-body");
            if (nestedContentBodies.length > 0) {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push(nestedContentBodiesMsg);
            }
    
            // Check if content-body is not inside #content-wrapper, #second-column, or #third-column
            let parent = contentBody.parentElement;
            let validParentFound = false;
            while (parent != null) {
              if (parent.tagName.toLowerCase() === "div" && 
                  (parent.getAttribute("id") === "content-wrapper" || 
                   parent.getAttribute("id") === "second-column" || 
                   parent.getAttribute("id") === "third-column")) {
                validParentFound = true;
                break;
              }
              parent = parent.parentElement;
            }
            if (!validParentFound) {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push(invalidContentBodyMsg);
            }
          });
    
          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )

    // Check for deprecated widgets
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;

          // Array of classes and IDs to search for
          let classAndIdsToFind = ["video-container"];
    
          classAndIdsToFind.forEach(item => {
            let classElements = doc.getElementsByClassName(item);
            let idElements = doc.getElementById(item);
    
            if (classElements.length > 0 || idElements) {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push(`${deprecatedClassOrIdMsg} (${item})`);
            }
          });

          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )    
    // Check tables.
    /// Log if <table> does not contain .display-lg
    /// Log if structure does not contain thead > tr > th > remidner: scope=col
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;

          // Check all tables for .display-lg
          let tables = doc.querySelectorAll("table");
          tables.forEach((table) => {
            if (!table.classList.contains('display-lg')) {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push("A table does not contain '.display-lg'");
            }
          });

          // Check for specific table structure
          tables.forEach((table) => {
            let thead = table.querySelector("thead");
            if (thead) {
              let tr = thead.querySelector("tr");
              if (tr) {
                let tds = tr.querySelectorAll("td[scope='col']");
                if (tds.length === 0) {
                  if (!fileErrors[file.path]) {
                    fileErrors[file.path] = [];
                  }
                  fileErrors[file.path].push("A table does not contain the correct structure (missing <td scope='col'> within <thead>)");
                }
              } else {
                if (!fileErrors[file.path]) {
                  fileErrors[file.path] = [];
                }
                fileErrors[file.path].push("A table does not contain the correct structure (missing <tr> within <thead>)");
              }
            } else {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push("A table does not contain the correct structure (missing <thead>)");
            }
          });

          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )
    // Check for matching <title> and <h1>
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;

          // Check if <title> and <h1> match
          let title = doc.querySelector("title");
          let h1 = doc.querySelector("h1");

          // Make sure both elements exist before comparing them
          if (title && h1) {
            let titleText = title.textContent.trim();
            let h1Text = h1.textContent.trim();

            if (titleText !== h1Text) {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push("<title> and <h1> do not match");
            }
          } else {
            if (!fileErrors[file.path]) {
              fileErrors[file.path] = [];
            }
            fileErrors[file.path].push("Missing <title> or <h1> element");
          }

          file.contents = Buffer.from(dom.serialize());
        }
        cb(null, file);
      })
    )
    // Check for images without alt attribute
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isBuffer()) {
          let html = file.contents.toString();
          let dom = new JSDOM(html);
          let doc = dom.window.document;

          // Check all <img> elements for an alt attribute
          let imgElements = doc.querySelectorAll("img");
          Array.from(imgElements).forEach((img) => {
            if (!img.hasAttribute("alt")) {
              if (!fileErrors[file.path]) {
                fileErrors[file.path] = [];
              }
              fileErrors[file.path].push("An <img> element is missing its alt attribute");
            }
          });

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
