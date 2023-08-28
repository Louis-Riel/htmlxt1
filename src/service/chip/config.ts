import { RequestOptions, request } from "http";
import * as pug from "pug";
import { host,requestRateLimit } from "../../config/downstream.json"

let lastValue:pug.LocalsObject;
let lastTs=0;
export default async function config():Promise<pug.LocalsObject> {
    if (lastValue && ((Date.now()-lastTs)<requestRateLimit)) {
        process.stdout.write(".");
        return Promise.resolve(lastValue);
    }
    return new Promise((resolve,reject)=> {
        try{
            const options:RequestOptions={
                hostname: host,
                path: "/config/",
                method: "post",
                protocol: "http:",
                port:80
            };
            request(options, res => {
                let data = "";
                lastTs=Date.now();
                res.on("data",chunk => data+=chunk.toString());
                res.on("end",()=>res.statusCode === 200 ? resolve(lastValue={config:JSON.parse(data)}) : 
                                                          reject(lastValue={code:res.statusCode,message:res.statusMessage,error:data.toString()}))
                res.on("error",reject)
            }).on("error",reject).end();
        } catch(err) {
            reject(err);
        }})
    }