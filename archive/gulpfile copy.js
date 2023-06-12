const gulp = require("gulp");
const dom = require("gulp-dom");
const beautify = require("gulp-jsbeautifier");
const path = require('path');
const through2 = require('through2');
const { JSDOM } = require('jsdom');

const filesWithInvalidIframes = new Set();

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
          filesWithInvalidIframes.add(path.basename(file.path));
        }

        file.contents = Buffer.from(dom.serialize());
      }
      cb(null, file);
    })
  )
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
        console.log("These pages have an iframe outside of a media container:");
        for (const file of filesWithInvalidIframes) {
          console.log(file);
        }
      }
    });
});