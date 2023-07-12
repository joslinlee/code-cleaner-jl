import gulp from "gulp";
import { JSDOM as jsdom } from "jsdom";
import through2 from "through2";
import a from "path";
export function log() {
	let o = {};
	gulp.task("log", () =>
		gulp
			.src("_input/**/*.{html,htm}")
			.pipe(
				through2.obj(function (t, r, a) {
					if (t.isBuffer()) {
						let i = t.contents.toString(),
							n = new jsdom(i, { includeNodeLocations: !0 }),
							l = n.window.document;
						(l.doctype && "html" === l.doctype.name.toLowerCase()) || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing <!DOCTYPE html>"));
						let h = l.querySelector("html");
						(h && "en" === h.getAttribute("lang")) || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing <html lang='en'>"));
						l.querySelector("header.header") || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing <header class='header'></div>"));
						l.querySelector("div#content-wrapper") || (o[t.path] || (o[t.path] = []), o[t.path].push("Missing '#content-wrapper'"));
						Array.from(l.querySelectorAll("iframe")).filter((t) => {
							let e = t.getAttribute("src");
							if (e && (e.includes("https://www.youtube.com") || e.includes("https://pima-cc.hosted.panopto.com"))) {
								let r = t.parentElement;
								for (; null != r; ) {
									if ("div" === r.tagName.toLowerCase() && "media-object" === r.getAttribute("class")) return !1;
									r = r.parentElement;
								}
								return !0;
							}
							return !1;
						}).length > 0 && (o[t.path] || (o[t.path] = []), o[t.path].push("Invalid iframes detected (not contained within '.media-container')"));
						Array.from(l.querySelectorAll("iframe")).find((t) => t.title.includes("YouTube video player")) && (o[t.path] || (o[t.path] = []), o[t.path].push("Invalid iframes detected (incorrect title attribute)"));
						Array.from(l.querySelectorAll("iframe")).filter((t) => t.getAttribute("src").startsWith("https://pima.h5p.com")).length > 0 &&
							(l.querySelector('head > script[src="https://pima.h5p.com/js/h5p-resizer.js"][charset="UTF-8"][defer]') || (o[t.path] || (o[t.path] = []), o[t.path].push("Invalid H5P activity (missing H5P resizer js)")));
						Array.from(l.querySelectorAll(".content-body")).forEach((e) => {
							e.querySelectorAll(".content-body").length > 0 && (o[t.path] || (o[t.path] = []), o[t.path].push("An invalid '.content-body' (nested within another '.content-body')"));
							let r = e.parentElement,
								a = !1;
							for (; null != r; ) {
								if ("div" === r.tagName.toLowerCase() && ("content-wrapper" === r.getAttribute("id") || "second-column" === r.getAttribute("id") || "third-column" === r.getAttribute("id"))) {
									a = !0;
									break;
								}
								r = r.parentElement;
							}
							a || (o[t.path] || (o[t.path] = []), o[t.path].push("A 'content-body' is not inside #content-wrapper, #second-column, or #third-column"));
						}),
							["main", "main-two-column", "sidebar", "video-container"].forEach((e) => {
								let r = l.getElementsByClassName(e),
									a = l.getElementById(e);
								(r.length > 0 || a) && (o[t.path] || (o[t.path] = []), o[t.path].push(`Contains deprecated class or id (${e})`));
							});
						let p = l.querySelectorAll("table");
						p.forEach((e) => {
							e.classList.contains("display-lg") || (o[t.path] || (o[t.path] = []), o[t.path].push("A table does not contain '.display-lg'"));
						}),
							p.forEach((e) => {
								let r = e.querySelector("thead");
								if (r) {
									let a = r.querySelector("tr");
									a
										? 0 === a.querySelectorAll("th[scope='col']").length && (o[t.path] || (o[t.path] = []), o[t.path].push("A table does not contain the correct structure (missing <th scope='col'> within <thead>)"))
										: (o[t.path] || (o[t.path] = []), o[t.path].push("A table does not contain the correct structure (missing <tr> within <thead>)"));
								} else o[t.path] || (o[t.path] = []), o[t.path].push("A table does not contain the correct structure (missing <thead>)");
							});
						let s = l.querySelector("title"),
							c = l.querySelector("h1");
						if (s && c) {
							let u;
							s.textContent.trim() !== c.textContent.trim() && (o[t.path] || (o[t.path] = []), o[t.path].push("<title> and <h1> do not match"));
						} else o[t.path] || (o[t.path] = []), o[t.path].push("Missing <title> or <h1> element");
						Array.from(l.querySelectorAll("img")).forEach((e) => {
							e.hasAttribute("alt") || (o[t.path] || (o[t.path] = []), o[t.path].push("An <img> element is missing its alt attribute"));
						}),
							(t.contents = Buffer.from(n.serialize()));
					}
					a(null, t);
				})
			)
			.pipe(
				through2.obj(function (t, e, r) {
					r(null, t);
				})
			)
			.on("finish", () => {
				let t = 1;
				for (let e in o) {
					let r = a.relative("_input", e);
					for (let i of (console.log(`${t}. Errors in file "${r}":`), o[e])) console.log(` > ${i}`);
					console.log("--------------------------------------------------"), t++;
				}
			})
	);
}
