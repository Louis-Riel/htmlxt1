import * as options from "../../config/downstream.json"
import { RequestOptions, request } from "http";
import { host } from "../../config/downstream.json"
import { EspFile } from '../../model/espfile';
import { Request } from "../../model/urlmapping";
import { LocalsObject } from "pug";

export function getConfig():Promise<LocalsObject> {
    return espRequest({...options,path:options.paths.config,method:"post"},undefined)
            .then(config => {return {config}})
}

export function getStatuses():Promise<LocalsObject> {
    return Promise.allSettled(Object.entries(options.paths.statuses).map(path => espRequest({...options,path:path[1],method:"post"},undefined)
                                                                 .then(status=>{return {path:path[0],status}})))
               .then(res=>res.filter(item=>item.status === "fulfilled")
                             .reduce((pv,item:any)=>{return {...pv,[item.value.path]:item.value.status}},new Map<string,LocalsObject>()))
               .then(data=>{return {data}})
}

export function getStatus(res:Request):Promise<LocalsObject> {
    return espRequest({...options,path:res.req.url?.substring(5),method:"post"},undefined).then(data=>{return{data}})
}

export function sendCommand(cmd:string) {
    return new Promise((resolve,reject) => {
        if (cmd.length) {
            espRequest({
                host: options.host,
                port: options.port,
                path: "/status/cmd",
                method: "PUT"
            },Buffer.from(JSON.stringify(cmd.split("&").reduce((ret,param)=>{
                const part=param.split("=");
                ret[part[0]]=part[1];
                return ret
            },{} as any)))).then(resolve).catch(err=>err.message === `Unexpected token 'O', "OK" is not valid JSON` ? resolve("OK") : reject(err))
        } else {
            reject(new Error("Missing command"));
        }
    })
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
                                reject(new Error(res.statusMessage)))
                res.on("error",reject)

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

const requestCache:Map<string,[number,LocalsObject]> = new Map<string,[number,LocalsObject]>()

function espRequest(roptions: RequestOptions,body:Buffer|undefined): Promise<LocalsObject> {
    const cacheKey = JSON.stringify(roptions);
    return (requestCache.has(cacheKey) && ((Date.now()-(requestCache.get(cacheKey)?.[0]??0)) < options.requestRateLimit)) ?
        Promise.resolve(requestCache.get(cacheKey)?.[1] ?? {}) :
        new Promise((resolve, reject) => {
            const req = request(roptions, res => {
                let data:Buffer = Buffer.from("");
                res.on("data", chunk => data = data.length === 0 ? Buffer.from(chunk) : 
                                                                   Buffer.concat([data,chunk]));
                res.on("end", () => {
                    if (res.statusCode === 200) { 
                        try {
                            console.log(roptions.method,roptions.path,requestCache.size)
                            requestCache.set(cacheKey,[Date.now(),JSON.parse(data.toString())]);
                            resolve(requestCache.get(cacheKey)?.[1] ?? {});
                        } catch (ex) {
                            reject(ex);
                        }
                    } else {
                        reject(new Error(res.statusMessage));
                    }
                })
                res.on("error", reject);
            }).on("error", reject)
            body && req.write(body);
            req.end()
        });
}
