import { Socket } from 'net';
import WebSocket, { WebSocketServer } from 'ws';

export interface ClientSession {
    listener: WebSocketServer;
    socket: Socket;
    ws: WebSocket|undefined;
    sent: number;
    receive: number;
    infailed: number;
    outfailed: number;
    connected: boolean;
    lastts: number;
}

export default interface WebSocketLink {
    service:WebSocket,
    client:ClientSession
}