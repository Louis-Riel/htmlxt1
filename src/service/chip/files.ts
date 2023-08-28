import { IncomingMessage, RequestOptions, ServerResponse, request } from "http";
import * as pug from "pug";
import { host } from "../../config/downstream.json"
import { EspFile } from '../../model/espfile';
import { Request } from "../../model/urlmapping";

export default async function files(res: Request):Promise<pug.LocalsObject> {
    const url = getFolder();
    return new Promise<pug.LocalsObject>((resolve,reject) => {
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

                function packageData(data: string): pug.LocalsObject {
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