import gulp from 'gulp';
import size from 'gulp-size';
import filter from 'gulp-filter';
import through from 'through2';
import path from 'path';

// Image check function
export function imageCheck() {

	// Image filter
	const imageFilter = filter(['**/*.{png,jpg,jpeg,gif,svg}'], { restore: true });

	// Errors object
	let errors = {};

	// Gulp task to check image sizes
	gulp.task('check-image-sizes', function () {
		return gulp
			.src('_input/**/*')
			// Filter images
			.pipe(imageFilter)
			.pipe(
				through.obj((file, enc, cb) => {
					const fileSizeInKB = file.stat.size / 1024;
	
					// If the file size is greater than 400KB, add an error
					if (fileSizeInKB > 400) {
							if (!errors[file.path]) {
								errors[file.path] = [];
							}
							errors[file.path].push(`Image too large: ${file.relative} (${fileSizeInKB.toFixed(0)} KB)`);
					}
					cb(null, file);
				})
			)
			.pipe(size({ showFiles: true }))
			// Restore all files
			.pipe(imageFilter.restore)
			// Log errors
			.on('finish', () => {
        let t = 1;
        for (let e in errors) {
          let r = path.relative('_input', e);
          console.log(`${t}. Image file error for "${r}":`);
          for (let n of errors[e]) {
            console.log(` > ${n}`);
          }
          console.log('--------------------------------------------------');
          t++;
        }
      })  
			
	});
}

