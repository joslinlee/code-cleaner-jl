import t from "gulp";
import { JSDOM as e } from "jsdom";
import n from "through2";
import path from 'path';

export function log() {
    let o = {};

    t.task("log", async () => {
        let i = t.src("_input/**/*.{html,htm}").pipe(n.obj(function(t, n, i) {
            if(t.isBuffer()){
                let r = t.contents.toString(),
                l = new e(r, { includeNodeLocations: true }),
                a = l.window.document;

                // Check for doctype
                a.doctype && "html" === a.doctype.name.toLowerCase() || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing <!DOCTYPE html>"));

                // Check for lang attribute
                let s = a.querySelector("html");
                s && "en" === s.getAttribute("lang") || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing <html lang='en'>"));

                // Check for header
                let c = a.querySelector("header.header");
                c || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing <header class='header'></div>"));

                // Check for content-wrapper
                let u = a.querySelector("div#content-wrapper");
                u || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing '#content-wrapper'"));

                // Check for iframes
                let f = Array.from(a.querySelectorAll("iframe")).filter(t => {
                    let e = t.getAttribute("src");
                    if(e && (e.includes("https://www.youtube.com") || e.includes("https://pima-cc.hosted.panopto.com"))){
                        let n = t.parentElement;
                        for(; null != n;){
                            if("div" === n.tagName.toLowerCase() && "media-object" === n.getAttribute("class")) return false;
                            n = n.parentElement;
                        }
                        return true;
                    }
                    return false;
                });
                f.length > 0 && (o[t.path] || (o[t.path] = []), o[t.path].push("Invalid iframes detected (not contained within '.media-container')"));

                // Check if the document contains an <iframe> with title "YouTube video player"
                let iframeElement = Array.from(a.querySelectorAll("iframe")).find((iframe) => iframe.title.includes("YouTube video player"));
                if (iframeElement) {
                  o[t.path] || (o[t.path] = []);
                  o[t.path].push("Invalid iframes detected (incorrect title attribute)");
                }

                // Check for H5P iframes and missing H5P resizer script
                let iframes = Array.from(a.querySelectorAll("iframe"));
                let h5pIframes = iframes.filter((iframe) => iframe.getAttribute("src").startsWith("https://pima.h5p.com"));
                if (h5pIframes.length > 0) {
                  let script = a.querySelector('head > script[src="https://pima.h5p.com/js/h5p-resizer.js"][charset="UTF-8"][defer]');
                  if (!script) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push("Invalid H5P activity (missing H5P resizer js)");
                  }
                }

                // Check for invalid .content-body
                let contentBodies = a.querySelectorAll(".content-body");
                Array.from(contentBodies).forEach((contentBody) => {
                  // Check for nested "content-body" divs not only in direct children but in any descendant
                  let nestedContentBodies = contentBody.querySelectorAll(".content-body");
                  if (nestedContentBodies.length > 0) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push("An invalid '.content-body' (nested within another '.content-body')");
                  }

                  // Check if content-body is not inside #content-wrapper, #second-column, or #third-column
                  let parent = contentBody.parentElement;
                  let validParentFound = false;
                  while (parent != null) {
                    if (parent.tagName.toLowerCase() === "div" && (parent.getAttribute("id") === "content-wrapper" || parent.getAttribute("id") === "second-column" || parent.getAttribute("id") === "third-column")) {
                      validParentFound = true;
                      break;
                    }
                    parent = parent.parentElement;
                  }
                  if (!validParentFound) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push("A 'content-body' is not inside #content-wrapper, #second-column, or #third-column");
                  }
                });

                // Check for deprecated widgets, classes, or ids
                let deprecatedClassOrId = ["main", "main-two-column", "sidebar", "video-container"];
                let classAndIdsToFind = deprecatedClassOrId;

                classAndIdsToFind.forEach((item) => {
                  let classElements = a.getElementsByClassName(item);
                  let idElements = a.getElementById(item);

                  if (classElements.length > 0 || idElements) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push(`Contains deprecated class or id (${item})`);
                  }
                });

                // ...

                // Check tables
                let tables = a.querySelectorAll("table");

                tables.forEach((table) => {
                  if (!table.classList.contains("display-lg")) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push("A table does not contain '.display-lg'");
                  }
                });

                // Check for specific table structure
                tables.forEach((table) => {
                  const tableMissingThMsg = "A table does not contain the correct structure (missing <th scope='col'> within <thead>)";
                  const tableMissingTrMsg = "A table does not contain the correct structure (missing <tr> within <thead>)";
                  const tableMissingTheadMsg = "A table does not contain the correct structure (missing <thead>)";

                  let thead = table.querySelector("thead");
                  if (thead) {
                    let tr = thead.querySelector("tr");
                    if (tr) {
                      let ths = tr.querySelectorAll("th[scope='col']");
                      if (ths.length === 0) {
                        o[t.path] || (o[t.path] = []);
                        o[t.path].push(tableMissingThMsg);
                      }
                    } else {
                      o[t.path] || (o[t.path] = []);
                      o[t.path].push(tableMissingTrMsg);
                    }
                  } else {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push(tableMissingTheadMsg);
                  }
                });

                // Check for matching <title> and <h1>
                let title = a.querySelector("title");
                let h1 = a.querySelector("h1");

                // Make sure both elements exist before comparing them
                if (title && h1) {
                  let titleText = title.textContent.trim();
                  let h1Text = h1.textContent.trim();

                  if (titleText !== h1Text) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push("<title> and <h1> do not match");
                  }
                } else {
                  o[t.path] || (o[t.path] = []);
                  o[t.path].push("Missing <title> or <h1> element");
                }         
                
                // Check for images without alt attribute
                let imgElements = a.querySelectorAll("img");
                Array.from(imgElements).forEach((img) => {
                  if (!img.hasAttribute("alt")) {
                    o[t.path] || (o[t.path] = []);
                    o[t.path].push("An <img> element is missing its alt attribute");
                  }
                });                

                // ...
                // Continue adding the remaining checks here in the same pattern as above...
                // ...

                t.contents = Buffer.from(l.serialize());
            }
            i(null,t);
        })).pipe(n.obj(function(t,e,n){n(null,t)}));

        i.on("finish", () => {
          let tt = 1;
          for(let e in o){
              let relativePath = path.relative('_input', e);
              for(let n of (console.log(`${tt}. Errors in file "${relativePath}":`), o[e])) console.log(` > ${n}`);
              console.log("--------------------------------------------------"), tt++;
          }
      })
      
    });
}
