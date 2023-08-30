import * as options from "../../config/downstream.json"
import { IncomingMessage, RequestOptions, ServerResponse, request } from "http";
import { host } from "../../config/downstream.json"
import { EspFile } from '../../model/espfile';
import { Request } from "../../model/urlmapping";
import { LocalsObject } from "pug";
import { URL } from "url";
const prefixLen = options.paths.statuses.System.length;

let lastConfig:LocalsObject;
let lastStatus:LocalsObject;
let lastTs=0;

export function getConfig():Promise<LocalsObject> {
    return ((lastConfig && ((Date.now()-lastTs)<options.requestRateLimit)) ?
        Promise.resolve(lastConfig) :
        espRequest({...options,path:options.paths.config,method:"post"})).then(config=>{
            lastTs=Date.now();            
            return lastConfig={config};
        })
}

export function getStatuses():Promise<LocalsObject> {
    return (lastStatus && ((Date.now()-lastTs)<options.requestRateLimit)) ?
        Promise.resolve(lastStatus) :
        Promise.allSettled(Object.entries(options.paths.statuses).map(path => espRequest({...options,path:path[1],method:"post"})
                                                                .then(status=>{return {path:path[0],status}})))
               .then(res=>lastStatus=res.filter(item=>item.status === "fulfilled" && (lastTs=Date.now()))
                                        .reduce((pv,item:any)=>{return {...pv,[item.value.path]:item.value.status}},
                                                    new Map<string,LocalsObject>()))
               .then(data=>{return {data}})
}

export function getStatus(res:Request):Promise<LocalsObject> {
    const url = new URL(res.req.url || "/status/app")
    const service = url.pathname.substring(prefixLen);
    return (lastStatus && ((Date.now()-lastTs)<options.requestRateLimit)) ?
        Promise.resolve(lastStatus[service]) :
        espRequest({...options,path:url.pathname,method:"post"})
            .then(status=>{return {path:url.pathname,status}})
}

export function files(res: Request):Promise<LocalsObject> {
    const url = getFolder();
    return new Promise<LocalsObject>((resolve,reject) => {
        try{
            const options:RequestOptions={
                hostname: host,
                path: `/${url}`,
                method: "post",
                protocol: "http:",
                port:80
            };
            request(options, res => {
                let data = "";
                res.on("data",chunk => data+=chunk.toString());
                res.on("end",()=>res.statusCode === 200 ? 
                                resolve(packageData(data)) :
                                reject({statusCode:res.statusCode,statusMessage:res.statusMessage??"",error:data.toString()}))
                res.on("error",(err:Error)=>reject({statusCode:res.statusCode,statusMessage:err.message,error:data.toString()}))

                function packageData(data: string): LocalsObject {
                    const obj = JSON.parse(data);
                    const parentFolder = url.substring(0,url.lastIndexOf("/")).replace("files","files/").replace("//","/");
                    res.headers = {
                        ...res.headers,
                        Cookies: `folder=${url}`
                    };
                    return { url,
                             espAddress:host,
                             parentFolder,
                             headers: {
                                "Set-Cookie": `espfolder=${url}`
                             },
                             folders: obj.filter((item:EspFile)=>item.ftype === "folder"), 
                             files: obj.filter((item:EspFile)=>item.ftype === "file") 
                            };
                }
            }).on("error",reject).end();
        } catch(err) {
            reject(err);
        }
    });

    function getFolder(): string {
        const cookieLoc = res.req.headers.cookie?.split(";")
                                                 .map(cookie=>cookie.split("="))
                                                 .filter(cookie => cookie.length === 2 && (cookie[0].trim().localeCompare("espfolder") === 0))
                                                 .reduce((pv,cv)=>cv[1] ? cv[1] : pv,"") ?? "/"
        return res.req.headers?.espfolder ? `files${res.req.headers.espfolder}` : `files${cookieLoc}`
    }
}

function espRequest(options: RequestOptions): Promise<LocalsObject> {
    return new Promise((resolve, reject) => {
        try {
            request(options, res => {
                let data:Buffer = Buffer.from("");
                res.on("data", chunk => data.length === 0 ? data = Buffer.from(chunk) : 
                                                            data = Buffer.concat([data,chunk]));
                res.on("end", () => {
                    if (res.statusCode === 200) { 
                        try {
                            resolve(JSON.parse(data.toString()));
                        } catch (ex) {
                            reject({ex,options});
                        }
                    } else {
                        reject({ res, error: data.toString(),options });
                    }
                })
                res.on("error", error=>reject({error,options}));
            }).on("error", error=>reject({error,options})).end();
        } catch (err) {
            reject(err);
        }
    });
}
