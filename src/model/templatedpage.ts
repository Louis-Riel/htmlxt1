import { OutgoingHttpHeader } from "http";

export interface TemplatedPage {
    page: string|Buffer,
    headers?: OutgoingHttpHeader[]
}