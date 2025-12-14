import * as ball from "./ball.js";
import laws from "./physics.js";
import * as phys from "./physics.js";

/* ----------  CONFIGURATION ---------- */

const BG_COLOR = '#000';

/* ----------  CANVAS SET-UP ---------- */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const targetWidth = 980;
let width = canvas.width;
let height = canvas.height;

/* ----------  STATE ---------- */
let balls = [];

export const state = {
  numBalls:   parseInt(numberSlider.value),              // how many balls at start
  radius:     parseFloat(sizeSlider.value),
  maxSpeed:   parseFloat(speedSlider.value),
  insertMode: 0
}

laws.gravity = parseFloat(gravitySlider.value);
laws.magnetism = parseFloat(magnetismForceSlider.value);
laws.magnetismRadius = parseInt(magnetismRadiusSlider.value);
laws.tscale = parseFloat(timescale.value);
laws.fusion = fusionEnabled.checked;
laws.fusionP = parseFloat(fusionRatio.value);
laws.fusionI = parseFloat(fusionImpulse.value);

let COUNTER_FREQ = 10;
let countCycle = 1;

let icount = 0;
let acount = 0;
let bcount = 0;
let ccount = 0;
let dcount = 0;

/* ----------  UI ELEMENTS ---------- */

/*
 * Element ID is automatically a variable. No need to getElementById()
 */



/* --------- SET INIT LABEL VALUES --------- */

sizeVal.textContent = state.radius.toFixed(0);
numVal.textContent = state.numBalls;
gravityVal.textContent = laws.gravity.toFixed(1);
speedVal.textContent = state.maxSpeed.toFixed(0);
magnetismForceVal.textContent = laws.magnetism.toFixed(0);
magnetismRadVal.textContent = laws.magnetismRadius.toFixed(0);
timescaleVal.textContent = laws.tscale.toFixed(2);
fusionRatioVal.textContent = laws.fusionP.toFixed(0);
fusionImpulseVal.textContent = laws.fusionI.toFixed(0);

/* ----------- COUNT ----------- */

function countBalls() {
  if (countCycle % COUNTER_FREQ != 0) {
    countCycle++;
    return;
  }
  icount = balls.length - acount - bcount - ccount - dcount
  icountVal.textContent = icount;
  acountVal.textContent = acount;
  bcountVal.textContent = bcount;
  ccountVal.textContent = ccount;
  dcountVal.textContent = dcount;
  icount = 0;
  acount = 0;
  bcount = 0;
  ccount = 0;
  dcount = 0;
  countCycle = 1;
}

function countBall(a) {
  if (countCycle % COUNTER_FREQ != 0) return;
  if (a.typeID == 1) {
    acount += 1;
  } else if (a.typeID == 2) {
    bcount++;
  } else if (a.typeID == 3) {
    ccount++;
  } else if (a.typeID == 4) {
    dcount++;
  }
}

/* ----------  RESIZING ---------- */

function resizeCanvas() {
  const topmargin = canvas.offsetTop;
  const leftmargin = canvas.offsetLeft;

  if (screen.height < 900) {
    canvas.height = screen.availHeight;
  } else {
    canvas.height = window.innerHeight - topmargin;
  }
  canvas.width  = window.innerWidth - leftmargin;

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

export function resizeBalls() {
  for (const b of balls) b.r = state.radius;
}

/* ----------  INITIALISE BALLS ---------- */

export function initBalls(type) {
  balls = [];
  for (let i = 0; i < state.numBalls; i++) {
    let x = state.radius + Math.random() * (width - 2 * state.radius);
    let y = state.radius + Math.random() * (height - 2 * state.radius);
    initSingleBall(x, y, type);
  }
}

export function initSingleBall(x, y, type) {
  let r = state.radius;
  // random direction & speed
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * state.maxSpeed;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const b = new ball.Ball(x, y, vx, vy, r, type);
  balls.push(b);
}

function addBall(ball) {
  balls.push(ball);
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
    ball.move(dt, laws.gravity, laws.tscale);
    ball.collideWall(width, height);
  }

  // ball-ball collisions
  for (let i = 0; i < balls.length; i++) {
    balls[i].radiate = false;
    for (let j = i + 1; j < balls.length; j++) {
      phys.resolveMagnetism(balls[i], balls[j], dt);
      phys.resolveBallCollision(balls[i], balls[j], addBall);
    }
    countBall(balls[i]);
  }
  balls = balls.filter(ball => !ball.remove);   // Remove marked balls
  countBalls();
  for (const ball of balls) ball.draw(ctx);
  requestAnimationFrame(animate);
}

/* ----------  START ---------- */

export function start() {
  resizeCanvas();
  initBalls(ball.inert);
  requestAnimationFrame(animate);
}
