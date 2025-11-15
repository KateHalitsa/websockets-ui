import { httpServer } from "./src/http_server/index.js";
import {initWsServer} from "./src/ws_server/index.js";

const HTTP_PORT = 8181;
const WS_PORT = 3001;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

console.log(`Start websocket server on the ${WS_PORT} port!`);
initWsServer(WS_PORT);