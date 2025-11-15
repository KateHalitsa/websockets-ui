import { games } from "../../db/games.js";
import { wss } from "../index.js";
import { processAttack } from "../game_engine/engine.js";

/**
 * Обработка нормальной атаки
 */
export function handleAttack(ws, data) {
    const { gameId, x, y, indexPlayer } = data;

    const game = games.get(gameId);
    if (!game) return;

    // Проверка хода
    if (game.currentPlayer !== indexPlayer) return;

    const result = processAttack(game, indexPlayer, x, y);

    broadcastAttack(game, indexPlayer, x, y, result);

    if (result !== "shot" && result !== "killed") {
        switchTurn(game);
    }

    sendTurnInfo(game);
}

/**
 * Обработка randomAttack
 */
export function handleRandomAttack(ws, data) {
    const { gameId, indexPlayer } = data;

    const game = games.get(gameId);
    if (!game) return;

    if (game.currentPlayer !== indexPlayer) return;

    const [x, y] = getRandomFreeCell(game, indexPlayer);

    const result = processAttack(game, indexPlayer, x, y);

    broadcastAttack(game, indexPlayer, x, y, result);

    if (result !== "shot" && result !== "killed") {
        switchTurn(game);
    }

    sendTurnInfo(game);
}

/**
 * Отправка события атаки двум игрокам
 */
function broadcastAttack(game, playerId, x, y, result) {
    const payload = JSON.stringify({
        type: "attack",
        data: {
            position: { x, y },
            currentPlayer: playerId,
            status: result
        },
        id: 0
    });

    for (const p of game.players) {
        if (p.ws.readyState === 1) p.ws.send(payload);
    }
}

/**
 * Смена хода
 */
function switchTurn(game) {
    const [p1, p2] = game.players;

    game.currentPlayer =
        game.currentPlayer === p1.id ? p2.id : p1.id;
}

/**
 * Отправка turn
 */
function sendTurnInfo(game) {
    const payload = JSON.stringify({
        type: "turn",
        data: { currentPlayer: game.currentPlayer },
        id: 0
    });

    for (const p of game.players) {
        if (p.ws.readyState === 1) p.ws.send(payload);
    }
}

/**
 * Находим случайную свободную клетку
 * (временная заглушка — позже заменим нормальной логикой)
 */
function getRandomFreeCell(game, playerId) {
    while (true) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        return [x, y];
    }
}
