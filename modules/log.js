import gulp from "gulp";
import { JSDOM as jsdom } from "jsdom";
import through2 from "through2";
import path from "path";

export function log() {
  let errors = {};
  gulp.task("log", () => 
    gulp.src("_input/**/*.{html,htm}")
      .pipe(through2.obj(function(file, enc, callback) {
        if (file.isBuffer()) {
          let content = file.contents.toString(),
              dom = new jsdom(content, { includeNodeLocations: !0 }),
              document = dom.window.document;

          document.doctype && "html" === document.doctype.name.toLowerCase() || 
            (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Missing <!DOCTYPE html>"));

          let html = document.querySelector("html");
          html && "en" === html.getAttribute("lang") || 
            (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Missing <html lang='en'>"));

          document.querySelector("header.header") || 
            (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Missing <header class='header'></div>"));

          document.querySelector("div#content-wrapper") || 
            (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Missing '#content-wrapper'"));

          Array.from(document.querySelectorAll("iframe")).filter(t => {
            let e = t.getAttribute("src");
            if (e && (e.includes("https://www.youtube.com") || e.includes("https://pima-cc.hosted.panopto.com"))) {
              let r = t.parentElement;
              for (; null != r;) {
                if ("div" === r.tagName.toLowerCase() && "media-object" === r.getAttribute("class")) return !1;
                r = r.parentElement;
              }
              return !0;
            }
            return !1;
          }).length > 0 && 
            (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Invalid iframes detected (not contained within '.media-container')"));

          Array.from(document.querySelectorAll("iframe")).find(t => t.title.includes("YouTube video player")) && 
            (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Invalid iframes detected (incorrect title attribute)"));

          Array.from(document.querySelectorAll("iframe")).filter(t => t.getAttribute("src").startsWith("https://pima.h5p.com")).length > 0 && 
            (document.querySelector('head > script[src="https://pima.h5p.com/js/h5p-resizer.js"][charset="UTF-8"][defer]') || 
              (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Invalid H5P activity (missing H5P resizer js)")));

          Array.from(document.querySelectorAll(".content-body")).forEach(e => {
            e.querySelectorAll(".content-body").length > 0 && 
              (errors[file.path] || (errors[file.path] = []), errors[file.path].push("An invalid '.content-body' (nested within another '.content-body')"));

            let r = e.parentElement,
                a = !1;
            for (; null != r;) {
              if ("div" === r.tagName.toLowerCase() && ("content-wrapper" === r.getAttribute("id") || "second-column" === r.getAttribute("id") || "third-column" === r.getAttribute("id"))) {
                a = !0;
                break;
              }
              r = r.parentElement;
            }
            a || 
              (errors[file.path] || (errors[file.path] = []), errors[file.path].push("A 'content-body' is not inside #content-wrapper, #second-column, or #third-column"));
          });

          ["main", "main-two-column", "sidebar", "video-container"].forEach(e => {
            let r = document.getElementsByClassName(e),
                a = document.getElementById(e);
            (r.length > 0 || a) && 
              (errors[file.path] || (errors[file.path] = []), errors[file.path].push(`Contains deprecated class or id (${e})`));
          });

          let tables = document.querySelectorAll("table");
          tables.forEach(e => {
            e.classList.contains("display-lg") || 
              (errors[file.path] || (errors[file.path] = []), errors[file.path].push("A table does not contain '.display-lg'"));
          });

          tables.forEach(e => {
            let r = e.querySelector("thead");
            if (r) {
              let a = r.querySelector("tr");
              a ? 0 === a.querySelectorAll("th[scope='col']").length && 
                (errors[file.path] || (errors[file.path] = []), errors[file.path].push("A table does not contain the correct structure (missing <th scope='col'> within <thead>)")) : 
                (errors[file.path] || (errors[file.path] = []), errors[file.path].push("A table does not contain the correct structure (missing <tr> within <thead>)"));
            } else 
              errors[file.path] || (errors[file.path] = []), errors[file.path].push("A table does not contain the correct structure (missing <thead>)");
          });

          let title = document.querySelector("title"),
          h1 = document.querySelector("h1");

      title && h1 ? title.textContent.trim() !== h1.textContent.trim() && 
        (errors[file.path] || (errors[file.path] = []), errors[file.path].push("<title> and <h1> do not match")) : 
        (errors[file.path] || (errors[file.path] = []), errors[file.path].push("Missing <title> or <h1> element"));

      Array.from(document.querySelectorAll("img")).forEach(e => {
        e.hasAttribute("alt") || 
          (errors[file.path] || (errors[file.path] = []), errors[file.path].push("An <img> element is missing its alt attribute"));
      });

      file.contents = Buffer.from(dom.serialize());
    }
    callback(null, file);
  }))
  .pipe(through2.obj(function(t, e, r) {
    r(null, t);
  }))
  .on("finish", () => {
    let t = 1;
    for (let e in errors) {
      let r = path.relative("_input", e);
      for (let n of (console.log(`${t}. Errors in file "${r}":`), errors[e])) 
        console.log(` > ${n}`);
      console.log("--------------------------------------------------"), t++;
    }
  })
);
}

