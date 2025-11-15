import { players,winners } from "../../db/players.js";
import { wss } from "../index.js";

/**
 * Регистрация или логин
 */
export function handlePlayerReg(ws, data) {
    const { name, password } = data;

    let player = players.find((p) => p.name === name);

    let response;

    if (!player) {
        // новый игрок
        player = {
            name,
            password,
            index: Date.now().toString()
        };
        players.push(player);

        response = {
            type: "reg",
            data:JSON.stringify({
                name,
                index: player.index,
                error: false,
                errorText: ""
            }),
            id: 0
        };
    } else {
        // игрок уже существует — проверяем пароль
        if (player.password !== password) {
            response = {
                type: "reg",
                data: {
                    name,
                    index: "",
                    error: true,
                    errorText: "Wrong password"
                },
                id: 0
            };
        } else {
            response = {
                type: "reg",
                data: {
                    name,
                    index: player.index,
                    error: false,
                    errorText: ""
                },
                id: 0
            };
        }
    }

    // отправляем ЛИЧНЫЙ ответ
    ws.send(JSON.stringify(response));

    // обновляем таблицу победителей
    broadcastWinners();
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
