import { rooms } from "../../db/rooms.js";

/**
 * Добавляем корабли игрока
 */
export function handleAddShips(ws, data) {
    const { gameId, ships, indexPlayer } = data;

    // Найдём комнату с этой игрой
    const room = Array.from(rooms.values()).find(r => r.gameId === gameId);
    if (!room) return;

    // Найдём игрока по indexPlayer
    const player = room.players.find(p => p.index === indexPlayer);
    if (!player) return;

    // Сохраняем корабли
    if (!room.board) room.board = {};
    room.board[indexPlayer] = ships;

    // Отправим start_game, если оба игрока прислали корабли
    const allPlayersReady = room.players.every(p => room.board?.[p.index]);
    if (allPlayersReady) {
        // Случайно выбираем, кто ходит первым
        const firstPlayer = room.players[Math.floor(Math.random() * room.players.length)];
        room.currentPlayer = firstPlayer.index;

        room.players.forEach(p => {
            const payload = JSON.stringify({
                type: "start_game",
                data: {
                    ships: room.board[p.index], // свои корабли
                    currentPlayerIndex: room.currentPlayer
                },
                id: 0
            });
            p.ws.send(payload);
        });

        // Отправляем текущий ход
        sendTurn(room);
    }
}

/**
 * Получаем ход игрока
 */
export function handleAttack(ws, data) {
    const { gameId, x, y, indexPlayer } = data;

    const room = Array.from(rooms.values()).find(r => r.gameId === gameId);
    if (!room) return;

    // Проверяем, чей ход
    if (room.currentPlayer !== indexPlayer) return;

    // Противник
    const enemy = room.players.find(p => p.index !== indexPlayer);
    if (!enemy) return;

    // Проверяем попадание по доске противника
    const enemyShips = room.board[enemy.index];
    let status = "miss";
    for (const ship of enemyShips) {
        for (let i = 0; i < ship.length; i++) {
            const sx = ship.position.x + (ship.direction ? i : 0);
            const sy = ship.position.y + (ship.direction ? 0 : i);
            if (sx === x && sy === y) {
                status = "shot";
                ship.hit = (ship.hit || 0) + 1;
                if (ship.hit >= ship.length) status = "killed";
            }
        }
    }

    // Отправляем результат всем игрокам
    room.players.forEach(p => {
        const payload = JSON.stringify({
            type: "attack",
            data: {
                position: { x, y },
                currentPlayer: room.currentPlayer,
                status
            },
            id: 0
        });
        p.ws.send(payload);
    });

    // Проверяем конец игры
    const enemyLost = enemyShips.every(s => s.hit >= s.length);
    if (enemyLost) {
        room.players.forEach(p => {
            const payload = JSON.stringify({
                type: "finish",
                data: { winPlayer: indexPlayer },
                id: 0
            });
            p.ws.send(payload);
        });
        return;
    }

    // Если промах — меняем текущего игрока
    if (status === "miss") {
        room.currentPlayer = enemy.index;
        sendTurn(room);
    }
}

/**
 * Random attack (для ИИ или демонстрации)
 */
export function handleRandomAttack(ws, data) {
    const { gameId, indexPlayer } = data;
    const room = Array.from(rooms.values()).find(r => r.gameId === gameId);
    if (!room) return;

    if (room.currentPlayer !== indexPlayer) return;

    const enemy = room.players.find(p => p.index !== indexPlayer);
    if (!enemy) return;

    // Ищем случайную свободную клетку
    const enemyShips = room.board[enemy.index];
    let x, y, status;
    do {
        x = Math.floor(Math.random() * 10);
        y = Math.floor(Math.random() * 10);
        // простая проверка, чтобы не стрелять дважды в одну клетку
        status = enemyShips.some(ship => {
            for (let i = 0; i < ship.length; i++) {
                const sx = ship.position.x + (ship.direction ? i : 0);
                const sy = ship.position.y + (ship.direction ? 0 : i);
                if (sx === x && sy === y) return true;
            }
            return false;
        }) ? "shot" : "miss";
    } while (false);

    handleAttack(ws, { gameId, x, y, indexPlayer });
}

/**
 * Отправляем информацию о текущем ходе
 */
function sendTurn(room) {
    room.players.forEach(p => {
        const payload = JSON.stringify({
            type: "turn",
            data: { currentPlayer: room.currentPlayer },
            id: 0
        });
        p.ws.send(payload);
    });
}
