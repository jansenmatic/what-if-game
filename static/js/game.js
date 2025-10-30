// Global variables declaration
let playerName = '';
let score = 0;
let gameStarted = false;
let paddle = null;
let ball = null;
let rightPressed = false;
let leftPressed = false;
let gameOver = false;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas size
function resizeCanvas() {
    // Default size for laptop/desktop
    const defaultWidth = 800;
    const defaultHeight = 500;
    
    if (window.innerWidth >= 840) {
        // For laptop/desktop: use fixed dimensions
        canvas.width = defaultWidth;
        canvas.height = defaultHeight;
    } else {
        // For mobile/tablet: responsive dimensions
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const aspectRatio = defaultWidth / defaultHeight;
        const width = containerWidth;
        const height = width / aspectRatio;
        
        canvas.width = width;
        canvas.height = height;
    }
    
    // Update paddle position on resize if game is started
    if (paddle && gameStarted) {
        paddle.y = canvas.height - 30;
        paddle.x = (canvas.width - paddle.width) / 2;
    }
}

// Initial setup
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Add event listeners for form submission
document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submitNameBtn');
    const playerForm = document.getElementById('playerForm');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            submitName();
        });
    }
    
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitName(e);
        });
    }
});

// Game state object to hold all game variables
const gameState = {
    playerName: '',
    score: 0,
    gameStarted: false,
    gameOver: false,
    rightPressed: false,
    leftPressed: false,
    ball: null,
    paddle: null
};

// Mobile controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Touch events for mobile buttons
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    leftPressed = true;
});
leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    leftPressed = false;
});
rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    rightPressed = true;
});
rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    rightPressed = false;
});

// Also support touch on canvas for paddle movement
let touchX = null;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchX === null) return;
    
    const newX = e.touches[0].clientX;
    if (newX < touchX) leftPressed = true;
    if (newX > touchX) rightPressed = true;
    touchX = newX;
});

canvas.addEventListener('touchend', () => {
    touchX = null;
    leftPressed = false;
    rightPressed = false;
});

// Simple name validation
function validateName(name) {
    return name && name.length >= 2 && name.length <= 20;
}

// Start menu handling
function submitName(event) {
    // Always prevent default form submission
    if (event) {
        event.preventDefault();
    }

    // Get the name input
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();

    // Basic validation
    if (!validateName(name)) {
        alert('Please enter a valid name (2-20 characters)');
        return false;
    }

    // Store the name
    playerName = name;

    // Update display
    const playerForm = document.getElementById('playerForm');
    const startButton = document.getElementById('startButton');
    
    // Hide form with fade out
    playerForm.style.opacity = '0';
    setTimeout(() => {
        playerForm.style.display = 'none';
        
        // Show start button with fade in
        startButton.style.display = 'block';
        setTimeout(() => {
            startButton.style.opacity = '1';
        }, 50);
    }, 300);

    return false;
}

function startGame() {
    document.getElementById('startMenu').style.display = 'none';
    gameStarted = true;
    initializeGame();
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
    
    // Fixed sizes for laptop/desktop, relative for mobile
    const isDesktop = window.innerWidth >= 840;
    const paddleWidth = isDesktop ? 100 : canvas.width * 0.15;
    const paddleHeight = isDesktop ? 10 : canvas.height * 0.02;
    const ballRadius = isDesktop ? 15 : canvas.width * 0.02;
    const ballSpeed = isDesktop ? 2 : canvas.width * 0.003;
    
    ball = {
        x: canvas.width/2,
        y: canvas.height/2,
        radius: ballRadius,
        dx: ballSpeed,
        dy: ballSpeed
    };
    
    paddle = {
        x: (canvas.width - paddleWidth)/2,
        y: canvas.height - paddleHeight - 20,
        width: paddleWidth,
        height: paddleHeight
    };
    
    // Start the game loop
    draw();
}
