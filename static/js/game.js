const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let playerName = '';
let score = 0;
let gameStarted = false;
let ball = { x: 400, y: 250, radius: 15, dx: 3, dy: 3 };
let paddle = { x: 350, y: 470, width: 100, height: 10 };
let rightPressed = false;
let leftPressed = false;
let gameOver = false;

// Start menu handling
function startGame(event) {
    event.preventDefault();
    playerName = document.getElementById('playerName').value.trim();
    if (playerName) {
        document.getElementById('startMenu').style.display = 'none';
        gameStarted = true;
        initializeGame();
    }
    return false;
}

// Event listeners for movement
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}

function keyUpHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = "#00bfff";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#ff4500";
    ctx.fill();
    ctx.closePath();
}

function movePaddle() {
    if(rightPressed && paddle.x < canvas.width - paddle.width) paddle.x += 7;
    else if(leftPressed && paddle.x > 0) paddle.x -= 7;
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Bounce off walls
    if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1;
    if(ball.y - ball.radius < 0) ball.dy *= -1;

    // Paddle collision
    if(ball.y + ball.radius > paddle.y &&
       ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy *= -1;
    }

    // Check death
    if(ball.y + ball.radius > canvas.height) {
        gameOver = true;
        // Send score to server before redirecting
        fetch('/save_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score
            })
        }).then(() => {
            window.location.href = "/gameover";
        });
    }
}

function drawScore() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Player: " + playerName, canvas.width - 200, 30);
}

function updateScore() {
    if (ball.dy < 0) {  // Only increment score when ball is going up
        score += 1;
    }
}

function draw() {
    if(!gameStarted || gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    drawScore();
    movePaddle();
    moveBall();
    updateScore();

    requestAnimationFrame(draw);
}

function initializeGame() {
    // Reset game state
    score = 0;
    gameOver = false;
    ball = { x: 400, y: 250, radius: 15, dx: 3, dy: 3 };
    paddle = { x: 350, y: 470, width: 100, height: 10 };
    
    // Start the game loop
    draw();
}
