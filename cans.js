const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const prizeBox = document.getElementById("prizeBox");
const bgMusic = document.getElementById("bgMusic");
const throwSound = document.getElementById("throwSound");
const restartBtn = document.getElementById("restartBtn"); // Restart button

let cans = [];
let balls = [];
let score = 0;
let gameOver = false;
let tries = 5;

let hand = {
  x: canvas.width / 2,
  y: 550,
  angle: 0
};

const GRAVITY = 0.3;
const FLOOR = canvas.height - 40;
const TABLE_Y = 200;

// Setup cans in pyramid
function setupCans() {
  cans = [];
  let spacing = 60;
  let canHeight = 50;
  let pyramidWidth = 3 * spacing;
  let startX = canvas.width / 2 - pyramidWidth / 2;

  // Bottom row
  for (let i = 0; i < 3; i++) {
    cans.push({
      id: "B" + i,
      x: startX + i * spacing,
      y: TABLE_Y - canHeight,
      size: 40,
      hit: false,
      dx: 0, dy: 0,
      falling: false,
      supports: []
    });
  }

  // Middle row
  for (let i = 0; i < 2; i++) {
    cans.push({
      id: "M" + i,
      x: startX + 30 + i * spacing,
      y: TABLE_Y - canHeight * 2,
      size: 40,
      hit: false,
      dx: 0, dy: 0,
      falling: false,
      supports: ["B" + i, "B" + (i + 1)]
    });
  }

  // Top row
  cans.push({
    id: "T0",
    x: startX + 60,
    y: TABLE_Y - canHeight * 3,
    size: 40,
    hit: false,
    dx: 0, dy: 0,
    falling: false,
    supports: ["M0", "M1"]
  });
}

// Reset game
function resetGame() {
  score = 0;
  tries = 5;
  gameOver = false;
  balls = [];
  setupCans();
  prizeBox.style.display = "none";
  restartBtn.style.display = "none";
}

setupCans();

// Background music trigger
document.body.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.volume = 0.4;
    bgMusic.play();
  }
});

// Mouse aiming
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const dx = mouseX - hand.x;
  const dy = mouseY - hand.y;

  hand.angle = Math.atan2(dy, dx) * (180 / Math.PI);
});

// Mouse shooting
canvas.addEventListener("mousedown", () => {
  if (gameOver) return;        // stop if game ended
  if (tries <= 0) return;      // no more throws allowed

  // consume the throw FIRST to avoid double-firing
  tries--;

  const speed = 7;
  const rad = hand.angle * (Math.PI / 180);

  balls.push({
    x: hand.x,
    y: hand.y,
    dx: Math.cos(rad) * speed,
    dy: Math.sin(rad) * speed,
    size: 12
  });

  throwSound.currentTime = 0;
  throwSound.play();

  console.log("Shot fired. Tries left:", tries);
});


// Hand drawing
function drawHand() {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(hand.angle * Math.PI / 180);

  ctx.fillStyle = "#f4c27a";
  ctx.beginPath();
  ctx.arc(0, -20, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4c27a";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(i * 10, -40, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#e0a96d";
  ctx.fillRect(-15, 0, 30, 20);

  ctx.restore();
}

function drawTable() {
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(canvas.width / 2 - 100, TABLE_Y, 200, 20);
  ctx.fillRect(canvas.width / 2 - 90, TABLE_Y + 20, 20, 100);
  ctx.fillRect(canvas.width / 2 + 70, TABLE_Y + 20, 20, 100);
}

function drawCans() {
  cans.forEach(can => {
    if (!can.hit) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(can.x + 5, TABLE_Y, can.size - 10, 8);

      ctx.fillStyle = "#8d99ae";
      ctx.fillRect(can.x, can.y, can.size, can.size * 1.5);

      ctx.strokeStyle = "black";
      ctx.strokeRect(can.x, can.y, can.size, can.size * 1.5);

      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(can.x + can.size / 2, can.y + can.size / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawBalls() {
  ctx.fillStyle = "red";
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function updateBalls() {
  balls.forEach(ball => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    cans.forEach(can => {
      if (!can.hit &&
          ball.x > can.x &&
          ball.x < can.x + can.size &&
          ball.y > can.y &&
          ball.y < can.y + can.size * 1.5) {
        can.falling = true;
        can.dx = (Math.random() - 0.5) * 6;
        can.dy = -5;
        score += 10;
      }
    });
  });

  balls = balls.filter(b => b.y > 0 && b.x > 0 && b.x < canvas.width);
}

function updateCans() {
  cans.forEach(can => {
    if (can.falling) {
      can.dy += GRAVITY;
      can.x += can.dx;
      can.y += can.dy;

      if (can.y + can.size * 1.5 > FLOOR) {
        can.y = FLOOR - can.size * 1.5;
        can.dy *= -0.3;
        if (Math.abs(can.dy) < 1) {
          can.dy = 0;
          can.dx = 0;
          can.falling = false;
          can.hit = true;
        }
      }
    }
  });

  cans.forEach(can => {
    if (!can.falling && !can.hit && can.supports.length > 0) {
      const supportsExist = can.supports.some(id => {
        const support = cans.find(c => c.id === id);
        return support && !support.hit;
      });
      if (!supportsExist) {
        can.falling = true;
      }
    }
  });
}

function drawHUD() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Tries Left: " + tries, 20, 60);
}

// Win/Lose check (with suspense delay)
function checkGameState() {
  if (gameOver) return;

  // ✅ Win: lahat ng cans ay hit (natumba at hindi na nakatayo)
  const allCansDown = cans.every(can => can.hit);

  // ✅ Lose: ubos tries + ubos balls + hindi lahat natumba
  const noMoreBalls = tries === 0 && balls.length === 0;

  if (allCansDown) {
    gameOver = true;
    setTimeout(() => {
      const prizes = [
        "Isang plush toy 🧸",
        "Manok Inasal 🍗",
        "Jollibee meal 🍔",
        "Paboritong laruan 🎁",
        "Ice Cream sa perya 🍦",
      ];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];

      alert(`🎉 Panalo! 🎉\n\nNapanalunan mo: ${prize}`);
      restartBtn.style.display = "block";
    }, 700);

  } else if (noMoreBalls) {
    gameOver = true;
    setTimeout(() => {
      alert("😢 Talo! 😢\n\nWala nang tira. Subukan ulit!");
      restartBtn.style.display = "block";
    }, 700);
  }
}



function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    drawHand();
    drawTable();
    drawCans();
    drawBalls();
    updateBalls();
    updateCans();
    drawHUD();
    checkGameState();
  }

  requestAnimationFrame(gameLoop);
}

// Restart button click
restartBtn.addEventListener("click", resetGame);

gameLoop();
