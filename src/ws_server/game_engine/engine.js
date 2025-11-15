/**
 * Game Engine for Battleship
 *
 * game.state = {
 *    players: [ { id, ws, name }, { ... } ],
 *    ships: {
 *      [playerId]: [{ position:{x,y}, direction, length, type }]
 *    },
 *    boards: {
 *      [playerId]: number[][]  // 0 empty, 1 ship, 2 miss, 3 shot, 4 killed
 *    },
 *    currentPlayer: "playerId"
 * }
 */

import { games } from "../../db/games.js";

/**
 * Главная функция — обрабатывает выстрел
 * Возвращает: "miss" | "shot" | "killed"
 */
export function processAttack(game, attackerId, x, y) {
    const defenderId = getOpponent(game, attackerId);

    const board = game.boards[defenderId];

    // уже было попадание в эту клетку
    if (board[y][x] === 2 || board[y][x] === 3 || board[y][x] === 4) {
        return "miss";
    }

    // пусто — промах
    if (board[y][x] === 0) {
        board[y][x] = 2; // miss
        return "miss";
    }

    // если тут корабль
    if (board[y][x] === 1) {
        board[y][x] = 3; // shot

        // проверяем — убит или просто ранен
        const isKilled = checkKilled(game, defenderId, x, y);

        if (isKilled) {
            markKilledShip(game, defenderId, x, y);
            const killed = isShipDestroyed(game, defenderId);

            if (killed) {
                // Игрок победил
                finishGame(game, attackerId);
            }

            return "killed";
        }

        return "shot";
    }
}

/**
 * Получаем ID соперника
 */
function getOpponent(game, playerId) {
    return game.players.find((p) => p.id !== playerId).id;
}

/**
 * Проверка: убит ли корабль полностью
 */
function checkKilled(game, defenderId, x, y) {
    const ships = game.ships[defenderId];

    for (const ship of ships) {
        const cells = getShipCells(ship);

        if (cells.some((c) => c.x === x && c.y === y)) {
            // проверяем все клетки корабля
            const board = game.boards[defenderId];
            return cells.every((c) => board[c.y][c.x] === 3);
        }
    }

    return false;
}

/**
 * Обводим убитый корабль контуром (miss вокруг)
 */
function markKilledShip(game, defenderId, killedX, killedY) {
    const ships = game.ships[defenderId];
    const board = game.boards[defenderId];

    for (const ship of ships) {
        const cells = getShipCells(ship);

        if (!cells.some((c) => c.x === killedX && c.y === killedY)) continue;

        // mark ship parts as killed
        for (const c of cells) {
            board[c.y][c.x] = 4; // killed
        }

        // mark contour
        const area = getShipContour(cells);

        for (const c of area) {
            if (board[c.y] && board[c.y][c.x] === 0) {
                board[c.y][c.x] = 2; // miss
            }
        }
    }
}

/**
 * Проверяем победу — все корабли уничтожены?
 */
function isShipDestroyed(game, defenderId) {
    const board = game.boards[defenderId];

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            if (board[y][x] === 1 || board[y][x] === 3) return false;
        }
    }
    return true;
}

/**
 * Завершение игры
 */
function finishGame(game, winnerId) {
    const payload = JSON.stringify({
        type: "finish",
        data: { winPlayer: winnerId },
        id: 0
    });

    for (const p of game.players) {
        if (p.ws.readyState === 1) {
            p.ws.send(payload);
        }
    }
}

/**
 * Получение всех клеток корабля
 */
function getShipCells(ship) {
    const { x, y } = ship.position;
    const dir = ship.direction;
    const length = ship.length;

    const cells = [];
    for (let i = 0; i < length; i++) {
        cells.push({
            x: dir ? x : x + i,
            y: dir ? y + i : y
        });
    }
    return cells;
}

/**
 * Клетки вокруг корабля
 */
function getShipContour(cells) {
    const area = [];

    for (const { x, y } of cells) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                area.push({ x: x + dx, y: y + dy });
            }
        }
    }

    // фильтруем границы
    return area.filter((c) => c.x >= 0 && c.x < 10 && c.y >= 0 && c.y < 10);
}
