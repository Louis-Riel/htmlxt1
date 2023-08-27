import server from "./controllers/index";
import {listenPost} from "./config/webServer.json"
import WSProxy from "./service/ws/proxy";


WSProxy(server.listen(listenPost, () => {
   console.log("Server is running on port",listenPost,"Go to http://localhost:"+listenPost+"/")
}));

