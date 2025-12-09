/* ----------  CONFIGURATION ---------- */
const BALL_COLOR = '#3a5fcd';
const BG_COLOR = '#fff';

/* ----------  CANVAS SET‑UP ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const targetWidth = 980;
let width = canvas.width;

/* ----------  UI ELEMENTS ---------- */
const numberSlider = document.getElementById('numberSlider');
const sizeSlider   = document.getElementById('sizeSlider');
const gravitySlider= document.getElementById('gravitySlider');
const speedSlider  = document.getElementById('speedSlider');
const resetBtn     = document.getElementById('resetBtn');
const sizeVal      = document.getElementById('sizeVal');
const gravityVal   = document.getElementById('gravityVal');
const speedVal     = document.getElementById('speedVal');

/* ----------  STATE ---------- */
let balls = [];
let numBalls = parseInt(numberSlider.value);              // how many balls at start
let radius = parseFloat(sizeSlider.value);
let gravity = parseFloat(gravitySlider.value);
let maxSpeed = parseFloat(speedSlider.value);

/* ----------  BALL CLASS ---------- */
class Ball {
  constructor(x, y, vx, vy, r) {
    this.x  = x;
    this.y  = y;
    this.vx = vx;
    this.vy = vy;
    this.r  = r;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = BALL_COLOR;
    ctx.fill();
  }

  move(dt) {
    // apply gravity
    this.vy += gravity * dt;
    // update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  // wall collision – perfectly elastic
  collideWall() {
    if (this.x - this.r < 0) {
      this.x = this.r;
      this.vx = Math.abs(this.vx);
    }
    if (this.x + this.r > width) {
      this.x = width - this.r;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y - this.r < 0) {
      this.y = this.r;
      this.vy = Math.abs(this.vy);
    }
    if (this.y + this.r > height) {
      this.y = height - this.r;
      this.vy = -Math.abs(this.vy);
    }
  }
}

/* ----------  COLLISION RESOLUTION ---------- */
function resolveBallCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist > a.r + b.r) return; // no overlap or already separated

  // normal & tangent vectors
  const nx = dx / dist;
  const ny = dy / dist;
  const tx = -ny;
  const ty = nx;

  // dot products
  const vaDotN = a.vx * nx + a.vy * ny;
  const vaDotT = a.vx * tx + a.vy * ty;
  const vbDotN = b.vx * nx + b.vy * ny;
  const vbDotT = b.vx * tx + b.vy * ty;

  // swap normal components (equal masses, perfect elasticity)
  const vaNewN = vbDotN;
  const vbNewN = vaDotN;

  // convert back to (vx,vy)
  a.vx = vaNewN * nx + vaDotT * tx;
  a.vy = vaNewN * ny + vaDotT * ty;
  b.vx = vbNewN * nx + vbDotT * tx;
  b.vy = vbNewN * ny + vbDotT * ty;

  // reposition so they are just touching
  const overlap = (a.r + b.r - dist) / 2;
  a.x -= overlap * nx;
  a.y -= overlap * ny;
  b.x += overlap * nx;
  b.y += overlap * ny;
}

/* ----------  RESIZING ---------- */
function resizeCanvas() {
  // subtract UI height
  const margin = view.offsetTop;
  canvas.width  = ( window.innerWidth > targetWidth ? targetWidth : window.innerWidth );
  canvas.height = window.innerHeight - 2*margin;

  width  = canvas.width;
  height = canvas.height;

  // clamp balls to new bounds (important when canvas shrinks)
  for (const b of balls) {
    if (b.x - b.r < 0) b.x = b.r;
    if (b.x + b.r > width) b.x = width - b.r;
    if (b.y - b.r < 0) b.y = b.r;
    if (b.y + b.r > height) b.y = height - b.r;
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();     // initialise once

/* ----------  INITIALISE BALLS ---------- */
function initBalls() {
  balls = [];
  for (let i = 0; i < numBalls; i++) {
    let r = radius;
    let x = r + Math.random() * (width - 2 * r);
    let y = r + Math.random() * (height - 2 * r);

    // random direction & speed
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * maxSpeed;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const b = new Ball(x, y, vx, vy, r);
    balls.push(b);
  }
}

/* ----------  MAIN LOOP ---------- */
let lastTime = null;
function animate(time) {
  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;   // seconds
  lastTime = time;

  // clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // move & draw balls
  for (const ball of balls) {
    ball.move(dt);
    ball.collideWall();
  }

  // ball‑ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }

  for (const ball of balls) ball.draw();

  requestAnimationFrame(animate);
}

/* ----------- SET LABEL VALUES ----------- */

sizeVal.textContent = radius.toFixed(0);
numVal.textContent = numberSlider.value;
gravityVal.textContent = gravity.toFixed(2);
speedVal.textContent = maxSpeed.toFixed(1);

/* ----------  UI EVENT LISTENERS ---------- */

numberSlider.addEventListener('input', e => {
  numBalls = numberSlider.value;
  numVal.textContent = numberSlider.value;
});

sizeSlider.addEventListener('input', e => {
  radius = parseFloat(e.target.value);
  sizeVal.textContent = radius.toFixed(0);
  // resize existing balls
  for (const b of balls) b.r = radius;
});

gravitySlider.addEventListener('input', e => {
  gravity = parseFloat(e.target.value);
  gravityVal.textContent = gravity.toFixed(2);
});

speedSlider.addEventListener('input', e => {
  maxSpeed = parseFloat(e.target.value);
  speedVal.textContent = maxSpeed.toFixed(1);
});

resetBtn.addEventListener('click', () => {
  initBalls();
});

/* ----------  START ---------- */
initBalls();
requestAnimationFrame(animate);
