const gulp = require("gulp");
const dom = require("gulp-dom");
const beautify = require("gulp-jsbeautifier");

// Say Hi
gulp.task("default", async () => {
  return console.log(`
      Hello Human.
    `);
});

gulp.task("clean", async () => {
  return gulp.src("_input/**/*.html")
  .pipe(dom(function() {
    const discardTextAttributes = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return this.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, li, dl, dt, dd").forEach((tableElem) => discardTextAttributes(tableElem, "width", "style"));
  }))
  .pipe(dom(function() {
    const discardElemAttributes = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return this.querySelectorAll("div, span").forEach((tableElem) => discardElemAttributes(tableElem, "width", "style"));
  }))
  .pipe(dom(function() {
    const discardTableAttributes = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return this.querySelectorAll("table, thead, tbody, tfoot, tr, th, td").forEach((tableElem) => discardTableAttributes(tableElem, "cellspacing", "cellpadding", "width", "style"));
  }))
  .pipe(dom(function() {
      const discardTargetSelf = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
      return this.querySelectorAll('[target="_self"]').forEach((tableElem) => discardTargetSelf(tableElem, "target"));
    }))
    .pipe(dom(function() {
      const discardRolePres = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
      return this.querySelectorAll('[role="presentation"]').forEach((tableElem) => discardRolePres(tableElem, "role"));
    }))
    .pipe(beautify({ 
      indent_size: 2, 
      wrap_attributes: false 
    }))
    .pipe(gulp.dest("_output"));
});
