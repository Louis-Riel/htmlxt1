export interface WebService {
	port: number;
	path: string;
}

export interface Downstream {
	host: string;
	ws: WebService;
}