import { WebSocketServer } from "ws";

// handlers
import { handlePlayerReg, broadcastWinners } from "./handlers/player.js";
import { handleCreateRoom, handleAddUserToRoom, broadcastRooms } from "./handlers/rooms.js";
import { handleAddShips } from "./handlers/ships.js";
import { handleAttack, handleRandomAttack } from "./handlers/game.js";

export let wss = null;

export const connections = new Set(); // все клиенты (ws)

export function initWsServer(port) {
    wss = new WebSocketServer({ port });

    wss.on("connection", (ws) => {
        console.log("Client connected");
        connections.add(ws);

        ws.on("message", async (msg) => {
            let parsed;
            try {
                parsed = JSON.parse(msg);
            } catch {
                console.log("Invalid JSON:", msg);
                return;
            }

            console.log("RECEIVED:", parsed);

            const { type, id, data } = parsed;

            switch (type) {
                case "reg":
                    handlePlayerReg(ws, data);
                    break;

                case "create_room":
                    handleCreateRoom(ws);
                    break;

                case "add_user_to_room":
                    handleAddUserToRoom(ws, data);
                    break;

                case "add_ships":
                    handleAddShips(ws, data);
                    break;

                case "attack":
                    handleAttack(ws, data);
                    break;

                case "randomAttack":
                    handleRandomAttack(ws, data);
                    break;

                default:
                    console.log("Unknown command:", type);
            }
        });

        ws.on("close", () => {
            connections.delete(ws);
            console.log("Client disconnected");

            // обновляем комнаты для всех
            broadcastRooms();
        });
    });
}
