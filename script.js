// 初始化 GUN，添加多個公共節點以提高可靠性
const gun = Gun({
    peers: [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://gun-us.herokuapp.com/gun',
        'https://gun-eu.herokuapp.com/gun'
    ]
});

class ChessGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.roomId = null;
        this.playerColor = null;
        
        this.initializeUI();
        this.setupEventListeners();
    }

    createInitialBoard() {
        const board = new Array(8).fill(null).map(() => new Array(8).fill(null));
        // 設置初始棋子位置
        const pieces = {
            black: {
                pawn: '♟',
                rook: '♜',
                knight: '♞',
                bishop: '♝',
                queen: '♛',
                king: '♚'
            },
            white: {
                pawn: '♙',
                rook: '♖',
                knight: '♘',
                bishop: '♗',
                queen: '♕',
                king: '♔'
            }
        };

        // 設置黑方棋子
        board[0] = [
            { type: 'rook', color: 'black', symbol: pieces.black.rook },
            { type: 'knight', color: 'black', symbol: pieces.black.knight },
            { type: 'bishop', color: 'black', symbol: pieces.black.bishop },
            { type: 'queen', color: 'black', symbol: pieces.black.queen },
            { type: 'king', color: 'black', symbol: pieces.black.king },
            { type: 'bishop', color: 'black', symbol: pieces.black.bishop },
            { type: 'knight', color: 'black', symbol: pieces.black.knight },
            { type: 'rook', color: 'black', symbol: pieces.black.rook }
        ];
        
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', symbol: pieces.black.pawn };
        }

        // 設置白方棋子
        for (let i = 0; i < 8; i++) {
            board[6][i] = { type: 'pawn', color: 'white', symbol: pieces.white.pawn };
        }

        board[7] = [
            { type: 'rook', color: 'white', symbol: pieces.white.rook },
            { type: 'knight', color: 'white', symbol: pieces.white.knight },
            { type: 'bishop', color: 'white', symbol: pieces.white.bishop },
            { type: 'queen', color: 'white', symbol: pieces.white.queen },
            { type: 'king', color: 'white', symbol: pieces.white.king },
            { type: 'bishop', color: 'white', symbol: pieces.white.bishop },
            { type: 'knight', color: 'white', symbol: pieces.white.knight },
            { type: 'rook', color: 'white', symbol: pieces.white.rook }
        ];

        return board;
    }

    initializeUI() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    square.innerHTML = `<span class="piece">${piece.symbol}</span>`;
                }
                
                chessboard.appendChild(square);
            }
        }
    }

    setupEventListeners() {
        const chessboard = document.getElementById('chessboard');
        chessboard.addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleSquareClick(row, col);
        });

        document.getElementById('new-room-btn').addEventListener('click', () => {
            this.createNewRoom();
        });

        document.getElementById('join-btn').addEventListener('click', () => {
            const roomId = document.getElementById('join-room').value;
            if (roomId) {
                this.joinRoom(roomId);
            }
        });
    }

    handleSquareClick(row, col) {
        if (this.playerColor && this.playerColor !== this.currentPlayer) {
            return; // 不是該玩家的回合
        }

        const piece = this.board[row][col];

        if (this.selectedPiece) {
            if (this.isValidMove(row, col)) {
                this.movePiece(row, col);
                this.selectedPiece = null;
                this.validMoves = [];
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                document.getElementById('current-player').textContent = `輪到：${this.currentPlayer === 'white' ? '白方' : '黑方'}`;
                
                if (this.roomId) {
                    this.syncGameState();
                }
            } else if (piece && piece.color === this.currentPlayer) {
                this.selectPiece(row, col);
            } else {
                this.selectedPiece = null;
                this.validMoves = [];
            }
        } else if (piece && piece.color === this.currentPlayer) {
            this.selectPiece(row, col);
        }

        this.updateBoard();
    }

    selectPiece(row, col) {
        this.selectedPiece = { row, col };
        this.validMoves = this.calculateValidMoves(row, col);
    }

    calculateValidMoves(row, col) {
        const piece = this.board[row][col];
        const moves = [];

        if (!piece) return moves;

        switch (piece.type) {
            case 'pawn':
                this.calculatePawnMoves(row, col, moves);
                break;
            case 'rook':
                this.calculateRookMoves(row, col, moves);
                break;
            case 'knight':
                this.calculateKnightMoves(row, col, moves);
                break;
            case 'bishop':
                this.calculateBishopMoves(row, col, moves);
                break;
            case 'queen':
                this.calculateQueenMoves(row, col, moves);
                break;
            case 'king':
                this.calculateKingMoves(row, col, moves);
                break;
        }

        return moves;
    }

    calculatePawnMoves(row, col, moves) {
        const direction = this.board[row][col].color === 'white' ? -1 : 1;
        const startRow = this.board[row][col].color === 'white' ? 6 : 1;

        // 前進一格
        if (this.isValidPosition(row + direction, col) && !this.board[row + direction][col]) {
            moves.push([row + direction, col]);
            
            // 初始位置可以前進兩格
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }

        // 吃子移動
        for (let colOffset of [-1, 1]) {
            const newCol = col + colOffset;
            const newRow = row + direction;
            
            if (this.isValidPosition(newRow, newCol) && 
                this.board[newRow][newCol] && 
                this.board[newRow][newCol].color !== this.board[row][col].color) {
                moves.push([newRow, newCol]);
            }
        }
    }

    calculateRookMoves(row, col, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.calculateLinearMoves(row, col, moves, directions);
    }

    calculateKnightMoves(row, col, moves) {
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (let [rowOffset, colOffset] of offsets) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.isValidPosition(newRow, newCol) && 
                (!this.board[newRow][newCol] || 
                 this.board[newRow][newCol].color !== this.board[row][col].color)) {
                moves.push([newRow, newCol]);
            }
        }
    }

    calculateBishopMoves(row, col, moves) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.calculateLinearMoves(row, col, moves, directions);
    }

    calculateQueenMoves(row, col, moves) {
        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        this.calculateLinearMoves(row, col, moves, directions);
    }

    calculateKingMoves(row, col, moves) {
        const directions = [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        for (let [rowOffset, colOffset] of directions) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.isValidPosition(newRow, newCol) && 
                (!this.board[newRow][newCol] || 
                 this.board[newRow][newCol].color !== this.board[row][col].color)) {
                moves.push([newRow, newCol]);
            }
        }
    }

    calculateLinearMoves(row, col, moves, directions) {
        for (let [rowDir, colDir] of directions) {
            let newRow = row + rowDir;
            let newCol = col + colDir;

            while (this.isValidPosition(newRow, newCol)) {
                if (!this.board[newRow][newCol]) {
                    moves.push([newRow, newCol]);
                } else {
                    if (this.board[newRow][newCol].color !== this.board[row][col].color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
                newRow += rowDir;
                newCol += colDir;
            }
        }
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isValidMove(row, col) {
        return this.validMoves.some(([r, c]) => r === row && c === col);
    }

    movePiece(toRow, toCol) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;
        
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
    }

    updateBoard() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            
            // 清除先前的狀態
            square.innerHTML = '';
            square.classList.remove('selected', 'valid-move');
            
            // 顯示棋子
            const piece = this.board[row][col];
            if (piece) {
                square.innerHTML = `<span class="piece">${piece.symbol}</span>`;
            }
            
            // 顯示選中的棋子
            if (this.selectedPiece && 
                this.selectedPiece.row === row && 
                this.selectedPiece.col === col) {
                square.classList.add('selected');
            }
            
            // 顯示有效移動位置
            if (this.validMoves.some(([r, c]) => r === row && c === col)) {
                square.classList.add('valid-move');
            }
        });
    }

    createNewRoom() {
        this.roomId = Math.random().toString(36).substr(2, 9);
        this.playerColor = 'white';
        document.getElementById('room-id').textContent = this.roomId;
        
        const gameRef = gun.get('chess').get(this.roomId);
        
        // 立即設置初始遊戲狀態
        const initialState = {
            board: JSON.stringify(this.board),
            currentPlayer: this.currentPlayer,
            lastUpdate: Date.now(),
            initialized: true
        };
        
        gameRef.get('gameState').put(initialState, (ack) => {
            if (ack.err) {
                const status = document.getElementById('game-status');
                if (status) {
                    status.textContent = '建立房間失敗，請重試。';
                }
                return;
            }
            
            this.setupGunSync();
            const status = document.getElementById('game-status');
            if (status) {
                status.textContent = `房間已創建！房間 ID: ${this.roomId}`;
            }
        });
    }

    joinRoom(roomId) {
        if (!roomId) return;
        
        this.roomId = roomId;
        this.playerColor = 'black';
        document.getElementById('room-id').textContent = this.roomId;
        
        // 改進房間存在性檢查
        const gameRef = gun.get('chess').get(this.roomId);
        gameRef.get('gameState').once((data, key) => {
            if (!data || data.board === undefined) {
                const status = document.getElementById('game-status');
                if (status) {
                    status.textContent = '找不到該房間，請確認房間 ID 是否正確。';
                }
                this.roomId = null;
                this.playerColor = null;
                return;
            }
            
            this.setupGunSync();
            const status = document.getElementById('game-status');
            if (status) {
                status.textContent = '已成功加入房間！';
            }
        });
    }

    setupGunSync() {
        if (!this.roomId) return;

        const gameRef = gun.get('chess').get(this.roomId);
        
        // 監聽遊戲狀態變化
        gameRef.get('gameState').on((data, key) => {
            if (!data || data.board === undefined) return;
            
            if (data.board && data.currentPlayer) {
                // 確保不是自己發出的更新
                if (this.playerColor && 
                    this.currentPlayer === this.playerColor && 
                    data.currentPlayer === this.playerColor) {
                    return;
                }
                
                try {
                    const newBoard = JSON.parse(data.board);
                    this.board = newBoard;
                    this.currentPlayer = data.currentPlayer;
                    document.getElementById('current-player').textContent = 
                        `輪到：${this.currentPlayer === 'white' ? '白方' : '黑方'}`;
                    this.updateBoard();
                } catch (error) {
                    console.error('解析遊戲資料時發生錯誤:', error);
                }
            }
        });

        // 發送初始遊戲狀態
        if (this.playerColor === 'white') {
            this.syncGameState();
        }
    }

    syncGameState() {
        if (!this.roomId) return;
        
        const gameRef = gun.get('chess').get(this.roomId);
        const gameState = {
            board: JSON.stringify(this.board),
            currentPlayer: this.currentPlayer,
            lastUpdate: Date.now()
        };
        
        gameRef.get('gameState').put(gameState);
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ChessGame();
});