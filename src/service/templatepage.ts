import path from "path";
import * as pug from "pug"; 
import { TemplatedPage } from "../model/templatedpage";

export default function TemplatePage(template:string,data:Promise<pug.LocalsObject>,errorHandler:((err:any) => Promise<pug.LocalsObject>)|undefined = undefined):Promise<TemplatedPage> {
    return new Promise<TemplatedPage>((resolve,reject) => {
        try{
            const templates:Map<string,pug.compileTemplate> = new Map([]);
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
                reject(new Error("Cannot load "+template))
            }
        } catch(err:any) {
            reject(new Error(err.code === "ENOENT" ? `${template} template not found` : err.message ?? JSON.stringify(err)));
        }    
    })
}