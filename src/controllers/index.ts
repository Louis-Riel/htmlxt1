import http from "http";
import TemplatePage from "../service/templatepage";
import { readFile, stat } from "fs";
import path from "path";
import { TemplatedPage } from "../model/templatedpage";
import * as siteConfig from "../config/webServer.json"
import getType from '../utils/getType';
import { LocalsObject } from "pug";
import { Request, UrlMapping } from "../model/urlmapping";
import { deflate,gzip  } from "node:zlib";
import { files, getConfig, getStatuses, getStatus } from "../service/chip";

const mappings:UrlMapping[] = [
   {equals: "/",template:()=>"index.pug",datas: [()=>Promise.resolve(siteConfig)]},
   {equals: "/heading",template:()=>"heading.pug", datas: [()=>Promise.resolve(siteConfig),getStatuses]},
   {
      startsWith: "/chip/files/",
      template:()=>"/files/index.pug",
      datas:[()=>Promise.resolve(siteConfig),files],
      errorHandler: err => new Promise<LocalsObject>((resolve, reject) => 
            err.statusMessage === "Internal Server Error" ? 
               (resolve({ resetPathCookie: true, err })) : 
               reject(err))
   },
   {equals:"/chip/status/",template:()=>"/status/index.pug",datas:[()=>Promise.resolve(siteConfig),getStatuses]},
   {startsWith:"/chip/status/",template:()=>"/status/index.pug",datas:[()=>Promise.resolve(siteConfig),getStatus]},
   {equals:"/chip/config/",template:()=>"/config/index.pug",datas:[()=>Promise.resolve(siteConfig),getConfig]},
   {startsWith:"/dist",renderer:GetFileServer((res)=>res.req.url?.substring(6)??"", "node_modules"),datas:[]},
   {endsWith:".css",renderer:GetFileServer((res)=>res.req.url as string, "css"),datas:[]},
   {endsWith:".js",renderer:GetFileServer((res)=>res.req.url as string, "js"),datas:[]},
   {lastIndexIsZero:"/",template:(res)=>res.req.url?.substring(1) + ".pug",datas:[()=>Promise.resolve(siteConfig)]},
];

function GetFileServer(name:(req:Request)=>string,folder:string): (res: Request) => Promise<TemplatedPage>{
   return (res: Request) => serveFile(name(res), folder, res)
}

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
   return Render(res).then(ManageContentType)
                     .then(page => new Promise((resolve,reject)=>res.write(page.page,err=>err?reject(err):resolve(page))))
                     .then(()=>res.end())
                     .catch(RenderError)

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
         if (encs.some(enc=>enc.match(/\bdeflate\b/))) {
            deflate(page.page, (err, buffer) => {
               if (err) {
                  reject(err);
               } else {
                  res.setHeader('Content-Encoding', 'deflate');
                  resolve({page:buffer,headers:page.headers});
               }
            })
         } else if (encs.some(enc=>enc.match(/\bgzip\b/))) {
               res.writeHead(200, { 'Content-Encoding': 'gzip', 'Content-Type': getType(res.req.url ?? "type.json") });
               gzip(page.page, function(err, buffer){
                  if(!err){
                     reject(err);
                  } else {
                     res.setHeader('Content-Encoding', 'deflate');
                     resolve({page:buffer,headers:page.headers});
                  }
               });
         } else {
            resolve(page);
         }
      });
   }
}

function Render(res: Request):Promise<TemplatedPage> {
   var foundIt=false;
   const matches=mappings.filter(mapping=>UrlMatches(mapping) && !foundIt && (foundIt=true));

   if (!matches?.length) {
      return Promise.reject({ statusCode: 404, statusMessage: `Not found ${res.req.url}` });
   }
   const mapping = matches[0];
   const data = mapping.datas.reduce((pv,cv)=>pv.then(ret=>cv(res).then(res=>Object.assign(ret,res))),
                                        Promise.resolve({} as LocalsObject))
   return (mapping.renderer ? mapping.renderer(res) :
                             TemplatePage(mapping.template?mapping.template(res):"notthere",data,mapping.errorHandler))
                                 .then(page=>{
                                    res.setHeader('Content-Type', getType(res.req.url ?? "type.json"));
                                    return page;
                                 })

   function UrlMatches(mapping:UrlMapping): boolean {
      const url = res.req.url as string;
      if (mapping.equals)
         return url.localeCompare(mapping.equals)===0;
      if (mapping.startsWith)
         return url.startsWith(mapping.startsWith)
      if (mapping.endsWith)
         return url.endsWith(mapping.endsWith)
      if (mapping.lastIndexIsZero)
         return url.lastIndexOf(mapping.lastIndexIsZero) === 0
      return false;
   }
}

function serveFile(url:string, folder:string, res: Request):Promise<TemplatedPage> {
   return new Promise((resolve,reject)=>{
      const fname = path.join(__dirname, "../..", folder, url);
      stat(fname, (err, stat) => {
         if (err || !stat.isFile()) {
            reject({statusCode: err ? 500 : 404, statusMessage: err ? JSON.stringify(err) : `file ${fname} not found`});
         } else {
            readFile(fname, (err, data) => {
               if (err) {
                  reject({statusCode: 500, statusMessage: JSON.stringify({ ...err })});
               } else {
                  res.setHeader("Content-Type", getType(url));
                  res.setHeader("Cache-Control", "max-age=31536000")
                  resolve({page:data.toString()});
               }
            });
         }
      });
   });
}

export default server;
