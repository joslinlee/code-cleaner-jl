const gulp = require("gulp");
const dom = require("gulp-dom");
const beautify = require("gulp-jsbeautifier");
const path = require('path');
const through2 = require('through2');
const { JSDOM } = require('jsdom');

const invalidIframesMsg = "Pages contain invalid iframes:"
const invalidContentBodiesMsg = "Pages contain invalid content-body:"
const hasDeprecatedWidgetsMsg = "Pages contain deprecated widgets:"

const filesWithInvalidIframes = new Set();
const filesWithInvalidContentBody = new Set();
const filesWithDeprecatedWidgets = new Set();
const deprecatedClasses = ["video-container"]; 

// Say Hi
gulp.task("default", async () => {
  return console.log(`

      Hello, human.
      I am Ebee version 1.00
      an automation tool developed to format your code 
      and prepare it for upload into the PimaOnline template system.

      To clean your code run the command "npm run clean".
    
  
    `);
});

gulp.task("info", async () => {
  return console.log(`

    npm run start - Displays latest news and info.    
    npm run clean - Runs the command to clean your code.
  
    `);
});

gulp.task("clean", async () => {
  return gulp.src("_input/**/*.html")
  // Log if iframes exist outside of media container
  .pipe(
    through2.obj(function (file, _, cb) {
      if (file.isBuffer()) {
        let html = file.contents.toString();
        let dom = new JSDOM(html);
        let doc = dom.window.document;

        let iframes = doc.querySelectorAll("iframe");
        let invalidIframes = Array.from(iframes).filter((iframe) => {
          let parent = iframe.parentElement;
          while (parent != null) {
            if (parent.tagName.toLowerCase() === "div" && parent.getAttribute("class") === "media-object") {
              return false;
            }
            parent = parent.parentElement;
          }
          return true;
        });

        if (invalidIframes.length > 0) {
          filesWithInvalidIframes.add(` > ${file.path}`);
        }

        file.contents = Buffer.from(dom.serialize());
      }
      cb(null, file);
    })
  )
  // Check for .content-body
  .pipe(
    through2.obj(function (file, _, cb) {
      if (file.isBuffer()) {
        let html = file.contents.toString();
        let dom = new JSDOM(html);
        let doc = dom.window.document;

        let contentBodies = doc.querySelectorAll(".content-body");
        let invalidContentBodies = Array.from(contentBodies).filter((contentBody) => {
          let parent = contentBody.parentElement;
          while (parent != null) {
            if (parent.tagName.toLowerCase() === "div") {
              let parentID = parent.getAttribute("id");  // Get the id attribute instead of class
              if (parentID === "content-wrapper" || parentID === "second-column" || parentID === "third-column") {
                return false;
              }
            }
            parent = parent.parentElement;
          }
          return true;
        });

        if (invalidContentBodies.length > 0) {
          filesWithInvalidContentBody.add(` > ${file.path}`);
        }

        file.contents = Buffer.from(dom.serialize());
      }
      cb(null, file);
    })
  ) 
  // check for page errors
  // check for deprecated widgets
  .pipe(
    through2.obj(function (file, _, cb) {
      if (file.isBuffer()) {
        let html = file.contents.toString();
        let dom = new JSDOM(html);
        let doc = dom.window.document;
        
        let hasDeprecatedWidgets = deprecatedClasses.some(deprecatedClass => {
          let elements = doc.getElementsByClassName(deprecatedClass);
          return elements.length > 0;
        });

        if (hasDeprecatedWidgets) {
          filesWithDeprecatedWidgets.add(` > ${file.path}`);
        }

        file.contents = Buffer.from(dom.serialize());
      }
      cb(null, file);
    })
  )  
  // check tables

  // Match title with h1

  // remove elements with "&nbsp" as inner-text
  .pipe(dom(function () {
    const par = this.querySelectorAll("p")
    return par.forEach((e) => {
      if(e.textContent == "\xa0") e.remove()
    })
  }))
  // remove empty elements
  .pipe(dom(function () {
    const par = this.querySelectorAll("div, span, h1, h2, h3, h4, h5, h6, p, strong, em")
    return par.forEach((e) => {
      if(e.textContent == "") e.remove()
    })
  }))
  .pipe(dom(function() {
    const discardTextAttributes = (textElement, ...attributes) => attributes.forEach((attribute) => textElement.removeAttribute(attribute));
    return this.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, li, dl, dt, dd").forEach((elem) => discardTextAttributes(elem, "width", "style"));
  }))
  .pipe(dom(function() {
    const discardElemAttributes = (element, ...attributes) => attributes.forEach((attribute) => element.removeAttribute(attribute));
    return this.querySelectorAll("body, div, span, bold, em").forEach((elem) => discardElemAttributes(elem, "style"));
  }))
  .pipe(dom(function() {
    const discardTableAttributes = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return this.querySelectorAll("table, thead, tbody, tfoot, tr, th, td").forEach((tableElem) => discardTableAttributes(tableElem, "cellspacing", "cellpadding", "width", "style"));
  }))
  .pipe(dom(function() {
      const discardTargetSelf = (element, ...attributes) => attributes.forEach((attribute) => element.removeAttribute(attribute));
      return this.querySelectorAll('[target="_self"], [target="_new"]').forEach((tableElem) => discardTargetSelf(tableElem, "target"));
    }))
    .pipe(dom(function() {
      const discardRolePres = (element, ...attributes) => attributes.forEach((attribute) => element.removeAttribute(attribute));
      return this.querySelectorAll('[role="presentation"]').forEach((tableElem) => discardRolePres(tableElem, "role"));
    }))
    .pipe(beautify({ 
      indent_size: 2, 
      wrap_attributes: false,
      extra_liners: [] 
    }))
    .pipe(beautify.reporter())
    .pipe(gulp.dest("_output"))
    //== Log messages
    .on('end', () => {
      if (filesWithInvalidIframes.size > 0) {
        console.log(`1. ${invalidIframesMsg}`);
        for (const file of filesWithInvalidIframes) {
          console.log(file);
        }
      }
      if (filesWithInvalidContentBody.size > 0) {
        console.log(`2. ${invalidContentBodiesMsg}`);
        for (const file of filesWithInvalidContentBody) {
          console.log(file);
        }
      }
      if (filesWithDeprecatedWidgets.size > 0) {
        console.log(`3. ${hasDeprecatedWidgetsMsg}`);
        for (const file of filesWithDeprecatedWidgets) {
          console.log(file);
        }
      }
    });
});