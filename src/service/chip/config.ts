import * as pug from "pug";
import * as options from "../../config/downstream.json"
import { espRequest } from "./espRequest";

let lastValue:pug.LocalsObject;
let lastTs=0;

export default function getConfig():Promise<pug.LocalsObject> {
    return ((lastValue && ((Date.now()-lastTs)<options.requestRateLimit)) ?
        Promise.resolve(lastValue) :
        espRequest({...options,path:options.paths.config,method:"post"})).then(config=>{
            lastTs=Date.now();            
            return lastValue={config};
        })
}