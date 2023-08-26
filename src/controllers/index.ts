import http from "http";
import TemplatePage from "../service/templatepage";
import { readFile, stat } from "fs";
import path from "path";
import files from "../service/chip/files";
import status from "../service/chip/status";
import { TemplatedPage } from "../model/templatedpage";
import config from "../service/chip/config";
import * as siteConfig from "../config/config.json"
import getType from "../utils/getType";

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


function get(res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }) {
   return Render(res).then(page => {
      res.writeHead(200,page.headers);
      res.end(page.page);
      console.log("GET", res.req.url);
   }).catch(err=>{
      res.statusCode = err.statusCode ?? 500;
      res.statusMessage = res.statusCode === 404 ? "Not found" : "Server Error";
      res.writeHead(res.statusCode,["Content-Type",getType("error.json")]);
      res.statusCode === 404 ?  console.warn("GET", res.req.url) : console.error("GET", res.req.url);
      res.end(JSON.stringify({
         statusCode: res.statusCode,
         statusMessage: err.message ?? res.statusMessage
      }));
   })
}

function Render(res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }):Promise<TemplatedPage> {
   var ret:Promise<TemplatedPage>;
   if (res.req.url === "/") {
      ret=TemplatePage("index.pug", Promise.resolve(siteConfig))
   } else if (res.req.url?.startsWith("/chip/")) {
      if (res.req.url?.substring(6).startsWith("files/")) {
         ret=TemplatePage("/files/index.pug", files(res))
      } else if (res.req.url?.substring(6).startsWith("status/")) {
         ret=TemplatePage("/status/index.pug", status())
      } else if (res.req.url?.substring(6).startsWith("config/")) {
         ret=TemplatePage("/config/index.pug", config())
      } else {
         ret=Promise.reject({ statusCode: 404, statusMessage: `missing service path ${res.req.url}` });
      }
   } else if (res.req.url?.startsWith("/dist/")) {
      ret=serveFile(res.req.url.substring(6), "node_modules", res)
   } else if (res.req.url?.endsWith(".css")) {
      ret=serveFile(res.req.url, "css", res)
   } else {
      if (res.req.url?.lastIndexOf('/') === 0) {
         ret=TemplatePage(res.req.url?.substring(1) + ".pug", Promise.resolve(siteConfig))
      } else {
         ret=Promise.reject({ statusCode: 404, statusMessage: `Not found ${res.req.url}` });
      }
   }
   return ret;
}

function serveFile(url:string, folder:string, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }):Promise<TemplatedPage> {
   return new Promise((resolve,reject)=>{
      const fname = path.join(__dirname, "../..", folder, url);
      stat(fname, (err, stat) => {
         if (err || !stat.isFile()) {
            res.setHeader("Content-Type", "application/json");
            reject({statusCode: err ? 500 : 404, statusMessage: err ? JSON.stringify({ ...err }) : `${fname} not found`});
         } else {
            readFile(fname, (err, data) => {
               if (err) {
                  res.setHeader("Content-Type", "application/json");
                  reject({statusCode: 500, statusMessage: JSON.stringify({ ...err })});
               } else {
                  res.setHeader("Content-Type", getType(url));
                  resolve({page:data.toString()});
               }
            });
         }
      });
   });
}

export default server;
