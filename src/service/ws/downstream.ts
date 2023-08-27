import WebSocket from 'ws';
import { Downstream } from '../../model/config/downstream';
import WebSocketLink from '../../model/wssession';

const downstream:Downstream = require('../../config/downstream.json')

const esps:Map<string,WebSocket> = new Map<string,WebSocket>();
export default function ServiceSession(clients:Map<WebSocket,WebSocketLink>):Promise<WebSocket> {
    const url = `ws://${downstream.host}:${downstream.ws.port}/${downstream.ws.path}`;
    if (esps.get(url)?.readyState === WebSocket.OPEN) {
        return Promise.resolve(esps.get(url) as WebSocket);
    } else {
        console.log("Connecting to esp at",url);
        return new Promise<WebSocket>((resolve,reject)=>{
            const service = new WebSocket(url);
            esps.set(url,service);
            service.onopen = (event)=>{event.target.send("Connected",err=>err?reject(err):resolve(event.target))};
            service.onerror = (err)=>reject(err);
        })
    }
}
