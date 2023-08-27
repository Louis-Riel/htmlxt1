import WebSocket from 'ws';

import * as downstream from '../../config/downstream.json'

export default function ServiceSession():Promise<WebSocket> {
    const url = `ws://${downstream.host}:${downstream.ws.port}/${downstream.ws.path}`;
    console.log("Connecting to esp at",url);
    return new Promise<WebSocket>((resolve,reject)=>{
        const service = new WebSocket(url);
        service.onopen = (event)=>{event.target.send("Connected",err=>err?reject(err):resolve(event.target))};
    })
}
