// gulpfile.js
import gulp from "gulp";
import beautify from "gulp-jsbeautifier";
import { cleanTextElements } from "./clean/cleanTextElements.js";
import { cleanElementAttributes } from "./clean/cleanElementAttributes.js";
import { cleanTableAttributes } from "./clean/cleanTableAttributes.js";
import { removeTargetAttributes } from "./clean/removeTargetAttributes.js";
import { removeRolePresentation } from "./clean/removeRolePresentation.js";
import { matchTitleToH1 } from "./clean/matchTitleToH1.js";
import { cleanImageAttributes } from "./clean/cleanImageAttributes.js";
import { removeJQueryScript } from "./clean/removeJQueryScript.js";

export function clean() {
  gulp.task("clean", async () => {
    gulp
      .src("_input/**/*.{html,htm}")
      .pipe(cleanTextElements())
      .pipe(cleanElementAttributes())
      .pipe(cleanTableAttributes())
			.pipe(removeJQueryScript())
      .pipe(removeTargetAttributes())
      .pipe(removeRolePresentation())
      .pipe(matchTitleToH1())
      .pipe(cleanImageAttributes())
      .pipe(
        beautify({
          indent_size: 2,
          wrap_attributes: false,
          extra_liners: [],
        })
      )
      .pipe(beautify.reporter())
      .pipe(gulp.dest("_output"));
  });

  gulp.task("copy", async () => {
    gulp.src(["_input/**/*", "!_input/**/*.{html,htm}"])
      .pipe(gulp.dest("_output"));
  });

  gulp.task("clean-copy", gulp.series("clean", "copy"));
}