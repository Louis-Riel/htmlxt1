import http from "http";
import { TemplatedPage } from "../model/templatedpage";
import getType from '../utils/getType';
import { Request } from "../model/urlmapping";
import { deflate,gzip  } from "node:zlib";
import { Render } from "./render";
import { sendCommand } from "../service/chip";

const server = http.createServer((req, res) => {
   switch (req.method) {
      case "GET":
         get(res);
         break;
      case "PUT":
         put(res);
         break;
      default:
         res.statusCode = 500;
         res.end("Invalid request");
   }
});


function put(res: Request) {
   if (res.req.url === "/espcommand") {
      let body = "";
      res.req.on("data",chunck=>{
         body+=chunck.toString();
      })
      res.req.on("end",()=>{
         sendCommand(body)
            .catch(err=>res.writeHead(500,err.message))
            .finally(()=>res.end())
      })
   }
}

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
      const enc = res.req.headers["accept-encoding"];
      if (enc) {
         const encs = typeof enc === 'string' ? [enc] : enc ?? [];
         if (encs.some(enc=>/\bgzip\b/.test(enc))) {
            return Gzip(page);
         } else if (encs.some(enc=>/\bdeflate\b/.test(enc))) {
            return Deflate(page);
         }
      }

      return Promise.resolve(page);

      function Gzip(page:TemplatedPage):Promise<TemplatedPage> {
         return new Promise((resolve,reject) => {
            gzip(page.page, function (err, buffer) {
            if (err) {
               reject(err);
            } else {
               res.setHeader('Content-Encoding', 'gzip');
               resolve({ page: buffer, headers: page.headers });
            }
         })})
      }

      function Deflate(page:TemplatedPage):Promise<TemplatedPage> {
         return new Promise((resolve,reject) => {
            deflate(page.page, (err, buffer) => {
               if (err) {
                  reject(err);
               } else {
                  res.setHeader('Content-Encoding', 'deflate');
                  resolve({ page: buffer, headers: page.headers });
               }
         })})
      }
   }
}

export default server;