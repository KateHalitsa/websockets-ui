import { WebSocketServer } from "ws";

import { handlePlayerReg } from "./handlers/player.js";
import { handleCreateRoom, handleAddUserToRoom } from "./handlers/rooms.js";
import { handleAddShips } from "./handlers/ships.js";
import { handleAttack, handleRandomAttack } from "./handlers/game.js";

export let wss = null;

export function startWsServer() {
    const PORT = 3000;

    wss = new WebSocketServer({ port: PORT });

    console.log(`WebSocket server started on ws://localhost:${PORT}/`);

    wss.on("connection", (ws) => {
        ws.on("message", (msg) => {
            let data;

            try {
                data = JSON.parse(msg);
            } catch (err) {
                console.log("Invalid JSON");
                return;
            }

            console.log("WS RECEIVED:", data.type);

            switch (data.type) {
                case "reg":
                    handlePlayerReg(ws, data.data);
                    break;

                case "create_room":
                    handleCreateRoom(ws);
                    break;

                case "add_user_to_room":
                    handleAddUserToRoom(ws, data.data);
                    break;

                case "add_ships":
                    handleAddShips(ws, data.data);
                    break;

                case "attack":
                    handleAttack(ws, data.data);
                    break;

                case "randomAttack":
                    handleRandomAttack(ws, data.data);
                    break;
            }
        });

        ws.on("close", () => {
            console.log("Client disconnected");
        });
    });
}
