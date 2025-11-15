import { rooms } from "../../db/rooms.js";
import { wss } from "../index.js";

let roomCounter = 1;

/**
 * Создаем комнату
 */
export function handleCreateRoom(ws) {
    const roomId = roomCounter++;

    rooms.set(roomId, {
        players: [
            {
                ws,
                // name будет добавлен после регистрации
                name: ws.playerName || "unknown",
                index: ws.playerName || Math.random().toString(36).slice(2)
            }
        ],
        gameId: null
    });

    broadcastRooms();
}

/**
 * Добавляем игрока в комнату
 */
export function handleAddUserToRoom(ws, data) {
    const { indexRoom } = data;
    const room = rooms.get(indexRoom);

    if (!room) return;

    // Комната должна быть свободной (1 игрок)
    if (room.players.length >= 2) return;

    room.players.push({
        ws,
        name: ws.playerName,
        index: ws.playerName
    });

    broadcastRooms();

    // Когда двое — создаём игру
    createGameForRoom(room, indexRoom);
}

/**
 * Рассылаем обновление списка комнат всем игрокам
 */
export function broadcastRooms() {
    const list = [];

    for (const [id, room] of rooms.entries()) {
        if (room.players.length === 1) {
            list.push({
                roomId: id,
                roomUsers: room.players.map((p) => ({
                    name: p.name,
                    index: p.index
                }))
            });
        }
    }

    const payload = JSON.stringify({
        type: "update_room",
        data: list,
        id: 0
    });

    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(payload);
    });
}

/**
 * Создание игры (после заполнения комнаты)
 */
function createGameForRoom(room, roomId) {
    const idGame = "game_" + roomId + "_" + Date.now();

    // Два игрока
    const [p1, p2] = room.players;

    const gameData = {
        idGame,
        players: [
            {
                id: "p1_" + idGame,
                ws: p1.ws,
                name: p1.name
            },
            {
                id: "p2_" + idGame,
                ws: p2.ws,
                name: p2.name
            }
        ],
        ships: {},
        board: {},
        currentPlayer: null
    };

    // Сохраняем игру в комнату
    room.gameId = idGame;

    const response1 = JSON.stringify({
        type: "create_game",
        data: {
            idGame,
            idPlayer: gameData.players[0].id
        },
        id: 0
    });

    const response2 = JSON.stringify({
        type: "create_game",
        data: {
            idGame,
            idPlayer: gameData.players[1].id
        },
        id: 0
    });

    p1.ws.send(response1);
    p2.ws.send(response2);
}
