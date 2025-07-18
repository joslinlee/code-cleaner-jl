import through2 from "through2";
import { JSDOM } from "jsdom";

export function domTransform(callback) {
  return through2.obj(function (file, _, cb) {
    if (file.isBuffer()) {
      const dom = new JSDOM(file.contents.toString());
      const document = dom.window.document;

      callback(document);

      file.contents = Buffer.from(dom.serialize());
    }
    cb(null, file);
  });
}
