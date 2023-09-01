import TemplatePage from "../service/templatepage";
import { TemplatedPage } from "../model/templatedpage";
import getType from '../utils/getType';
import { LocalsObject } from "pug";
import { Request, UrlMapping } from "../model/urlmapping";
import * as siteConfig from "../config/webServer.json"
import * as paths from "../config/downstream.json"
import { files, getConfig, getStatus, getStatuses } from "../service/chip";
import { serveFile } from "../service/serveFile";

export const mappings:UrlMapping[] = [
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
   {equals:"/status/",template:()=>"/status/statuses.pug",datas:[()=>Promise.resolve({...siteConfig,...paths})]},
   {startsWith:"/chip/status/",template:()=>"/status/index.pug",datas:[()=>Promise.resolve(siteConfig),(res)=>getStatus(res)]},
   {equals:"/chip/config/",template:()=>"/config/index.pug",datas:[()=>Promise.resolve(siteConfig),getConfig]},
   {startsWith:"/dist",renderer:GetFileServer((res)=>res.req.url?.substring(6)??"", "node_modules"),datas:[]},
   {endsWith:".css",renderer:GetFileServer((res)=>res.req.url as string, "css"),datas:[]},
   {endsWith:".js",renderer:GetFileServer((res)=>res.req.url as string, "js"),datas:[]},
   {lastIndexIsZero:"/",template:(res)=>res.req.url?.substring(1) + ".pug",datas:[()=>Promise.resolve(siteConfig)]},
];

function GetFileServer(name:(req:Request)=>string,folder:string): (res: Request) => Promise<TemplatedPage>{
   return (res: Request) => serveFile(name(res), folder, res)
}

export function Render(res: Request): Promise<TemplatedPage> {
   const matches = mappings.filter(UrlMatches);

   if (!matches?.length) {
      return Promise.reject(new Error(`Not found ${res.req.url}`));
   } else {
      const mapping = matches[0];
      const template = mapping.template ? mapping.template(res) : "notthere";
      const data = mapping.datas.reduce((pv, cv) => pv.then(ret => cv(res).then(res => Object.assign(ret, res))),
         Promise.resolve({} as LocalsObject));
      const setContentType = (page: TemplatedPage): TemplatedPage => {
         res.setHeader('Content-Type', getType(res.req.url ?? "type.json"));
         return page;
      };
      return (mapping.renderer ? 
               mapping.renderer(res) :
               TemplatePage(template,data,mapping.errorHandler)).then(setContentType)
   }

   function UrlMatches(mapping: UrlMapping): boolean {
      const url = res.req.url as string;
      if (mapping.equals)
         return url.localeCompare(mapping.equals) === 0;
      if (mapping.startsWith)
         return url.startsWith(mapping.startsWith);
      if (mapping.endsWith)
         return url.endsWith(mapping.endsWith);
      if (mapping.lastIndexIsZero)
         return url.lastIndexOf(mapping.lastIndexIsZero) === 0;
      return false;
   }
}
