/* ----------  CONFIGURATION ---------- */

const INERT_BALL_COLOR = '#527dff';
const MAGNETIC_BALL_COLOR = '#ff5252';
const BETA_BALL_COLOR = '#ffd152';
const GAMMA_BALL_COLOR = '#66ff52';
const DELTA_BALL_COLOR = '#9d52ff';
const BG_COLOR = '#000';
const DAMPING = 0.00005 //0.99995; // Apply damping to counteract calculation inaccuracies

/* ----------  CANVAS SET-UP ---------- */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const targetWidth = 980;
let width = canvas.width;

/* ----------  UI ELEMENTS ---------- */

/*
 * Element ID is automatically a variable. No need to getElementById()
 */

const switches = document.getElementsByClassName('typeSwitch');

/* ----------  STATE ---------- */
let balls = [];
let numBalls = parseInt(numberSlider.value);              // how many balls at start
let radius = parseFloat(sizeSlider.value);
let gravity = parseFloat(gravitySlider.value);
let maxSpeed = parseFloat(speedSlider.value);

let magnetism = parseFloat(magnetismForceSlider.value);
let magnetismRadius = parseInt(magnetismRadiusSlider.value);

let tscale = parseFloat(timescale.value);

let fusion = fusionEnabled.checked;
let fusionP = parseFloat(fusionRatio.value);
let fusionI = parseFloat(fusionImpulse.value);

let insertMode = 0;


/* ----------  BALL CLASS ---------- */
class Ball {
  constructor(x, y, vx, vy, r, type) {
    this.x  = x;
    this.y  = y;
    this.vx = vx;
    this.vy = vy;
    this.r  = r;
    this.m  = type.mass;
    this.color = type.color;
    this.magnetic = type.magnetic;
    this.next = type.next;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  move(dt) {
    // apply gravity
    this.vy += gravity * dt * tscale;
    // update position
    this.x += this.vx * dt * tscale;
    this.y += this.vy * dt * tscale;
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
  constructor(color, magnetic, mass, next) {
    this.color = color;
    this.magnetic = magnetic;
    this.mass = mass;
    this.next = next;
  }
}

const delta = new BallType(DELTA_BALL_COLOR, true, 8, null);
const gamma = new BallType(GAMMA_BALL_COLOR, true, 4, delta);
const beta = new BallType(BETA_BALL_COLOR, true, 2, gamma);
const alpha = new BallType(MAGNETIC_BALL_COLOR, true, 1, beta);
const inert = new BallType(INERT_BALL_COLOR, false, 1, "null");

/* ----------  COLLISION RESOLUTION ---------- */

function resolveBallCollision(a, b) {
  if ( fusion ) {
    resolveFusion(a, b);
    return;
  }
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
  // Velocity components in normal / tangent directions
  const vaDotN = a.vx * nx + a.vy * ny;  // a's normal component
  const vaDotT = a.vx * tx + a.vy * ty;  // a's tangent component (unchanged)
  const vbDotN = b.vx * nx + b.vy * ny;  // b's normal component
  const vbDotT = b.vx * tx + b.vy * ty;  // b's tangent component (unchanged)


  // New normal velocities after collision, accounting for masses
  const m1 = a.m;
  const m2 = b.m;
  const denom = m1 + m2;
  const vaNewN = (vaDotN * (m1 - m2) + 2 * m2 * vbDotN) / denom;
  const vbNewN = (vbDotN * (m2 - m1) + 2 * m1 * vaDotN) / denom;

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

  const tDamping = DAMPING * tscale

  // Apply the pull
  // Conditions to avoid divide by zero
  if (nx != 0) {
    a.vx += nx * magnetism * dt * tscale;
    b.vx -= nx * magnetism * dt * tscale;
    a.vx *= (1 - tDamping);     // Apply damping to counteract calculation inaccuracies
    b.vx *= (1 - tDamping);     // that have a tendency increase total system energy
  }                      // and destabilizing orbits
  if (ny != 0) {
    a.vy += ny * magnetism * dt * tscale;
    b.vy -= ny * magnetism * dt * tscale;
    a.vy *= (1 - tDamping);
    b.vy *= (1 - tDamping);
  }
}

/* --- FUSION --- */

function resolveFusion(a, b) {
  Math.random()
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
  }
}

function initSingleBall(x, y, type) {
  let r = radius;
  // random direction & speed
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * maxSpeed;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  b = new Ball(x, y, vx, vy, r, type);
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
  }

  for (const ball of balls) ball.draw();

  requestAnimationFrame(animate);
}

/* ----------- SET LABEL VALUES ----------- */

sizeVal.textContent = radius.toFixed(0);
numVal.textContent = numberSlider.value;
gravityVal.textContent = gravity.toFixed(1);
speedVal.textContent = maxSpeed.toFixed(0);
magnetismForceVal.textContent = magnetism.toFixed(0);
magnetismRadVal.textContent = magnetismRadius.toFixed(0);
timescaleVal.textContent = tscale.toFixed(2);
fusionRatioVal.textContent = fusionP.toFixed(0);
fusionImpulseVal.textContent = fusionI.toFixed(0);

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
  gravityVal.textContent = gravity.toFixed(1);
});

speedSlider.addEventListener('input', e => {
  maxSpeed = parseFloat(e.target.value);
  speedVal.textContent = maxSpeed.toFixed(0);
});

magnetismForceSlider.addEventListener('input', e => {
  magnetism = parseFloat(e.target.value);
  magnetismForceVal.textContent = magnetism.toFixed(0);
});

magnetismRadiusSlider.addEventListener('input', e => {
  magnetismRadius = parseFloat(e.target.value);
  magnetismRadVal.textContent = magnetismRadius.toFixed(0);
});

timescale.addEventListener('input', e => {
  tscale = parseFloat(e.target.value);
  timescaleVal.textContent = tscale.toFixed(2);
});

fusionRatio.addEventListener('input', e => {
  fusionP = parseFloat(e.target.value);
  fusionRatioVal.textContent = fusionP.toFixed(0);
});

fusionImpulse.addEventListener('input', e => {
  fusionI = fusionImpulse(e.target.value);
  fusionImpulseVal.textContent = fusionI.toFixed(0);
});


/* ---------  BUTTON LISTENERS --------- */

resetBtn.addEventListener('click', () => {
  initBalls( ( insertMode==2 ? alpha : inert ) );
});

placeNone.addEventListener('click', () => {
  Array.from(switches).forEach(element => {
    element.classList.remove("active");
  });
  insertMode = 0
});
placeBlue.addEventListener('click', () => {
  Array.from(switches).forEach(element => {
    element.classList.remove("active");
  });
  placeBlue.classList.add("active");
  insertMode = 1
});
placeRed.addEventListener('click', () => {
  Array.from(switches).forEach(element => {
    element.classList.remove("active");
  });
  placeRed.classList.add("active");
  insertMode = 2
});
placeYellow.addEventListener('click', () => {
  Array.from(switches).forEach(element => {
    element.classList.remove("active");
  });
  placeYellow.classList.add("active");
  insertMode = 3
});
placeWall.addEventListener('click', () => {
  Array.from(switches).forEach(element => {
    element.classList.remove("active");
  });
  placeWall.classList.add("active");
  insertMode = 4
});

/* ----------  MOUSE EVENT LISTENERS ---------- */

canvas.addEventListener('click', e => {
  if (insertMode != 1 && insertMode != 2 && insertMode != 3 ) return
  if (insertMode == 1) {
    type = inert;
  } else if (insertMode == 2) {
    type = alpha;
  } else if (insertMode == 3) {
    type = beta;
  }
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  initSingleBall(x, y, type);
});

/* ----------  START ---------- */

resizeCanvas();
initBalls(inert);
requestAnimationFrame(animate);
