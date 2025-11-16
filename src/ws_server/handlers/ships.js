import { games } from "../../db/games.js";

export function handleAddShips(ws, { data }) {
    const { gameId, ships, indexPlayer } = data;

    const game = games.get(gameId);
    if (!game) return;

    game.ships[indexPlayer] = ships;

    // if both players sent ships → start_game
    if (Object.keys(game.ships).length === 2) {
        for (const p of game.players) {
            p.ws.send(JSON.stringify({
                type: "start_game",
                data: {
                    ships: game.ships[p.id],
                    currentPlayerIndex: game.currentPlayer
                },
                id: 0
            }));
        }
    }
}
