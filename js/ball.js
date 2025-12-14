/* -----------  COLORS ----------- */

const INERT_BALL_COLOR = '#527dff';
const MAGNETIC_BALL_COLOR = '#ff5252';
const BETA_BALL_COLOR = '#ffd152';
const GAMMA_BALL_COLOR = '#66ff52';
const DELTA_BALL_COLOR = '#9d52ff';

/* ----------  BALL CLASS ---------- */

export class Ball {
  constructor(x, y, vx, vy, r, type) {
    this.typeID = type.id;
    this.x  = x;
    this.y  = y;
    this.vx = vx;
    this.vy = vy;
    this.r  = r;
    this.m  = type.mass;
    this.color = type.color;
    this.magnetic = type.magnetic;
    this.next = type.next;
    this.radiate = false;
    this.remove = false;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  move(dt, gravity, tscale) {
    // apply gravity
    this.vy += gravity * dt * tscale;
    // update position
    this.x += this.vx * dt * tscale;
    this.y += this.vy * dt * tscale;
  }

  // wall collision – perfectly elastic
  collideWall(width, height) {
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
export class BallType {
  constructor(id, color, magnetic, mass, next) {
    this.id = id;
    this.color = color;
    this.magnetic = magnetic;
    this.mass = mass;
    this.next = next;
  }
}

// Ball types

export const delta = new BallType(4, DELTA_BALL_COLOR, true, 8, null);
export const gamma = new BallType(3, GAMMA_BALL_COLOR, true, 4, delta);
export const beta = new BallType(2, BETA_BALL_COLOR, true, 2, gamma);
export const alpha = new BallType(1, MAGNETIC_BALL_COLOR, true, 1, beta);
export const inert = new BallType(0, INERT_BALL_COLOR, false, 1, "null");
