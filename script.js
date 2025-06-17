console.log("Hello, World!");

///////
// Tetris Game Implementation

const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 20;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

let score = 0;
let isGameOver = false;
let highScore = localStorage.getItem("highScore") || 0;
document.getElementById("highScore").innerText = highScore;

const scoreElement = document.getElementById("score");
function updateScore() {
  scoreElement.innerText = score;
}

const PIECES = {
  T: [[[0, 1, 0], [1, 1, 1], [0, 0, 0]]],
  O: [[[1, 1], [1, 1]]],
  L: [[[0, 0, 1], [1, 1, 1], [0, 0, 0]]],
  J: [[[1, 0, 0], [1, 1, 1], [0, 0, 0]]],
  I: [[[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]]],
  S: [[[0, 1, 1], [1, 1, 0], [0, 0, 0]]],
  Z: [[[1, 1, 0], [0, 1, 1], [0, 0, 0]]],
  U: [[[1, 0, 1], [1, 1, 1], [0, 0, 0]]],
  P: [[[1, 1], [1, 1], [1, 0]]],
  Q: [[[1, 1], [1, 0], [1, 1]]],
  X: [[[0, 1, 0], [1, 1, 1], [0, 1, 0]]],
};

const PIECE_IDS = {
  T: 1, O: 2, L: 3, J: 4, I: 5,
  S: 6, Z: 7, U: 8, P: 9, Q: 10, X: 11
};

const COLORS = [
  null,
   "#B0BEC5",  // silver
  "#FFD600",  // bright yellow
  "#FF6D00",  // vivid orange
  "#2979FF",  // bright blue
  "#00E5FF",  // cyan
  "#00C853",  // green
  "#FF1744",  // red
  "#D500F9",  // magenta
  "#6D4C41",  // brown
  "#76FF03",  // lime
  "#F5F5F5",  // soft white
];

const arena = createMatrix(COLS, ROWS);
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  type: 0,
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (
        m[y][x] &&
        (!arena[y + o.y] || arena[y + o.y][x + o.x] !== 0)
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = player.type;
      }
    });
  });
}

function drawMatrix(matrix, offset, color = null, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const px = x + offset.x;
        const py = y + offset.y;

        const gradient = ctx.createLinearGradient(px, py, px + 1, py + 1);
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, color || COLORS[value]);

        ctx.shadowColor = "black";
        ctx.shadowBlur =5;
        ctx.shadowOffsetX = 0.1;
        ctx.shadowOffsetY = 0.1;

        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, 1, 1);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    });
  });
  ctx.restore();
}

function updateScore() {
  scoreElement.innerText = score;
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
    if (collide(arena, player)) {
      gameOver();
    }
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerRotate() {
  const prev = player.matrix;
  player.matrix = rotate(player.matrix);
  if (collide(arena, player)) {
    player.matrix = prev;
  }
}

function playerReset() {
  const keys = Object.keys(PIECES);
  const name = keys[(Math.random() * keys.length) | 0];
  player.matrix = PIECES[name][0];
  player.pos.y = 0;
  player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
  player.type = PIECE_IDS[name];
}

function gameOver() {
  alert("GAME OVER");
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    document.getElementById("highScore").innerText = highScore;
  }
  resetGame();
}

function resetGame() {
  arena.forEach(row => row.fill(0));
  score = 0;
  isGameOver = false;
  updateScore();
  playerReset();
}

function getGhostPosition(arena, player) {
  const ghost = {
    matrix: player.matrix,
    pos: { x: player.pos.x, y: player.pos.y }
  };
  while (!collide(arena, ghost)) {
    ghost.pos.y++;
  }
  ghost.pos.y--; // 衝突する手前まで戻す
  return ghost.pos;
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });

  // ゴーストの描画（薄い色）
  const ghostPos = getGhostPosition(arena, player);
  drawMatrix(player.matrix, ghostPos, COLORS[player.type], 0.3);

  // プレイヤーの描画
  drawMatrix(player.matrix, player.pos, COLORS[player.type]);

  if (!isGameOver) {
    drawMatrix(player.matrix, player.pos, COLORS[player.type]);
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, COLS, ROWS);

  ctx.fillStyle = "white";
  ctx.font = "1px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", COLS / 2, ROWS / 2);
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    score += rowCount * 10;
    rowCount *= 2;

    updateScore();
  }
}

document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") playerMove(-1);
  else if (event.key === "ArrowRight") playerMove(1);
  else if (event.key === "ArrowDown") playerDrop();
  else if (event.key === "ArrowUp") playerRotate();
});

document.getElementById("restartButton").addEventListener("click", resetGame);

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

playerReset();
update();
updateScore();
