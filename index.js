const COLORS = {
  grid: "rgba(15, 23, 42, 0.12)",
  axis: "#334155",
  pulse: "#0d6efd",
  avg: "#0ea5e9",
  target: "#f43f5e"
};

const controls = {
  vcc: document.getElementById("vcc"),
  targetVoltage: document.getElementById("targetVoltage"),
  dutyCycle: document.getElementById("dutyCycle"),
  frequency: document.getElementById("frequency"),
  matchDuty: document.getElementById("matchDuty")
};

const labels = {
  vccVal: document.getElementById("vccVal"),
  targetVal: document.getElementById("targetVal"),
  dutyVal: document.getElementById("dutyVal"),
  freqVal: document.getElementById("freqVal"),
  dutyHint: document.getElementById("dutyHint"),
  avgVoltage: document.getElementById("avgVoltage"),
  errorVoltage: document.getElementById("errorVoltage"),
  onTime: document.getElementById("onTime"),
  offTime: document.getElementById("offTime"),
  ledLabel: document.getElementById("ledLabel"),
  motorLabel: document.getElementById("motorLabel")
};

const pwmCanvas = document.getElementById("pwmCanvas");
const ledBulb = document.getElementById("ledBulb");
const motorRotor = document.getElementById("motorRotor");

function getAxisFont() {
  const root = getComputedStyle(document.documentElement);
  const size = root.getPropertyValue("--axis-font-size").trim() || "12px";
  const family = root.getPropertyValue("--axis-font-family").trim() || "IBM Plex Sans, Segoe UI, sans-serif";
  return `${size} ${family}`;
}

let state = {
  vcc: 12,
  target: 6,
  duty: 50,
  frequency: 500,
  avgVoltage: 6,
  motorSpeed: 0,
  motorAngle: 0,
  lastTime: performance.now()
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fitCanvasToDisplay(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(460, Math.floor(rect.width * dpr));
  const height = Math.max(190, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function getData() {
  state.vcc = Number(controls.vcc.value);
  controls.targetVoltage.max = String(state.vcc);
  if (Number(controls.targetVoltage.value) > state.vcc) {
    controls.targetVoltage.value = String(state.vcc);
  }

  state.target = Number(controls.targetVoltage.value);
  state.duty = Number(controls.dutyCycle.value);
  state.frequency = Number(controls.frequency.value);
  state.avgVoltage = state.vcc * (state.duty / 100);

  const suggestedDuty = state.vcc === 0 ? 0 : (state.target / state.vcc) * 100;
  labels.dutyHint.textContent = `Suggested duty: ${clamp(suggestedDuty, 0, 100).toFixed(1)}%`;
}

function updateTexts() {
  const period = 1 / state.frequency;
  const onTime = period * (state.duty / 100);
  const offTime = period - onTime;
  const error = state.avgVoltage - state.target;

  labels.vccVal.textContent = `${state.vcc.toFixed(1)} V`;
  labels.targetVal.textContent = `${state.target.toFixed(1)} V`;
  labels.dutyVal.textContent = `${state.duty.toFixed(0)}%`;
  labels.freqVal.textContent = `${state.frequency.toFixed(0)} Hz`;
  labels.avgVoltage.textContent = `${state.avgVoltage.toFixed(2)} V`;
  labels.errorVoltage.textContent = `${error.toFixed(2)} V`;
  labels.onTime.textContent = `${(onTime * 1000).toFixed(2)} ms`;
  labels.offTime.textContent = `${(offTime * 1000).toFixed(2)} ms`;
}

function drawGrid(ctx, width, height, left = 0, top = 0) {
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const vCount = 10;
  const hCount = 6;

  for (let i = 1; i < vCount; i += 1) {
    const x = left + (i / vCount) * width;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
  }

  for (let i = 1; i < hCount; i += 1) {
    const y = top + (i / hCount) * height;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPwmWave() {
  fitCanvasToDisplay(pwmCanvas);
  const ctx = pwmCanvas.getContext("2d");
  const width = pwmCanvas.width;
  const height = pwmCanvas.height;

  ctx.clearRect(0, 0, width, height);
  const padLeft = 56;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 44;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  drawGrid(ctx, plotWidth, plotHeight, padLeft, padTop);

  const top = padTop;
  const bottom = padTop + plotHeight;
  const avgY = bottom - (state.avgVoltage / state.vcc) * (bottom - top);
  const targetY = bottom - (state.target / state.vcc) * (bottom - top);

  ctx.save();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padLeft, bottom);
  ctx.lineTo(padLeft + plotWidth, bottom);
  ctx.moveTo(padLeft, top);
  ctx.lineTo(padLeft, bottom);
  ctx.stroke();
  ctx.restore();

  const cycles = 8;
  const periodPx = plotWidth / cycles;
  const onWidth = periodPx * (state.duty / 100);

  ctx.save();
  ctx.strokeStyle = COLORS.pulse;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  let x = padLeft;
  ctx.moveTo(padLeft, bottom);
  for (let i = 0; i < cycles; i += 1) {
    ctx.lineTo(x, top);
    ctx.lineTo(x + onWidth, top);
    ctx.lineTo(x + onWidth, bottom);
    ctx.lineTo(x + periodPx, bottom);
    x += periodPx;
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = COLORS.avg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, avgY);
  ctx.lineTo(padLeft + plotWidth, avgY);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = COLORS.target;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, targetY);
  ctx.lineTo(padLeft + plotWidth, targetY);
  ctx.stroke();
  ctx.restore();

  const totalTimeMs = (cycles / state.frequency) * 1000;

  ctx.save();
  ctx.fillStyle = COLORS.axis;
  ctx.font = getAxisFont();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= cycles; i += 1) {
    const tx = padLeft + i * periodPx;
    const tMs = (i / cycles) * totalTimeMs;
    ctx.beginPath();
    ctx.moveTo(tx, bottom);
    ctx.lineTo(tx, bottom + 6);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillText(`${tMs.toFixed(2)} ms`, tx, bottom + 8);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`${state.vcc.toFixed(1)} V`, padLeft - 8, top);
  ctx.fillText("0 V", padLeft - 8, bottom);

  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("Time Axis (ms)", padLeft + plotWidth / 2, height - 2);

  ctx.textAlign = "left";
  ctx.fillText(`Window: ${totalTimeMs.toFixed(2)} ms @ ${state.frequency.toFixed(0)} Hz`, padLeft + 8, top + 14);
  ctx.restore();
}

function updateLed(nowMs) {
  const brightnessBase = clamp(state.avgVoltage / state.vcc, 0, 1);

  // Simulate persistence-of-vision effect: lower frequency -> visible flicker.
  let flickerFactor = 1;
  if (state.frequency < 90) {
    const period = 1000 / state.frequency;
    const onWindow = period * (state.duty / 100);
    const phase = nowMs % period;
    flickerFactor = phase < onWindow ? 1 : 0.15;
  }

  const brightness = clamp(brightnessBase * flickerFactor, 0, 1);
  const glow = 10 + 50 * brightness;
  ledBulb.style.filter = `brightness(${0.55 + brightness * 0.8})`;
  ledBulb.style.boxShadow = `0 0 ${glow}px rgba(250, 204, 21, ${0.35 + brightness * 0.55})`;
  labels.ledLabel.textContent = `Brightness: ${(brightnessBase * 100).toFixed(0)}%`;
}

function updateMotor(dtSeconds) {
  const targetSpeed = clamp(state.avgVoltage / state.vcc, 0, 1);

  // Inertia model: speed changes gradually instead of instantly.
  const response = clamp(dtSeconds * 2.8, 0, 1);
  state.motorSpeed += (targetSpeed - state.motorSpeed) * response;

  const maxDegPerSec = 900;
  const currentDegPerSec = state.motorSpeed * maxDegPerSec;
  state.motorAngle = (state.motorAngle + currentDegPerSec * dtSeconds) % 360;
  motorRotor.style.transform = `rotate(${state.motorAngle.toFixed(2)}deg)`;
  labels.motorLabel.textContent = `Speed: ${(state.motorSpeed * 100).toFixed(0)}%`;
}

function renderStatic() {
  getData();
  updateTexts();
  drawPwmWave();
}

function tick(now) {
  const dt = (now - state.lastTime) / 1000;
  state.lastTime = now;

  updateLed(now);
  updateMotor(dt);
  requestAnimationFrame(tick);
}

controls.matchDuty.addEventListener("click", () => {
  getData();
  const newDuty = clamp((state.target / state.vcc) * 100, 0, 100);
  controls.dutyCycle.value = String(newDuty.toFixed(0));
  renderStatic();
});

Object.values(controls).forEach((el) => {
  if (el instanceof HTMLInputElement) {
    el.addEventListener("input", renderStatic);
    el.addEventListener("change", renderStatic);
  }
});

window.addEventListener("resize", renderStatic);
renderStatic();
requestAnimationFrame(tick);
