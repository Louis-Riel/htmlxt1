import { Socket } from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import { Downstream } from './config/downstream';

export interface ClientSession {
    listener: WebSocketServer;
    socket: Socket;
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