import WebSocket, { WebSocketServer } from 'ws';
import http, { IncomingMessage } from 'http';

export interface WsConfig {
	path: string;
	maxSessions: number;
	timeout: number;
	webSocketServer: WebSocket.ServerOptions<typeof WebSocket, typeof http.IncomingMessage>;
}