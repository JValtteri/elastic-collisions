/* ----------  CONFIGURATION ---------- */
const INERT_BALL_COLOR = '#527dff';
const MAGNETIC_BALL_COLOR = '#ff5252';
const BG_COLOR = '#000';
const DAMPING = 0.99995; // Apply damping to counteract calculation inaccuracies

/* ----------  CANVAS SET-UP ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const targetWidth = 980;
let width = canvas.width;

/* ----------  UI ELEMENTS ---------- */

/*
 * Element ID is automatically a variable. No need to getElementById()
 */

/* ----------  STATE ---------- */
let balls = [];
let numBalls = parseInt(numberSlider.value);              // how many balls at start
let radius = parseFloat(sizeSlider.value);
let gravity = parseFloat(gravitySlider.value);
let maxSpeed = parseFloat(speedSlider.value);
let magnetism = parseFloat(magnetismForceSlider.value);
let magnetismRadius = parseInt(magnetismRadiusSlider.value);
// let totalEnergy = 0;
// let maxTotalEnergy = 0;
let mode = 0;


/* ----------  BALL CLASS ---------- */
class Ball {
  constructor(x, y, vx, vy, r, color, magnetic) {
    this.x  = x;
    this.y  = y;
    this.vx = vx;
    this.vy = vy;
    this.r  = r;
    this.color = color;
    this.magnetic = magnetic;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
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

/* ---------- BALL TYPES ---------- */
class BallType {
  constructor(color, magnetic) {
    this.color = color;
    this.magnetic = magnetic;
  }
}

const magnetic = new BallType(MAGNETIC_BALL_COLOR, true);
const inert = new BallType(INERT_BALL_COLOR, false);

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


/* --- MAGNETISM --- */
function resolveMagnetism(a, b, dt) {
  if (!a.magnetic || !b.magnetic) return;         // Ignore inert balls
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const dist = Math.hypot(dx, dy);

  /* Skip if the particles are on top of each other */
  if (dist < 1) return;

  /* Outside the interaction radius? */
  if (dist > a.r + b.r + magnetismRadius) return;

  // normal & tangent vectors
  const nx = dx / dist;
  const ny = dy / dist;

  // Apply the pull
  // Conditions to avoid divide by zero
  if (nx != 0) {
    a.vx += nx * magnetism * dt;
    b.vx -= nx * magnetism * dt;
    a.vx *= DAMPING;     // Apply damping to counteract calculation inaccuracies
    b.vx *= DAMPING;     // that have a tendency increase total system energy
  }                      // and destabilizing orbits
  if (ny != 0) {
    a.vy += ny * magnetism * dt;
    b.vy -= ny * magnetism * dt;
    a.vy *= DAMPING;
    b.vy *= DAMPING;
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

/* ----------  INITIALISE BALLS ---------- */
function initBalls(type) {
  balls = [];
  for (let i = 0; i < numBalls; i++) {
    let x = radius + Math.random() * (width - 2 * radius);
    let y = radius + Math.random() * (height - 2 * radius);
    b = initSingleBall(x, y, type);
    balls.push(b);
  }
}

function initSingleBall(x, y, type) {
  let r = radius;

  // random direction & speed
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * maxSpeed;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  return new Ball(x, y, vx, vy, r, type.color, type.magnetic);
}

function customPlaceBall(x, y, type) {
  b = initSingleBall(x, y, type);
  balls.push(b);
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

  // ball-ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveMagnetism(balls[i], balls[j], dt);
      resolveBallCollision(balls[i], balls[j]);
    }
    //totalEnergy += Math.abs(balls[i].vx) + Math.abs(balls[i].vy);
  }
  //maxTotalEnergy = ( totalEnergy > maxTotalEnergy ? maxTotalEnergy = totalEnergy : maxTotalEnergy );
  //console.log(`Total Energy: ${maxTotalEnergy.toFixed(1)}, ${totalEnergy.toFixed(1)}`);
  //totalEnergy = 0;

  for (const ball of balls) ball.draw();

  requestAnimationFrame(animate);
}

/* ----------- SET LABEL VALUES ----------- */

sizeVal.textContent = radius.toFixed(0);
numVal.textContent = numberSlider.value;
gravityVal.textContent = gravity.toFixed(2);
speedVal.textContent = maxSpeed.toFixed(1);
magnetismForceVal.textContent = magnetism.toFixed(2);
magnetismRadVal.textContent = magnetismRadius.toFixed(1);

/* --------  UI SLIDERR LISTENERS -------- */

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

magnetismForceSlider.addEventListener('input', e => {
  magnetism = parseFloat(e.target.value);
  magnetismForceVal.textContent = magnetism.toFixed(2);
});

magnetismRadiusSlider.addEventListener('input', e => {
  magnetismRadius = parseFloat(e.target.value);
  magnetismRadVal.textContent = magnetismRadius.toFixed(1);
});


/* ---------  BUTTON LISTENERS --------- */

resetBtn.addEventListener('click', () => {
  initBalls( ( mode==2 ? magnetic : inert ) );
});

placeNone.addEventListener('click', () => {
  placeBlue.classList.remove("active");
  placeRed.classList.remove("active");
  placeWall.classList.remove("active");
  mode = 0
});
placeBlue.addEventListener('click', () => {
  placeBlue.classList.add("active");
  placeRed.classList.remove("active");
  placeWall.classList.remove("active");
  mode = 1
});
placeRed.addEventListener('click', () => {
  placeBlue.classList.remove("active");
  placeRed.classList.add("active");
  placeWall.classList.remove("active");
  mode = 2
});
placeWall.addEventListener('click', () => {
  placeBlue.classList.remove("active");
  placeRed.classList.remove("active");
  placeWall.classList.add("active");
  mode = 3
});

/* ----------  MOUSE EVENT LISTENERS ---------- */

canvas.addEventListener('click', e => {
  if (mode != 1 && mode != 2 ) return
  if (mode == 1) {
    type = inert;
  } else if (mode == 2) {
    type = magnetic;
  }
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  customPlaceBall(x, y, type);
});

/* ----------  START ---------- */
resizeCanvas();
initBalls(inert);
requestAnimationFrame(animate);
