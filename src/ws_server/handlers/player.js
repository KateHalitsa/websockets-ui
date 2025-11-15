import { players,winners } from "../../db/players.js";
import { wss } from "../index.js";

/**
 * Регистрация или логин
 */
export function handlePlayerReg(ws, data) {
    const { name } = JSON.parse(data);

    if (!name) {
        ws.send(JSON.stringify({
            type: "reg",
            data: JSON.stringify({ error: true, errorText: "Имя не задано" }),
            id: 0
        }));
        return;
    }

    // Генерируем уникальный индекс игрока
    const index = Math.random().toString(36).slice(2);

    ws.playerName = name;   // важно!
    ws.playerIndex = index; // важно!

    ws.send(JSON.stringify({
        type: "reg",
        data: JSON.stringify({ name, error: false, errorText: "" }),
        id: 0
    }));
}

/**
 * Отправка winners всем игрокам
 */
export function broadcastWinners() {
    const data = JSON.stringify({
        type: "update_winners",
        data: JSON.stringify(winners),
        id: 0
    });

    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(data);
        }
    });
}
