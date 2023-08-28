import { LocalsObject } from "pug";
import { TemplatedPage } from "./templatedpage";
import { ServerResponse, IncomingMessage } from "http";
import http from "http";

export interface UrlMapping {
	template?: (res:Request)=>string;
    renderer?:(res: Request) => Promise<TemplatedPage>;
	equals?: string;
    startsWith?: string;
    endsWith?: string;
    lastIndexIsZero?: string;
    datas: ((res:Request)=>Promise<LocalsObject>)[];
    errorHandler?:((err:any) => Promise<LocalsObject>);
}

export interface MappedUrl {
    mapping: UrlMapping;
    page: Promise<LocalsObject>;
}

export type Request = http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage;
 };
 
 