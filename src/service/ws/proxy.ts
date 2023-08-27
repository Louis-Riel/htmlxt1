import WebSocket, { WebSocketServer } from 'ws';
import http, { IncomingMessage } from 'http';
import WebSocketLink from '../../model/wssession';
import { AddressInfo, Socket } from 'net';
import TemplatePage from '../templatepage';
import ServiceSession from './downstream'
import { WsConfig } from '../../model/config/wsServer';

export default function WSProxy(server:http.Server) {
    let timer:any;
    const wsConfig:WsConfig = require('../../config/wsServer.json')
    const clients:Map<WebSocket,WebSocketLink> = new Map<WebSocket,WebSocketLink>();
    console.log("Web Socket Running");
    function WebSocketLink(request:IncomingMessage,socket: Socket, head: Buffer) {
        if (request.url === wsConfig.path) {
            if (clients.size < wsConfig.maxSessions) {
                GetLink().then(link=>link.client.listener.handleUpgrade(request, socket, head, pipe(link)))
                         .catch(err=>console.error("ServiceSession",err))
            } else {
                console.error("No more sessions");
            }

            !timer && (timer=setInterval(()=>{
                Array.from(clients.entries())
                     .filter(link=>link[1].client.connected)
                     .filter(link=>link[1].client.lastts)
                     .filter(link=>((Date.now()-link[1].client.lastts) > wsConfig.timeout))
                     .forEach(link=>CloseLink({error:"Timeout",diff:Date.now()-link[1].client.lastts},link[1]))
            },wsConfig.timeout));
        } else {
            console.error("Invalid path",request.url);
            socket.destroy();
        }

        function CloseLink(err:any,link:WebSocketLink): void {
            if ((link.client.socket.readyState === 'open') || (link.client.socket.readyState === 'opening')) {
                console.log("client",(link.client.socket.address() as AddressInfo).address,"connection closed",err);
                link.client.socket.destroy();
            }
            link.client.connected=(link.client.socket.readyState === 'open') || (link.client.socket.readyState === 'opening');
            console.log("Now at",clients.size,"sessions",Array.from(clients.values()).filter(link=>link.client.connected).length,"connected");

            if (!Array.from(clients.values()).filter(client=>client.client.connected).length &&
                link.service && 
                ((link.service.readyState === WebSocket.OPEN) || (link.service.readyState === WebSocket.CONNECTING))) {
                link.service.close();
                console.log("service connection closed",err)
            }
        }

        function pipe(link: WebSocketLink): (client: WebSocket, request: http.IncomingMessage) => void {
            console.log(socket.remoteAddress,"Connecting");
            return ws => {
                clients.set(ws, link);
                link.client.socket = socket;
                link.client.ws = ws;
                link.client.connected = true;
                link.service.onmessage = (event) => Array.from(clients.values())
                                                         .filter(({client}) => client.connected && client.ws)
                                                         //.filter(()=>{console.log(event.type, event.data);return true;})
                                                         .forEach(({client}) => pipeMessage(client.ws as WebSocket,event,true))

                ws.onmessage = (event: WebSocket.MessageEvent) => pipeMessage(link.service, event, false);
                ws.onerror = err => CloseLink(err, link);
                console.log("Link established, now at",clients.size,"sessions",Array.from(clients.values()).filter(link=>link.client.connected).length,"connected");
            }
        }

        function GetLink(): Promise<WebSocketLink> {
            return new Promise<WebSocketLink>((resolve,reject)=>{
                ServiceSession(clients).then(service=>{
                    const client = Array.from(clients).find(item=>!item[1].client.connected)
                    const wsServer = client ? client[1]?.client?.listener : new WebSocketServer(wsConfig.webSocketServer);
                    client && clients.delete(client[0]);
                    resolve({
                        client: {
                            socket,
                            ws: undefined,
                            sent: 0,
                            receive: 0,
                            infailed: 0,
                            outfailed: 0,
                            lastts: 0,
                            connected: false,
                            listener: wsServer
                        }, service
                    });
                }).catch(reject);
            });
        }

        function pipeMessage(ws: WebSocket, event: WebSocket.MessageEvent, incomming: boolean): void {
            if (ws.readyState === WebSocket.OPEN)
                ws.send(event.data, processMessage());

            function processMessage(): ((err?: Error | undefined) => void) {
                return err => {
                    const link = Array.from(clients.entries()).find(client=>incomming?client[0]===ws:client[0]===event.target)?.[1];
                    if (link) {
                        if (err) {
                            incomming ? link.client.infailed++ : link.client.outfailed++;
                            console.error(err);
                        } else {
                            link.client.lastts=Date.now();
                            const message = event.data.toString().trim();
                            incomming ? link.client.receive++ : link.client.sent++;
                            if (incomming && message.length) {
                                const log = /^(\u001b[^m]+m)?([^\u001b]*)(\u001b.*)?$/g.exec(message)?.[2];
                                if (log) {
                                    const parts = /([IDVWE]?) ?(\(([0-9:]{3}[0-9:]{3}[0-9.]{6})\))? ?(.+): (.*)$/g.exec(log);
                                    if (parts?.length) {
                                        TemplatePage("logline.pug", Promise.resolve({
                                            loglevel: parts[1] ?? 'U',
                                            logdate: parts[3],
                                            logsrc: parts[4],
                                            logmsg: parts[5]
                                        })).then(page => ws.send(JSON.stringify({
                                            origin: "service",
                                            id: "logs",
                                            type: "logline",
                                            ...page
                                        }), err => err && console.error(err))).catch(console.error);
                                    }
                                }
                            }
                        }
                    }
                };
            }
        }
    }

    server.on("upgrade",WebSocketLink);
}