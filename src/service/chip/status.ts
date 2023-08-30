import * as pug from "pug";
import * as options from "../../config/downstream.json"
import { espRequest } from "./espRequest";
import { LocalsObject } from 'pug';

let lastValue:pug.LocalsObject;
let lastTs=0;
const statuses = ["/status/", "/status/app", "/status/tasks", "/status/mallocs", "/status/repeating_tasks"];

export default async function status():Promise<pug.LocalsObject> {
    return (lastValue && ((Date.now()-lastTs)<options.requestRateLimit)) ?
        Promise.resolve(lastValue) :
        Promise.allSettled(statuses.map(path => espRequest({...options,path,method:"post"}).then(status=>{return {path,status}})))
               .then(res=>lastValue=res.filter(item=>item.status === "fulfilled" && (lastTs=Date.now()))
                                       .reduce((pv,item:any)=>item.value.path === "/status/" ? 
                                               {...pv,status:item.value.status}:
                                               {...pv,[item.value.path.substring(8)]:item.value.status},
                                               new Map<string,LocalsObject>()))
}