import {state, initBalls, resizeBalls, initSingleBall} from "./simulation.js";
import laws from "./physics.js";
import * as ball from "./ball.js";


const switches = document.getElementsByClassName('typeSwitch');

export function listen() {
  /* --------  UI SLIDERR LISTENERS -------- */

  numberSlider.addEventListener('input', e => {
    state.numBalls = numberSlider.value;
    numVal.textContent = numberSlider.value;
  });

  sizeSlider.addEventListener('input', e => {
    state.radius = parseFloat(e.target.value);
    sizeVal.textContent = state.radius.toFixed(0);
    // resize existing balls
    resizeBalls();
  });

  gravitySlider.addEventListener('input', e => {
    laws.gravity = parseFloat(e.target.value);
    gravityVal.textContent = laws.gravity.toFixed(1);
  });

  speedSlider.addEventListener('input', e => {
    state.maxSpeed = parseFloat(e.target.value);
    speedVal.textContent = state.maxSpeed.toFixed(0);
  });

  magnetismForceSlider.addEventListener('input', e => {
    laws.magnetism = parseFloat(e.target.value);
    magnetismForceVal.textContent = laws.magnetism.toFixed(0);
  });

  magnetismRadiusSlider.addEventListener('input', e => {
    laws.magnetismRadius = parseFloat(e.target.value);
    magnetismRadVal.textContent = laws.magnetismRadius.toFixed(0);
  });

  timescale.addEventListener('input', e => {
    laws.tscale = parseFloat(e.target.value);
    timescaleVal.textContent = laws.tscale.toFixed(2);
  });

  fusionRatio.addEventListener('input', e => {
    laws.fusionP = parseFloat(e.target.value);
    fusionRatioVal.textContent = laws.fusionP.toFixed(0);
  });

  fusionImpulse.addEventListener('input', e => {
    laws.fusionI = parseInt(e.target.value);
    fusionImpulseVal.textContent = laws.fusionI.toFixed(0);
  });


  /* ---------  BUTTON LISTENERS --------- */

  resetBtn.addEventListener('click', () => {
    initBalls( ( state.insertMode==2 ? ball.alpha : ball.inert ) );
  });

  placeNone.addEventListener('click', () => {
    Array.from(switches).forEach(element => {
      element.classList.remove("active");
    });
    state.insertMode = 0;
  });
  placeBlue.addEventListener('click', () => {
    Array.from(switches).forEach(element => {
      element.classList.remove("active");
    });
    placeBlue.classList.add("active");
    state.insertMode = 1;
  });
  placeRed.addEventListener('click', () => {
    Array.from(switches).forEach(element => {
      element.classList.remove("active");
    });
    placeRed.classList.add("active");
    state.insertMode = 2;
  });
  placeYellow.addEventListener('click', () => {
    Array.from(switches).forEach(element => {
      element.classList.remove("active");
    });
    placeYellow.classList.add("active");
    state.insertMode = 3;
  });
  placeWall.addEventListener('click', () => {
    Array.from(switches).forEach(element => {
      element.classList.remove("active");
    });
    placeWall.classList.add("active");
    state.insertMode = 4;
  });
  fusionEnabled.addEventListener('click', () => {
    laws.fusion = fusionEnabled.checked;
  });

  /* ----------  MOUSE EVENT LISTENERS ---------- */

  canvas.addEventListener('click', e => {
    let type = null;
    if (state.insertMode != 1 && state.insertMode != 2 && state.insertMode != 3 ) return
    if (state.insertMode == 1) {
      type = ball.inert;
    } else if (state.insertMode == 2) {
      type = ball.alpha;
    } else if (state.insertMode == 3) {
      type = ball.beta;
    }
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    initSingleBall(x, y, type);
  });
}
