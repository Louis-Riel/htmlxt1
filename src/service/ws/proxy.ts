import WebSocket, { WebSocketServer } from 'ws';
import http, { IncomingMessage } from 'http';
import WebSocketLink from '../../model/wssession';
import { AddressInfo, Socket } from 'net';
import TemplatePage from '../templatepage';
import ServiceSession from './downstream'
import { WsConfig } from '../../model/config/wsConfig';

export default function WSProxy(server:http.Server) {
    let timer:any;
    const wsConfig:WsConfig = require('../../config/wsServer.json')
    const clients:Map<WebSocket,WebSocketLink> = new Map<WebSocket,WebSocketLink>();
    console.log("Web Socket Running");
    function WebSocketLink(request:IncomingMessage,socket: Socket, head: Buffer) {
        if (request.url === wsConfig.path) {
            if (clients.size < wsConfig.maxSessions) {
                console.log(socket.remoteAddress,"Connecting");
                ServiceSession()
                    .then(GetLink())
                    .then(link=>link.client.listener.handleUpgrade(request, socket, head, pipe(link)))
                    .catch(err=>console.error("ServiceSession",err))
            } else {
                console.error("No more sessions");
            }

            !timer && (timer=setInterval(()=>{
                Array.from(clients.entries())
                     .filter(link=>link[1].client.connected)
                     .filter(link=>((Date.now()-link[1].client.lastts) > wsConfig.timeout))
                     .forEach(link=>CloseLink({error:"Timeout",diff:Date.now()-link[1].client.lastts},link[1]))
            },wsConfig.timeout));
        } else {
            console.error("Invalid path",request.url);
            socket.destroy();
        }

        function CloseLink(err:any,link:WebSocketLink): void {
            if (link.service && 
                ((link.service.readyState === WebSocket.OPEN) || (link.service.readyState === WebSocket.CONNECTING))) {
                link.service.close();
                console.log("service connection closed")
            }

            if ((link.client.socket.readyState === 'open') || (link.client.socket.readyState === 'opening')) {
                console.log("client",(link.client.socket.address() as AddressInfo).address,"connection closed");
                link.client.socket.destroy();
            }
            link.client.connected=(link.client.socket.readyState === 'open') || (link.client.socket.readyState === 'opening');
            console.log("Now at",clients.size,"sessions",Array.from(clients.values()).filter(link=>link.client.connected).length,"connected");
        }

        function pipe(link: WebSocketLink): (client: WebSocket, request: http.IncomingMessage) => void {
            return ws => {
                clients.set(ws, link);
                link.client.socket = socket;
                link.client.connected = true;
                ws.onmessage = (event: WebSocket.MessageEvent) => pipeMessage(link.service, event, false);
                link.service.onmessage = (event: WebSocket.MessageEvent) => Array.from(clients.values())
                            .filter(link => link.client.connected)
                            .forEach(link => pipeMessage(ws, event, true));
                ws.onerror = err => CloseLink(err, link);
                link.service.onerror = err => CloseLink(err, link);
                console.log("Link established, now at",clients.size,"sessions",Array.from(clients.values()).filter(link=>link.client.connected).length,"connected");
            };
        }

        function GetLink(): ((value: WebSocket) => WebSocketLink) {
            return service => {
                const client = Array.from(clients).find(item=>!item[1].client.connected)
                if (client?.[1]?.client?.listener) {
                    const wsServer = client[1].client.listener;
                    clients.delete(client[0]);
                    return {
                        client: {
                            socket,
                            sent: 0,
                            receive: 0,
                            infailed: 0,
                            outfailed: 0,
                            lastts: 0,
                            connected: false,
                            listener: wsServer
                        }, service
                    } as WebSocketLink;
                } else {
                    return {
                        client: {
                            socket,
                            sent: 0,
                            receive: 0,
                            infailed: 0,
                            outfailed: 0,
                            lastts: 0,
                            connected: false,
                            listener: new WebSocketServer(wsConfig.webSocketServer)
                        }, service
                    } as WebSocketLink;
                }
            };
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
                            const message = event.data.toString().trim();
                            incomming ? link.client.receive++ : link.client.sent++;
                            link.client.lastts = Date.now();
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