# PimaOnline Code Cleaner

This code cleaner app is a code cleaning automation tool designed to format and log errors for the markup used to build courses with the PimaOnline Themepack.    

## Version 

0.1.1

## Dependencies

- node.js
- gulp
- gulp-dom
- gulp-jsbeautifier
- jsdom

## How to use

This code cleaner app is used within a Terminal or comperable technology.
Place any file(s) and/or folder(s) inside the ```_input``` folder then run the appropriate command. 

```npm run log```  
The app will check all files in ```_input``` and log errors.

```npm run clean```  
The app will check all files in ```_input```, fix code errors, then output the updated files into ```_output```.

### Commands

```npm run start``` - Run both 'log' and 'clean' commands.    
```npm run log```   - Check your code for errors, then log errors.    
```npm run clean``` - Clean your code.

## Authors

Center for Learning Technology at Pima Community College

## License

Code is released under the MIT license.