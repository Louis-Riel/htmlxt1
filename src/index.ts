import server from "./controllers/index";
import {listenPost} from "./config/config.json"

server.listen(listenPost, () => {
   console.log("Server is running on port",listenPost,"Go to http://localhost:"+listenPost+"/")
});

