import dom from "gulp-dom";

// remove the 'role' attribute from any element that contains it
export function removeJQueryScript() {
  return dom(function () {
    return this.querySelectorAll('script[src="https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js"]').forEach((jQueryScript) =>
      jQueryScript.remove()
    );
  });
}