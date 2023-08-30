import { RequestOptions, request } from "http";
import * as pug from "pug";

export function espRequest(options: RequestOptions): Promise<pug.LocalsObject> {
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
