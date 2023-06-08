// Right before update the logging logic to display file with all

const gulp = require("gulp");
const dom = require("gulp-dom");
const beautify = require("gulp-jsbeautifier");
const path = require("path");
const through2 = require("through2");
const { JSDOM } = require("jsdom");

const invalidIframesMsg = "Page(s) contain invalid youtube or panopto iframe(s):";
const invalidContentBodiesMsg = "Page(s) contain 1 or more invalid .content-body element(s):";
const hasDeprecatedWidgetsMsg = "Page(s) contain deprecated widget(s):";
const filesWithMismatchedTitlesMsg = "Page(s) contain mismatched <title> and <h1> elements:";
const filesWithInvalidTablesMsg = "Page(s) contain invalid table(s):";
const filesWithInvalidImagesMsg = "Page(s) contain image(s) with no alt-text:";
const filesWithMissingDoctypeOrLangMsg = "Page(s) contain image(s) with no alt-text:";
const filesWithMissingHeaderOrContentWrapperMsg = "Page(s) contain image(s) with no alt-text:";
const filesWithYtIframesMsg = "Page(s) contain image(s) with no alt-text:";

const filesWithMissingHeaderOrContentWrapper = new Set();
const filesWithMissingHeadOrBody = new Set();
const filesWithMissingDoctypeOrLang = new Set();
const filesWithInvalidImages = new Set();
const filesWithInvalidTables = new Set();
const filesWithMismatchedTitles = new Set();
const filesWithInvalidIframes = new Set();
const filesWithYtIframes = new Set();
const filesWithInvalidContentBody = new Set();
const filesWithDeprecatedWidgets = new Set();

// Array to set all depecrated widget classes. If any are present, the file(s) containing them will be logged.
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
	return (
		gulp
			.src("_input/**/*.html")

      // Check document structure
      // Log if document does not contain <!DOCTYPE html> or <html lang="en">
      .pipe(
        through2.obj(function (file, _, cb) {
          if (file.isBuffer()) {
            let html = file.contents.toString();
            let dom = new JSDOM(html, { includeNodeLocations: true });
            let doc = dom.window.document;
      
            // Check if the document contains <!DOCTYPE html>
            if (!doc.doctype || doc.doctype.name.toLowerCase() !== 'html') {
              filesWithMissingDoctypeOrLang.add(file.path);
            }
      
            // Check if the document contains <html lang="en">
            let htmlElement = doc.querySelector("html");
            if (!htmlElement || htmlElement.getAttribute("lang") !== "en") {
              filesWithMissingDoctypeOrLang.add(file.path);
            }
      
            file.contents = Buffer.from(dom.serialize());
          }
          cb(null, file);
        })
      )

      // Check for <header> and #content-wrapper
      .pipe(
        through2.obj(function (file, _, cb) {
          if (file.isBuffer()) {
            let html = file.contents.toString();
            let dom = new JSDOM(html);
            let doc = dom.window.document;
    
            // Check if the document contains a <header> with class "header"
            let headerElement = doc.querySelector("header.header");
    
            // Check if the document contains a <div> with id "content-wrapper"
            let divElement = doc.querySelector("div#content-wrapper");
    
            // If neither is present, add the file path to the set
            if (!headerElement || !divElement) {
              filesWithMissingHeaderOrContentWrapper.add(file.path);
            }
    
            file.contents = Buffer.from(dom.serialize());
          }
          cb(null, file);
        })
      )

			// Log if youtube or panopto iframes exist outside of media container
      .pipe(
        through2.obj(function (file, _, cb) {
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
              filesWithInvalidIframes.add(file.path);
            }
      
            file.contents = Buffer.from(dom.serialize());
          }
          cb(null, file);
        })
      )

      // Check iframes for iframe with youtube title
      .pipe(
        through2.obj(function (file, _, cb) {
          if (file.isBuffer()) {
            let html = file.contents.toString();
            let dom = new JSDOM(html);
            let doc = dom.window.document;
      
            // Check if the document contains an <iframe> with title "YouTube video player"
            let iframeElement = Array.from(doc.querySelectorAll("iframe")).find(iframe => iframe.title.includes("YouTube video player"));
      
            // If such an iframe is not present, add the file path to the set
            if (iframeElement) {
              filesWithYtIframes.add(file.path);
            }
      
            file.contents = Buffer.from(dom.serialize());
          }
          cb(null, file);
        })
      )
            
      
			// Check for .content-body.
      /// Log if any are nested within another .content-body
      /// Log if any are not inside #content-wrapper, #second-column, or #third-column
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
									let parentID = parent.getAttribute("id"); // Get the id attribute instead of class
									if (parentID === "content-wrapper" || parentID === "second-column" || parentID === "third-column") {
										return false;
									}
								}
								parent = parent.parentElement;
							}
							return true;
						});

						if (invalidContentBodies.length > 0) {
							filesWithInvalidContentBody.add(file.path);
						}

						file.contents = Buffer.from(dom.serialize());
					}
					cb(null, file);
				})
			)
			// check for page errors

			// Log if deprecated widgets exist
			.pipe(
				through2.obj(function (file, _, cb) {
					if (file.isBuffer()) {
						let html = file.contents.toString();
						let dom = new JSDOM(html);
						let doc = dom.window.document;

						let hasDeprecatedWidgets = deprecatedClasses.some((deprecatedClass) => {
							let elements = doc.getElementsByClassName(deprecatedClass);
							return elements.length > 0;
						});

						if (hasDeprecatedWidgets) {
							filesWithDeprecatedWidgets.add(file.path);
						}

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
    
            let tables = doc.querySelectorAll('table');
            for (let table of tables) {
              if (table.getAttribute('class') !== 'display-lg') {
                filesWithInvalidTables.add(file.path);
                break;
              }
    
              let thead = table.querySelector('thead');
              if (!thead) {
                filesWithInvalidTables.add(file.path);
                break;
              }
    
              let tr = thead.querySelector('tr');
              if (!tr) {
                filesWithInvalidTables.add(file.path);
                break;
              }
    
              let ths = Array.from(tr.querySelectorAll('th'));
              if (!ths.every(th => th.getAttribute('scope') === 'col')) {
                filesWithInvalidTables.add(file.path);
                break;
              }
            }
    
            file.contents = Buffer.from(dom.serialize());
          }
          cb(null, file);
        })
      )

			// Log if <title> and <h1> don't match
			.pipe(
				through2.obj(function (file, _, cb) {
					if (file.isBuffer()) {
						let html = file.contents.toString();
						let dom = new JSDOM(html);
						let doc = dom.window.document;

						let title = doc.querySelector("title")?.textContent || "";
						let h1 = doc.querySelector("h1")?.textContent || "";

						if (title.trim() !== h1.trim()) {
							filesWithMismatchedTitles.add(file.path);
						}

						file.contents = Buffer.from(dom.serialize());
					}
					cb(null, file);
				})
			)

      // Log if file(s) contain <image> without alt attribute
      .pipe(
        through2.obj(function (file, _, cb) {
          if (file.isBuffer()) {
            let html = file.contents.toString();
            let dom = new JSDOM(html);
            let doc = dom.window.document;
    
            let images = doc.querySelectorAll('img');
            for (let img of images) {
              if (!img.hasAttribute('alt')) {
                filesWithInvalidImages.add(file.path);
                break;
              }
            }
    
            file.contents = Buffer.from(dom.serialize());
          }
          cb(null, file);
        })
      )      

      // Start automations 
      //==
			// remove elements with "&nbsp" as inner-text
			.pipe(
				dom(function () {
					const par = this.querySelectorAll("p");
					return par.forEach((e) => {
						if (e.textContent == "\xa0") e.remove();
					});
				})
			)
			// remove empty elements
			.pipe(
				dom(function () {
					const par = this.querySelectorAll("div, span, h1, h2, h3, h4, h5, h6, p, strong, em");
					return par.forEach((e) => {
						if (e.textContent == "") e.remove();
					});
				})
			)
			.pipe(
				dom(function () {
					const discardTextAttributes = (textElement, ...attributes) => attributes.forEach((attribute) => textElement.removeAttribute(attribute));
					return this.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, li, dl, dt, dd").forEach((elem) => discardTextAttributes(elem, "width", "style"));
				})
			)
			.pipe(
				dom(function () {
					const discardElemAttributes = (element, ...attributes) => attributes.forEach((attribute) => element.removeAttribute(attribute));
					return this.querySelectorAll("body, div, span, bold, em").forEach((elem) => discardElemAttributes(elem, "style"));
				})
			)
			.pipe(
				dom(function () {
					const discardTableAttributes = (tableElement, ...tableAttributes) => tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
					return this.querySelectorAll("table, thead, tbody, tfoot, tr, th, td").forEach((tableElem) => discardTableAttributes(tableElem, "cellspacing", "cellpadding", "width", "style"));
				})
			)
			.pipe(
				dom(function () {
					const discardTargetSelf = (element, ...attributes) => attributes.forEach((attribute) => element.removeAttribute(attribute));
					return this.querySelectorAll('[target="_self"], [target="_new"]').forEach((tableElem) => discardTargetSelf(tableElem, "target"));
				})
			)
			.pipe(
				dom(function () {
					const discardRolePres = (element, ...attributes) => attributes.forEach((attribute) => element.removeAttribute(attribute));
					return this.querySelectorAll('[role="presentation"]').forEach((tableElem) => discardRolePres(tableElem, "role"));
				})
			)
			.pipe(
				beautify({
					indent_size: 2,
					wrap_attributes: false,
					extra_liners: [],
				})
			)
			.pipe(beautify.reporter())
			.pipe(gulp.dest("_output"))
			//== Log messages
			.on("end", () => {
        // log files that do not contain <!DOCTYPE html> or <html lang="en">
        if (filesWithMissingDoctypeOrLang.size > 0) {
          console.log(`X1. ${filesWithMissingDoctypeOrLangMsg}`);
          for (const file of filesWithMissingDoctypeOrLang) {
            console.log(` > ${file}`);
          }
        }
        // Log file(s) if <header> and #content-wrapper are not present       
        if (filesWithMissingHeaderOrContentWrapper.size > 0) {
          console.log(`X2. ${filesWithMissingHeaderOrContentWrapperMsg}`);
          for (const file of filesWithMissingHeaderOrContentWrapper) {
            console.log(` > ${file}`);
          }
        }
        // log files that contain invalid youtube or panopto iframes
				if (filesWithInvalidIframes.size > 0) {
					console.log(`1. ${invalidIframesMsg}`);
					for (const file of filesWithInvalidIframes) {
						console.log(` > ${file}`);
					}
				}
        //
        if (filesWithYtIframes.size > 0) {
          console.log(`X3. ${filesWithYtIframesMsg}`);
          for (let filePath of filesWithYtIframes) {
            console.log(` > ${filePath}`);
          }
        }        
        // log files that contain invalid .content-body
				if (filesWithInvalidContentBody.size > 0) {
					console.log(`2. ${invalidContentBodiesMsg}`);
					for (const file of filesWithInvalidContentBody) {
						console.log(` > ${file}`);
					}
				}
        // log files that contain deprecated widget(s)
				if (filesWithDeprecatedWidgets.size > 0) {
					console.log(`3. ${hasDeprecatedWidgetsMsg}`);
					for (const file of filesWithDeprecatedWidgets) {
						console.log(` > ${file}`);
					}
				}
        // log files with mismatched <title> and <h1>
				if (filesWithMismatchedTitles.size > 0) {
					console.log(`4. ${filesWithMismatchedTitlesMsg}`);
					for (const file of filesWithMismatchedTitles) {
						console.log(` > ${file}`);
					}
				}
        // log files with invalid tables
        if (filesWithInvalidTables.size > 0) {
          console.log(`5. ${filesWithInvalidTablesMsg}`);
          for (const file of filesWithInvalidTables) {
            console.log(` > ${file}`);
          }
        }
        // log files with images that do not contain alt attribute
        if (filesWithInvalidImages.size > 0) {
          console.log(`6. ${filesWithInvalidImagesMsg}`);
          for (const file of filesWithInvalidImages) {
            console.log(` > ${file}`);
          }
        }

			})
	);
});
