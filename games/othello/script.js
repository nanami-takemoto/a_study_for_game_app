document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const currentTurnElement = document.getElementById('current-turn');
    const whiteScoreElement = document.getElementById('white-score');
    const purpleScoreElement = document.getElementById('purple-score');
    const resetButton = document.getElementById('reset-button');

    const PLAYER_WHITE = 1;
    const PLAYER_PURPLE = 2;
    const BOARD_SIZE = 8;

    let board = [];
    let currentPlayer;
    let gameActive = true;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    function initGame() {
        board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
        board[3][3] = PLAYER_WHITE;
        board[3][4] = PLAYER_PURPLE;
        board[4][3] = PLAYER_PURPLE;
        board[4][4] = PLAYER_WHITE;

        // プレイヤー(紫)が先手
        currentPlayer = PLAYER_PURPLE;
        gameActive = true;

        renderBoard();
        // updateInfo(); // gameLoopが最初に呼ばれるので不要
        gameLoop(); // ゲーム開始/リセット時にループを開始
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (board[r][c] !== 0) {
                    const piece = document.createElement('div');
                    piece.classList.add('piece');
                    piece.classList.add(board[r][c] === PLAYER_WHITE ? 'white' : 'purple');
                    cell.appendChild(piece);
                }
                boardElement.appendChild(cell);
            }
        }
    }

    function updateInfo() {
        let whiteScore = 0;
        let purpleScore = 0;
        board.flat().forEach(cell => {
            if (cell === PLAYER_WHITE) whiteScore++;
            if (cell === PLAYER_PURPLE) purpleScore++;
        });

        whiteScoreElement.textContent = whiteScore;
        purpleScoreElement.textContent = purpleScore;

        if (!gameActive) {
            if (whiteScore > purpleScore) {
                currentTurnElement.textContent = '白の勝ち！';
            } else if (purpleScore > whiteScore) {
                currentTurnElement.textContent = '紫の勝ち！';
            } else {
                currentTurnElement.textContent = '引き分け！';
            }
        } else {
             // プレイヤーは紫、CPUは白とします
            currentTurnElement.textContent = currentPlayer === PLAYER_PURPLE ? '紫 (あなた)' : '白 (CPU)';
        }
    }

    function getFlippablePieces(row, col, player) {
        if (board[row][col] !== 0) return [];

        const flippable = [];
        const opponent = player === PLAYER_WHITE ? PLAYER_PURPLE : PLAYER_WHITE;

        directions.forEach(([dr, dc]) => {
            let line = [];
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
                line.push([r, c]);
                r += dr;
                c += dc;
            }

            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player && line.length > 0) {
                flippable.push(...line);
            }
        });
        return flippable;
    }

    function hasValidMoves(player) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (getFlippablePieces(r, c, player).length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function handleCellClick(e) {
        if (!gameActive || currentPlayer !== PLAYER_PURPLE) return; // プレイヤーのターンでなければ何もしない

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        const flippablePieces = getFlippablePieces(row, col, currentPlayer);

        if (flippablePieces.length === 0) {
            return; // 無効な手
        }

        board[row][col] = currentPlayer;
        flippablePieces.forEach(([r, c]) => {
            board[r][c] = currentPlayer;
        });

        renderBoard();
        switchTurn();
        gameLoop(); // 次のターンへ
    }

    function switchTurn() {
        currentPlayer = currentPlayer === PLAYER_PURPLE ? PLAYER_WHITE : PLAYER_PURPLE;
    }

    function gameLoop() {
        updateInfo();
        if (!gameActive) return;

        const playerHasMoves = hasValidMoves(currentPlayer);
        const opponent = currentPlayer === PLAYER_PURPLE ? PLAYER_WHITE : PLAYER_PURPLE;
        const opponentHasMoves = hasValidMoves(opponent);

        if (!playerHasMoves && !opponentHasMoves) {
            endGame();
            return;
        }

        if (!playerHasMoves) {
            alert((currentPlayer === PLAYER_PURPLE ? "紫 (あなた)" : "白 (CPU)") + " はパスします。");
            switchTurn();
            // パスした後は、再度gameLoopを呼び出して相手のターンを処理
            setTimeout(gameLoop, 100);
            return;
        }

        if (currentPlayer === PLAYER_WHITE) { // CPUのターン
            setTimeout(cpuTurn, 1000);
        }
        // プレイヤーのターンの場合は、クリックを待つ
    }

    function cpuTurn() {
        if (!gameActive) return;

        let bestMove = null;
        let maxFlipped = -1;

        // CPUの戦略：最も多くの石を返せる手を選ぶ
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const flippablePieces = getFlippablePieces(r, c, PLAYER_WHITE);
                if (flippablePieces.length > maxFlipped) {
                    maxFlipped = flippablePieces.length;
                    bestMove = { row: r, col: c, pieces: flippablePieces };
                }
            }
        }

        if (bestMove && maxFlipped > 0) {
            board[bestMove.row][bestMove.col] = PLAYER_WHITE;
            bestMove.pieces.forEach(([r, c]) => {
                board[r][c] = PLAYER_WHITE;
            });
            renderBoard();
            switchTurn();
            gameLoop();
        }
        // CPUが有効な手がない場合は、gameLoopによって自動的にパスされる
    }

    function endGame() {
        gameActive = false;
        updateInfo();
    }

    boardElement.addEventListener('click', handleCellClick);
    resetButton.addEventListener('click', initGame);

    initGame(); // ゲーム開始
});