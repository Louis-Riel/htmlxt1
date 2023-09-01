import http from "http";
import { TemplatedPage } from "../model/templatedpage";
import getType from '../utils/getType';
import { Request } from "../model/urlmapping";
import { deflate,gzip  } from "node:zlib";
import { Render } from "./render";

const server = http.createServer((req, res) => {
   switch (req.method) {
      case "GET":
         get(res);
         break;
      default:
         res.statusCode = 500;
         res.end("Invalid request");
   }
});


function get(res: Request) {
   Render(res).then(ManageContentType)
              .then(SendResponse)
              .then(()=>res.end())
              .catch(RenderError)

   function SendResponse(page:TemplatedPage):Promise<TemplatedPage>{
      return new Promise((resolve, reject) => res.write(page.page, err => err ? reject(err) : resolve(page)));
   }

   function RenderError(err: any) {
      res.statusCode = err.statusCode ?? 500;
      res.statusMessage = res.statusCode === 404 ? "Not found" : "Server Error";
      res.statusCode === 404 ? console.warn(res.req.method, res.req.url) : console.error(res.req.method, res.req.url);
      res.writeHead(res.statusCode, ["Content-Type", getType("error.json")]);
      res.end(JSON.stringify({
         statusCode: res.statusCode,
         statusMessage: err.message ?? res.statusMessage
      }));
   }

   function ManageContentType(page:TemplatedPage):Promise<TemplatedPage>{
      return new Promise((resolve,reject) => {
         const enc = res.req.headers["Accept-Encoding"];
         const encs = typeof enc === 'string' ? [enc] : enc ?? [];
         if (encs.some(/\bdeflate\b/.test)) {
            Deflate(reject, resolve);
         } else if (encs.some(/\bgzip\b/.test)) {
            Gzip(reject, resolve);
         } else {
            resolve(page);
         }
      });

      function Gzip(reject: (reason?: any) => void, resolve: (value: TemplatedPage | PromiseLike<TemplatedPage>) => void) {
         gzip(page.page, function (err, buffer) {
            if (err) {
               reject(err);
            } else {
               res.setHeader('Content-Encoding', 'gzip');
               resolve({ page: buffer, headers: page.headers });
            }
         });
      }

      function Deflate(reject: (reason?: any) => void, resolve: (value: TemplatedPage | PromiseLike<TemplatedPage>) => void) {
         deflate(page.page, (err, buffer) => {
            if (err) {
               reject(err);
            } else {
               res.setHeader('Content-Encoding', 'deflate');
               resolve({ page: buffer, headers: page.headers });
            }
         });
      }
   }
}

export default server;
