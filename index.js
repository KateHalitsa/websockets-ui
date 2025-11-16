import { httpServer } from "./src/http_server/index.js";
import { startWsServer} from "./src/ws_server/index.js";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

startWsServer(httpServer);
/*console.log(`Start websocket server on the ${WS_PORT} port!`);
initWsServer(WS_PORT);*/