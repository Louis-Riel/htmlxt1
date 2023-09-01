import { readFile, stat } from "fs";
import path from "path";
import { TemplatedPage } from "../model/templatedpage";
import getType from '../utils/getType';
import { Request } from "../model/urlmapping";

export function serveFile(url: string, folder: string, res: Request): Promise<TemplatedPage> {
   return new Promise((resolve, reject) => {
      const fname = path.join(__dirname, "../..", folder, url);
      stat(fname, (err, stat) => {
         if (err || !stat.isFile()) {
            reject({ statusCode: err ? 500 : 404, statusMessage: err ? JSON.stringify(err) : `file ${fname} not found` });
         } else {
            readFile(fname, (err, data) => {
               if (err) {
                  reject({ statusCode: 500, statusMessage: JSON.stringify({ ...err }) });
               } else {
                  res.setHeader("Content-Type", getType(url));
                  res.setHeader("Cache-Control", "max-age=31536000");
                  resolve({ page: data.toString() });
               }
            });
         }
      });
   });
}
