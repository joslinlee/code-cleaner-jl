import { log } from "./modules/log.js";
import { clean } from "./modules/clean.js";
import { imageCheck } from "./modules/imageCheck.js";
import gulp from "gulp";

gulp.task("default", async () => {
	console.log(`
  Code-cleaner is an automation tool that will (a) check your code for errors, and (b) clean your code.
  Follow these instructions to get started:

  npm run start - Run both 'log' and 'clean' commands.    
  npm run log   - Check your code for errors, then log errors.
  npm run clean - Clean your code.
`);
});

imageCheck();
log();
clean();
