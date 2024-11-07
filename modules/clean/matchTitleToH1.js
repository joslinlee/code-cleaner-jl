import dom from "gulp-dom";

// match the title tag to the h1 tag if they don't already match
export function matchTitleToH1() {
  return dom(function () {
    const h1 = this.querySelector("h1");
    const title = this.querySelector("title");
    if (h1 && title && title.textContent !== h1.textContent) {
      title.textContent = h1.textContent;
    }
  });
}