const gulp = require("gulp");
const dom = require("gulp-dom");
const beautify = require("gulp-jsbeautifier");

// Say Hi
gulp.task("default", async () => {
  return console.log(`

      Hello, human.
      For full list of commands use: npm run info
  
    `);
});

gulp.task("info", async () => {
  return console.log(`

      Clean code: npm run clean
      Log error: npm run error
  
    `);
});

gulp.task("clean", async () => {
  return gulp.src("_input/**/*.html")
  // remove elements with "&nbsp" as inner-text
  .pipe(dom(function () {
    const par = this.querySelectorAll("p")
    return par.forEach((e) => {
      if(e.textContent == "\xa0") e.remove()
    })
  }))
  // remove empty elements
  .pipe(dom(function () {
    const par = this.querySelectorAll("div, span, h1, h2, h3, h4, h5, h6, p, strong")
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
    .pipe(gulp.dest("_output"));
});

//remove empty elements