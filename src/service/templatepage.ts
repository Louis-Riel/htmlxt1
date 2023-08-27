import path from "path";
import * as pug from "pug"; 
import { TemplatedPage } from "../model/templatedpage";
const test = (err:any):Promise<pug.LocalsObject>=>{
    return new Promise<pug.LocalsObject>(()=>{});
};
export default function TemplatePage(template:string,data:Promise<pug.LocalsObject>,errorHandler:((err:any) => Promise<pug.LocalsObject>)|undefined = undefined):Promise<TemplatedPage> {
    const templates:Map<string,pug.compileTemplate> = new Map([]);
    return new Promise<TemplatedPage>((resolve,reject) => {
        try{
            !Array.from(templates.keys()).includes(template) && 
                templates.set(template,pug.compileFile(path.join(__dirname, "../..", "views","components",template)));
    
            const tmpl = templates.get(template);
            if (tmpl !== undefined) {
                data.then(res=>resolve({page:tmpl(res),headers:res.headers}))
                    .catch(err => {
                        if (errorHandler) {
                            errorHandler(err)
                                .then(res=>resolve({page:tmpl(res),headers:res.headers}))
                                .catch(err=>reject(err))
                        } else {
                            reject(err);
                        }
                    });
            } else {
                reject({error:"Cannot load",template})
            }
        } catch(err:any) {
            reject({
                statusCode:err.code === "ENOENT" ? "404" : "500",
                statusMessage: err.code === "ENOENT" ? `${template} template not found` : err.message ?? JSON.stringify(err)
            });
        }    
    })
}