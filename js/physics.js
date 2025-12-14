import { Ball } from "./ball.js";

const laws = {
    tscale: 1.0,

    magnetism: 0.0,
    magnetismRadius: 0,
    gravity: 0.0,

    fusion: false,
    fusionP: 0.0,
    fusionI: 0.0
};

export default laws;

const DAMPING = 0.00005 //0.99995; // Apply damping to counteract calculation inaccuracies

/* ----------  COLLISION RESOLUTION ---------- */

export function resolveBallCollision(a, b, addBall) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist > a.r + b.r) return; // no overlap or already separated
  if (a.remove || b.remove) return;

  if (laws.fusion) {
    if (resolveFusion(a, b, addBall)) return;
  }

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

export function resolveMagnetism(a, b, dt) {
  if (!a.magnetic || !b.magnetic) return;         // Ignore inert balls
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const dist = Math.hypot(dx, dy);

  /* Skip if the particles are on top of each other */
  if (dist < 1) return;

  /* Outside the interaction radius? */
  if (dist > a.r + b.r + laws.magnetismRadius) return;

  const forceA = (a.radiate ? -laws.fusionI*100 : laws.magnetism);
  const forceB = (b.radiate ? -laws.fusionI*100 : laws.magnetism);
  const force = (forceA + forceB)/2

  // normal & tangent vectors
  const nx = dx / dist;
  const ny = dy / dist;

  const tDamping = DAMPING * laws.tscale

  // Apply the pull
  // Conditions to avoid divide by zero
  if (nx != 0) {
    a.vx += nx * force / a.m * dt * laws.tscale;
    b.vx -= nx * force / b.m * dt * laws.tscale;
    a.vx *= (1 - tDamping);     // Apply damping to counteract calculation inaccuracies
    b.vx *= (1 - tDamping);     // that have a tendency increase total system energy
  }                      // and destabilizing orbits
  if (ny != 0) {
    a.vy += ny * force / a.m * dt * laws.tscale;
    b.vy -= ny * force / b.m * dt * laws.tscale;
    a.vy *= (1 - tDamping);
    b.vy *= (1 - tDamping);
  }
}

/* --- FUSION --- */

export function resolveFusion(a, b, addBall) {
  if (!a.magnetic || !b.magnetic) return false;   // Fuse only magnetic elements
  if (Math.random() > (1/laws.fusionP)) return false;  // Fuse chance
  if (a.next == null) return false;               // Don't fuse heavies elements
  if (a.m != b.m) return false;                   // Don't fuse heterogenious pairs
  const newX = a.x + (a.x - b.x) / 2
  const newY = a.y + (a.y - b.y) / 2
  const newVX = (a.vx + b.vx) / (2*a.m);
  const newVY = (a.vy + b.vy) / (2*a.m);
  const ball = new Ball(newX, newY, newVX, newVY, a.r, a.next);
  ball.radiate = true;
  addBall(ball);
  a.remove = true;
  b.remove = true;
  return true;
}
