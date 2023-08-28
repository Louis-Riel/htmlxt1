import { RequestOptions, request } from "http";
import * as pug from "pug";
import { host,requestRateLimit } from "../../config/downstream.json"

let lastValue:pug.LocalsObject;
let lastTs=0;
export default async function status():Promise<pug.LocalsObject> {
    if (lastValue && ((Date.now()-lastTs)<requestRateLimit)) {
        process.stdout.write(".");
        return Promise.resolve(lastValue);
    }
    return Promise.allSettled(["/status/","/status/app","/status/tasks","/status/mallocs","/status/repeating_tasks"].map(url =>
        new Promise((resolve,reject)=> {
            try{
                const options:RequestOptions={
                    hostname: host,
                    path: url,
                    method: "post",
                    protocol: "http:",
                    port:80
                };
                request(options, res => {
                    let data = "";
                    lastTs=Date.now();
                    res.on("data",chunk => data+=chunk.toString());
                    res.on("end",()=>res.statusCode === 200 ? resolve(packageData(data)) : reject({code:res.statusCode,message:res.statusMessage,error:data.toString()}))
                    res.on("error",reject)

                    function packageData(data: string): pug.LocalsObject | PromiseLike<pug.LocalsObject> {
                        return {status:JSON.parse(data),url};
                    }
                }).on("error",reject).end();
            } catch(err) {
                reject(err);
            }
        }))).then(res=>lastValue=res.filter(item=>item.status === "fulfilled")
                                    .reduce((pv,item:any)=>item.value.url === "/status/" ? 
                                        {...pv,status:item.value.status}:
                                        {...pv,[item.value.url.substring(8)]:item.value.status},{}))
    }