document.addEventListener('DOMContentLoaded', () => {

    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 20;

    const COLORS = [
        null,
        '#d1c4e9', // T (Lavender)
        '#fff9c4', // O (Light Yellow)
        '#ffccbc', // L (Light Orange)
        '#cdeffc', // J (Light Blue)
        '#ffcdd2', // Z (Light Pink)
        '#bcffbc', // S (Mint Green - User's example)
        '#b2ebf2', // I (Light Cyan)
        '#e0e0e0'  // Garbage block (Light Grey)
    ];
    const SHAPES = [
        [], [[0, 1, 0], [1, 1, 1], [0, 0, 0]], [[2, 2], [2, 2]], [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
        [[4, 0, 0], [4, 4, 4], [0, 0, 0]], [[5, 5, 0], [0, 5, 5], [0, 0, 0]], [[0, 6, 6], [6, 6, 0], [0, 0, 0]],
        [[0, 0, 0, 0], [7, 7, 7, 7], [0, 0, 0, 0], [0, 0, 0, 0]]
    ];

    class Player {
        constructor(elementId, scoreId) {
            this.canvas = document.getElementById(elementId);
            this.context = this.canvas.getContext('2d');
            this.scoreElement = document.getElementById(scoreId);

            this.board = this.createBoard();
            this.score = 0;
            this.currentPiece = null;
            this.currentPos = { x: 0, y: 0 };
            this.opponent = null;

            this.dropCounter = 0;
            this.dropInterval = 1000;
            this.lastTime = 0;
        }

        createBoard() {
            return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        }

        drawBlock(x, y, color) {
            this.context.fillStyle = color;
            this.context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            this.context.strokeStyle = '#333';
            this.context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }

        draw() {
            // ボードの描画
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (this.board[y][x]) {
                        this.drawBlock(x, y, COLORS[this.board[y][x]]);
                    }
                }
            }
            // 現在のミノの描画
            if (this.currentPiece) {
                const shape = this.currentPiece;
                const color = COLORS[shape.flat().find(v => v > 0)];
                shape.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value > 0) {
                            this.drawBlock(this.currentPos.x + x, this.currentPos.y + y, color);
                        }
                    });
                });
            }
        }

        spawnNewPiece() {
            const rand = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
            this.currentPiece = SHAPES[rand];
            this.currentPos = { x: Math.floor(COLS / 2) - Math.floor(this.currentPiece[0].length / 2), y: 0 };

            if (!this.isValidMove(this.currentPiece, this.currentPos)) {
                gameActive = false;
            }

            if (this === cpu && gameActive) {
                this.findBestMove();
            }
        }

        isValidMove(piece, pos) {
            for (let y = 0; y < piece.length; y++) {
                for (let x = 0; x < piece[y].length; x++) {
                    if (piece[y][x] !== 0) {
                        let newX = pos.x + x;
                        let newY = pos.y + y;
                        if (newX < 0 || newX >= COLS || newY >= ROWS || (this.board[newY] && this.board[newY][newX])) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        rotate() {
            const piece = this.currentPiece;
            const N = piece.length;
            const newPiece = Array(N).fill(0).map(() => Array(N).fill(0));
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < N; x++) {
                    newPiece[x][N - 1 - y] = piece[y][x];
                }
            }
            if (this.isValidMove(newPiece, this.currentPos)) {
                this.currentPiece = newPiece;
            }
        }

        move(dx, dy) {
            const newPos = { x: this.currentPos.x + dx, y: this.currentPos.y + dy };
            if (this.isValidMove(this.currentPiece, newPos)) {
                this.currentPos = newPos;
                return true;
            }
            return false;
        }

        drop() {
            if (!this.move(0, 1)) {
                this.lockPiece();
                this.removeLines();
                this.spawnNewPiece();
            }
            this.dropCounter = 0;
        }

        lockPiece() {
            this.currentPiece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.board[this.currentPos.y + y][this.currentPos.x + x] = value;
                    }
                });
            });
        }

        addGarbageLines(count) {
            for (let i = 0; i < count; i++) {
                const row = Array(COLS).fill(8); // 8はgrey
                const emptySlot = Math.floor(Math.random() * COLS);
                row[emptySlot] = 0;
                this.board.shift(); // 一番上の行を削除
                this.board.push(row); // 下にゴミラインを追加
            }
        }

        removeLines() {
            let newBoard = this.board.filter(row => !row.every(value => value !== 0));
            const linesRemoved = ROWS - newBoard.length;

            if (linesRemoved > 0) {
                const emptyRows = Array(linesRemoved).fill(null).map(() => Array(COLS).fill(0));
                this.board = [...emptyRows, ...newBoard];

                this.score += linesRemoved * 10;
                this.scoreElement.textContent = this.score;

                if (this.opponent && linesRemoved >= 2) {
                    this.opponent.addGarbageLines(linesRemoved - 1);
                }
            }
        }

        update(time = 0) {
            if (!gameActive) return;
            const deltaTime = time - this.lastTime;
            this.lastTime = time;

            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                 if (this === cpu) {
                    this.cpuMove();
                } else {
                    this.drop();
                }
            }
            this.draw();
        }

        findBestMove() {
            let bestScore = -Infinity;
            this.bestMove = null;

            for (let r = 0; r < 4; r++) {
                let piece = this.currentPiece;
                for(let i=0; i<r; i++) piece = this.getRotatedPiece(piece);

                for (let x = -2; x < COLS; x++) {
                    let tempPos = { x: x, y: this.currentPos.y };
                    if (this.isValidMove(piece, tempPos)) {
                        let tempY = tempPos.y;
                        while (this.isValidMove(piece, { x: tempPos.x, y: tempY + 1 })) {
                            tempY++;
                        }
                        tempPos.y = tempY;

                        const score = this.evaluateBoard(piece, tempPos);
                        if (score > bestScore) {
                            bestScore = score;
                            this.bestMove = { piece: piece, pos: tempPos, rotation: r, targetX: x };
                        }
                    }
                }
            }
        }

        cpuMove() {
            if (!this.bestMove) {
                this.drop();
                return;
            }

            // 1. Rotate to the best orientation
            for (let i = 0; i < this.bestMove.rotation; i++) {
                this.rotate();
            }

            // 2. Move to the best X position
            while (this.currentPos.x !== this.bestMove.targetX) {
                this.move(this.currentPos.x < this.bestMove.targetX ? 1 : -1, 0);
            }

            // 3. Drop the piece
            this.drop();
        }

        evaluateBoard(piece, pos) {
            let tempBoard = this.board.map(r => [...r]);
            piece.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val !== 0) tempBoard[pos.y + y][pos.x + x] = val;
                });
            });

            let height = 0, holes = 0, completedLines = 0, bumpiness = 0;
            let colHeights = [];

            for (let x = 0; x < COLS; x++) {
                let colHeight = 0;
                for (let y = 0; y < ROWS; y++) {
                    if (tempBoard[y][x] !== 0) {
                        colHeight = ROWS - y;
                        break;
                    }
                }
                colHeights.push(colHeight);
                height += colHeight;

                let blockFound = false;
                for (let y = 0; y < ROWS; y++) {
                    if (tempBoard[y][x] !== 0) blockFound = true;
                    else if (blockFound) holes++;
                }
            }

            for(let y=0; y < ROWS; y++) {
                if(tempBoard[y].every(val => val !== 0)) completedLines++;
            }

            for(let i=0; i<colHeights.length-1; i++) {
                bumpiness += Math.abs(colHeights[i] - colHeights[i+1]);
            }

            return (completedLines * 0.76) - (height * 0.51) - (holes * 0.35) - (bumpiness * 0.18);
        }

        getRotatedPiece(piece) {
            const N = piece.length;
            const newPiece = Array(N).fill(null).map(() => Array(N).fill(0));
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < N; x++) {
                    newPiece[x][N - 1 - y] = piece[y][x];
                }
            }
            return newPiece;
        }
    }

    let gameActive = true;
    const player = new Player('player-board', 'player-score');
    const cpu = new Player('cpu-board', 'cpu-score');
    cpu.dropInterval = 500;
    player.opponent = cpu;
    cpu.opponent = player;

    function initGame() {
        gameActive = true;
        player.board = player.createBoard();
        cpu.board = cpu.createBoard();
        player.score = 0;
        cpu.score = 0;
        player.scoreElement.textContent = 0;
        cpu.scoreElement.textContent = 0;
        player.spawnNewPiece();
        cpu.spawnNewPiece();
        gameLoop();
    }

    function gameLoop(time) {
        if (!gameActive) {
            if (confirm('ゲームオーバー！もう一度プレイしますか？')) {
                initGame();
            }
            return;
        }
        player.update(time);
        cpu.update(time);
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', event => {
        if (!gameActive) return;
        if (event.key === 'ArrowLeft') {
            player.move(-1, 0);
        } else if (event.key === 'ArrowRight') {
            player.move(1, 0);
        } else if (event.key === 'ArrowDown') {
            player.drop();
        } else if (event.key === 'ArrowUp') {
            player.rotate();
        }
    });

    initGame();
});