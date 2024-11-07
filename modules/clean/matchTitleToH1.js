import dom from "gulp-dom";

// remove the 'role' attribute from any element that contains it
export function matchTitleToH1() {
  return dom(function () {
    const h1 = this.querySelector("h1");
    if (h1) {
      this.querySelector("title").textContent = h1.textContent;
    }
  });
}