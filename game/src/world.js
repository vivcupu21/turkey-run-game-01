// SPDX-License-Identifier: MIT
// Turkey Run: the world — distance, speed, obstacle and corn spawning, the
// chasing farmer, collisions, lives and the escape. Pure game state, no drawing.
'use strict';

function TurkeyWorld(seed) {
  this.random = makeSeededRandom(seed);
  this.reset(seed);
}

TurkeyWorld.prototype.reset = function (seed) {
  this.random = makeSeededRandom(seed);
  this.distanceMetres = 0;
  this.speed = TURKEY_CONFIG.baseSpeed;
  this.obstacles = [];
  this.corns = [];
  this.nextSpawnX = 900;
  this.farmerThreat = 0;
  this.stumbleBoost = 0;
  this.spawnCount = 0;
};

TurkeyWorld.prototype.stageFor = function (distanceMetres) {
  let stage = TURKEY_STAGES[0];
  for (let i = 0; i < TURKEY_STAGES.length; i++) {
    if (distanceMetres >= TURKEY_STAGES[i].fromMetre) stage = TURKEY_STAGES[i];
  }
  return stage;
};

TurkeyWorld.prototype.speedFor = function (distanceMetres) {
  return Math.min(
    TURKEY_CONFIG.maxSpeed,
    TURKEY_CONFIG.baseSpeed + distanceMetres * TURKEY_CONFIG.speedPerMetre
  );
};

TurkeyWorld.prototype.spawnPattern = function (x) {
  const roll = this.random();
  const d = this.distanceMetres;
  let kind = 'hay';
  if (d < 120) kind = 'hay';
  else if (roll < 0.30) kind = 'hay';
  else if (roll < 0.52) kind = 'fence';
  else if (roll < 0.74) kind = 'oven';
  else kind = 'knife';
  const def = TURKEY_OBSTACLES[kind];
  this.obstacles.push({
    kind: kind,
    x: x,
    y: TURKEY_CONFIG.groundY - def.height,
    width: def.width,
    height: def.height,
    phase: this.random() * Math.PI * 2,
    swingSpeed: 2.2 + this.random() * 1.2,
    passed: false,
  });
  this.spawnCount++;

  // Corn arcs: a reward line over or beside the obstacle.
  if (this.random() < 0.72) {
    const golden = this.random() < 0.14;
    const baseY = kind === 'oven' ? TURKEY_CONFIG.groundY - 210 : TURKEY_CONFIG.groundY - 170;
    const count = 3 + Math.floor(this.random() * 3);
    for (let i = 0; i < count; i++) {
      this.corns.push({
        x: x + 30 + i * 42,
        y: baseY - Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 46,
        golden: golden && i === Math.floor(count / 2),
        taken: false,
        bob: this.random() * Math.PI * 2,
      });
    }
  }
  const gap = 300 + this.random() * 260 + Math.min(220, d * 0.12);
  this.nextSpawnX = x + def.width + gap;
};

TurkeyWorld.prototype.update = function (dt, turkey) {
  this.speed = this.speedFor(this.distanceMetres);
  const dx = this.speed * dt;
  this.distanceMetres += dx / TURKEY_CONFIG.pixelsPerMetre;
  this.stumbleBoost = Math.max(0, this.stumbleBoost - dt * 0.25);
  this.nextSpawnX -= dx;

  while (this.nextSpawnX < TURKEY_CONFIG.canvasWidth + 700) {
    this.spawnPattern(this.nextSpawnX);
  }
  for (let i = this.obstacles.length - 1; i >= 0; i--) {
    const ob = this.obstacles[i];
    ob.x -= dx;
    ob.phase += ob.swingSpeed * dt;
    if (ob.x + ob.width < -80) this.obstacles.splice(i, 1);
  }
  for (let i = this.corns.length - 1; i >= 0; i--) {
    const corn = this.corns[i];
    corn.x -= dx;
    corn.bob += dt * 5;
    if (corn.x < -40) this.corns.splice(i, 1);
  }
};

TurkeyWorld.prototype.turkeyRect = function (turkey) {
  const height = turkey.sliding ? TURKEY_CONFIG.turkeySlideHeight : TURKEY_CONFIG.turkeyStandHeight;
  return {
    x: TURKEY_CONFIG.turkeyX - 30,
    y: turkey.y - height + 14,
    width: 62,
    height: height,
  };
};

TurkeyWorld.prototype.obstacleRect = function (ob) {
  if (ob.kind === 'knife') {
    // The blade swings from a pivot: only its tip is dangerous. When the
    // blade hangs low the tip is at body height (jump it); when it swings
    // up the tip passes above the turkey's head (run under it).
    const angle = Math.sin(ob.phase) * 0.9;
    const pivotX = ob.x + ob.width / 2;
    const pivotY = TURKEY_CONFIG.groundY - 146;
    const tipX = pivotX + Math.sin(angle) * 118;
    const tipY = pivotY + Math.cos(angle) * 118;
    return { x: tipX - 16, y: tipY - 18, width: 32, height: 44 };
  }
  if (ob.kind === 'oven') return { x: ob.x + 8, y: ob.y + 6, width: ob.width - 16, height: ob.height - 6 };
  if (ob.kind === 'hay') return { x: ob.x + 4, y: ob.y + 10, width: ob.width - 8, height: ob.height - 10 };
  return { x: ob.x + 4, y: ob.y + 4, width: ob.width - 8, height: ob.height - 4 };
};

TurkeyWorld.prototype.rectsOverlap = function (a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

TurkeyWorld.prototype.checkHits = function (turkey) {
  const turkeyRect = this.turkeyRect(turkey);
  const hits = [];
  for (let i = 0; i < this.obstacles.length; i++) {
    const ob = this.obstacles[i];
    if (this.rectsOverlap(turkeyRect, this.obstacleRect(ob))) hits.push(ob);
  }
  return hits;
};

TurkeyWorld.prototype.checkCorn = function (turkey) {
  const turkeyRect = this.turkeyRect(turkey);
  let gained = 0;
  let golden = false;
  let count = 0;
  for (let i = 0; i < this.corns.length; i++) {
    const corn = this.corns[i];
    if (corn.taken) continue;
    const box = { x: corn.x - 16, y: corn.y - 20, width: 32, height: 40 };
    if (this.rectsOverlap(turkeyRect, box)) {
      corn.taken = true;
      gained += corn.golden ? TURKEY_CONFIG.goldenCornScore : TURKEY_CONFIG.cornScore;
      count += 1;
      if (corn.golden) golden = true;
    }
  }
  return { gained: gained, golden: golden, count: count };
};

TurkeyWorld.prototype.farmerX = function (lives, caught) {
  if (caught) return TURKEY_CONFIG.turkeyX - 66;
  const threat = (1 - lives / TURKEY_CONFIG.startLives) + this.stumbleBoost;
  const clamped = Math.max(0, Math.min(1, threat));
  return TURKEY_CONFIG.turkeyX - 300 + clamped * 250;
};

TurkeyWorld.prototype.stumble = function () {
  this.stumbleBoost = Math.min(1, this.stumbleBoost + 0.45);
};
