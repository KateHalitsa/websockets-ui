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

    if (!ws.playerName || !ws.playerIndex) return; // игрок должен быть зарегистрирован
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse data JSON:", e);
            return;
        }
    }
    console.log("Data received in add_user_to_room:", data);
    console.log("indexRoom:", data.indexRoom, "typeof indexRoom:", typeof data.indexRoom);

    const { indexRoom }= data;

    const roomId = Number(data.indexRoom);
    console.log("Current rooms keys (types):", Array.from(rooms.entries()).map(([k, v]) => [k, typeof k]));

    const room = rooms.get(roomId);
    if (!room) {
        console.error(`Room with id ${indexRoom} not found. Available rooms:`, Array.from(rooms.keys()));
        return;
    }


    if (!room) return;
    console.log("Check");
    // Комната должна быть свободной (1 игрок)
    if (room.players.length >= 2) return;
    console.log("ROOM UPDATED1:", indexRoom, room.players.map(p => p.name));

    room.players.push({
        ws,
        name: ws.playerName,
        index: ws.playerIndex
    });
    console.log("ROOM UPDATED2:", indexRoom, room.players.map(p => p.name));

    broadcastRooms();
    console.log("CHECK CREATE GAME:", room.players.length);
    // Когда двое — создаём игру

    if (room.players.length === 2) {
        createGameForRoom(room, indexRoom);
    }

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
        data: JSON.stringify(list),
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

    /*const gameData = {
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
    };*/

    // Сохраняем игру в комнату
    room.gameId = idGame;
    console.log("CREATE GAME >>>", idGame, "Players:", p1.name, p2.name);

    const payload1 = JSON.stringify({
        type: "create_game",
        data: JSON.stringify({ idGame, idPlayer: "p1_" + idGame }),
        id: 0
    });
    const payload2 = JSON.stringify({
        type: "create_game",
        data: JSON.stringify({ idGame, idPlayer: "p2_" + idGame }),
        id: 0
    });

    if (p1.ws.readyState === 1) {
        p1.ws.send(payload1);
        console.log("Sent create_game to", p1.name);
    } else {
        console.log("Cannot send to", p1.name, "state=", p1.ws.readyState);
    }

    if (p2.ws.readyState === 1) {
        p2.ws.send(payload2);
        console.log("Sent create_game to", p2.name);
    } else {
        console.log("Cannot send to", p2.name, "state=", p2.ws.readyState);
    }

/*
    // Рассылаем create_game каждому игроку
    p1.ws.send(JSON.stringify({
        type: "create_game",
        data: {
            idGame,
            idPlayer: gameData.players[0].id
        },
        id: 0
    }));

    p2.ws.send(JSON.stringify({
        type: "create_game",
        data: {
            idGame,
            idPlayer: gameData.players[1].id
        },
        id: 0
    }));*/
}

