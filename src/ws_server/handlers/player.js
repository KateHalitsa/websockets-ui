import { players } from "../../db/players.js";
import { wss } from "../index.js";

/**
 * Регистрация или логин
 */
export function handlePlayerReg(ws, data) {
    const { name, password } = data;

    // игрок не существует → создаём
    if (!players.has(name)) {
        players.set(name, { password, wins: 0 });

        ws.playerName = name;

        ws.send(JSON.stringify({
            type: "reg",
            data: {
                name,
                index: name,
                error: false,
                errorText: ""
            },
            id: 0
        }));

        broadcastWinners();
        return;
    }

    // игрок есть, проверяем пароль
    const player = players.get(name);

    if (player.password !== password) {
        ws.send(JSON.stringify({
            type: "reg",
            data: {
                name,
                index: null,
                error: true,
                errorText: "Wrong password"
            },
            id: 0
        }));
        return;
    }

    // успешный логин
    ws.playerName = name;

    ws.send(JSON.stringify({
        type: "reg",
        data: {
            name,
            index: name,
            error: false,
            errorText: ""
        },
        id: 0
    }));

    broadcastWinners();
}

/**
 * Отправка таблицы победителей ВСЕМ игрокам
 */
export function broadcastWinners() {
    const winnersArray = [];

    for (const [name, data] of players.entries()) {
        winnersArray.push({ name, wins: data.wins });
    }

    const message = JSON.stringify({
        type: "update_winners",
        data: winnersArray,
        id: 0
    });

    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(message);
    });
}
