import { OutgoingHttpHeader } from "http";

export interface TemplatedPage {
    page: string,
    headers?: OutgoingHttpHeader[]
}