import { RequestOptions, request } from "http";
import * as pug from "pug";
import { espAddress } from "../../config/config.json"

export default async function config():Promise<pug.LocalsObject> {
    return new Promise((resolve,reject)=> {
            try{
                const options:RequestOptions={
                    hostname: espAddress,
                    path: "/config/",
                    method: "post",
                    protocol: "http:",
                    port:80
                };
                request(options, res => {
                    let data = "";
                    res.on("data",chunk => data+=chunk.toString());
                    res.on("end",()=>res.statusCode === 200 ? resolve({config:JSON.parse(data)}) : reject({code:res.statusCode,message:res.statusMessage,error:data.toString()}))
                    res.on("error",reject)
                }).on("error",reject).end();
            } catch(err) {
                reject(err);
            }
        })
    }