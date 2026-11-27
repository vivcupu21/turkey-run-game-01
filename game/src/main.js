// SPDX-License-Identifier: MIT
// Turkey Run: the game itself — state machine (title / playing / caught /
// escaped), the loop, physics, scoring, HUD data and the headless self-test.
'use strict';

const TurkeyGame = (function () {
  const C = TURKEY_CONFIG;

  function TurkeyGame(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'title';
    this.world = new TurkeyWorld(1);
    this.turkey = { y: C.groundY, vy: 0, airborne: false, jumps: 0, sliding: false, runPhase: 0, invincibleUntil: -1 };
    this.score = 0;
    this.cornPoints = 0;
    this.cornEaten = 0;
    this.lives = C.startLives;
    this.bestScore = 0;
    this.stage = TURKEY_STAGES[0];
    this.scrollX = 0;
    this.time = 0;
    this.paused = false;
    this.frozen = false;
    this.spottedUntil = -1;
    this.lastTick = 0;
    this.loadBestScore();
  }

  TurkeyGame.prototype.loadBestScore = function () {
    try {
      const saved = window.localStorage.getItem('turkey-run-best');
      this.bestScore = saved ? parseInt(saved, 10) || 0 : 0;
    } catch (err) {
      this.bestScore = 0;
    }
  };

  TurkeyGame.prototype.saveBestScore = function () {
    try {
      window.localStorage.setItem('turkey-run-best', String(Math.max(this.bestScore, this.score)));
    } catch (err) {
      /* storage unavailable (file:// in some browsers); best score is a bonus */
    }
    this.bestScore = Math.max(this.bestScore, this.score);
  };

  TurkeyGame.prototype.startRun = function (seed) {
    const useSeed = typeof seed === 'number' ? seed : Math.floor(Math.random() * 2147483647);
    this.world.reset(useSeed);
    this.turkey = { y: C.groundY, vy: 0, airborne: false, jumps: 0, sliding: false, runPhase: 0, invincibleUntil: -1 };
    this.score = 0;
    this.cornPoints = 0;
    this.cornEaten = 0;
    this.lives = C.startLives;
    this.stage = TURKEY_STAGES[0];
    this.scrollX = 0;
    this.spottedUntil = -1;
    this.paused = false;
    this.state = 'playing';
    TurkeySound.unlock();
    TurkeySound.gobble();
  };

  TurkeyGame.prototype.jump = function () {
    if (this.state === 'title') { this.startRun(); return; }
    if (this.state === 'caught' || this.state === 'escaped') { this.startRun(); return; }
    if (this.state !== 'playing' || this.paused) return;
    if (!this.turkey.airborne) {
      this.turkey.vy = C.jumpVelocity;
      this.turkey.airborne = true;
      this.turkey.jumps = 1;
      this.turkey.sliding = false;
      TurkeySound.jump();
    } else if (this.turkey.jumps < 2) {
      this.turkey.vy = C.doubleJumpVelocity;
      this.turkey.jumps = 2;
      TurkeySound.doubleJump();
    }
  };

  TurkeyGame.prototype.slideStart = function () {
    if (this.state !== 'playing' || this.paused) return;
    if (!this.turkey.airborne) {
      this.turkey.sliding = true;
      TurkeySound.slide();
    }
  };

  TurkeyGame.prototype.slideEnd = function () {
    this.turkey.sliding = false;
  };

  TurkeyGame.prototype.togglePause = function () {
    if (this.state === 'playing') this.paused = !this.paused;
  };

  TurkeyGame.prototype.toggleMute = function () {
    TurkeySound.setMuted(!TurkeySound.isMuted());
  };

  TurkeyGame.prototype.update = function (dt) {
    if (this.state !== 'playing' || this.paused) return;
    const t = this.turkey;
    // Vertical physics.
    if (t.airborne) {
      t.vy += C.gravity * dt;
      t.y += t.vy * dt;
      if (t.y >= C.groundY) {
        t.y = C.groundY;
        t.vy = 0;
        t.airborne = false;
        t.jumps = 0;
      }
    }
    t.runPhase += dt * (this.world.speed / 34);
    this.world.update(dt, t);
    this.scrollX = this.world.distanceMetres * C.pixelsPerMetre;
    this.stage = this.world.stageFor(this.world.distanceMetres);

    // Corn.
    const corn = this.world.checkCorn(t);
    if (corn.gained > 0) {
      this.cornPoints += corn.gained;
      this.cornEaten += corn.count;
      if (corn.golden) TurkeySound.goldenCorn();
      else TurkeySound.corn();
    }
    this.score = Math.floor(this.world.distanceMetres) * C.metreScore + this.cornPoints;

    // Hits.
    if (this.time >= t.invincibleUntil) {
      const hits = this.world.checkHits(t);
      if (hits.length > 0) {
        this.lives -= 1;
        this.world.stumble();
        t.invincibleUntil = this.time + C.invincibleSeconds;
        this.spottedUntil = this.time + 0.7;
        TurkeySound.hit();
        // Remove the obstacle that caught the turkey so one hit is one life.
        for (let i = 0; i < hits.length; i++) {
          const idx = this.world.obstacles.indexOf(hits[i]);
          if (idx >= 0) this.world.obstacles.splice(idx, 1);
        }
        if (this.lives <= 0) {
          this.state = 'caught';
          this.saveBestScore();
          TurkeySound.caught();
          return;
        }
      }
    }

    // Escape!
    if (this.world.distanceMetres >= C.escapeDistance) {
      this.state = 'escaped';
      this.saveBestScore();
      TurkeySound.escaped();
    }
  };

  TurkeyGame.prototype.render = function () {
    const ctx = this.ctx;
    const t = this.turkey;
    TurkeyRender.drawBackground(ctx, this.stage, this.scrollX, this.time);
    for (let i = 0; i < this.world.corns.length; i++) {
      const corn = this.world.corns[i];
      if (!corn.taken) TurkeyRender.drawCorn(ctx, corn);
    }
    for (let i = 0; i < this.world.obstacles.length; i++) {
      const ob = this.world.obstacles[i];
      if (ob.kind === 'hay') TurkeyRender.drawHayBale(ctx, ob);
      else if (ob.kind === 'fence') TurkeyRender.drawFence(ctx, ob);
      else if (ob.kind === 'oven') TurkeyRender.drawOven(ctx, ob, this.time);
      else if (ob.kind === 'knife') TurkeyRender.drawKnife(ctx, ob);
    }
    const farmerX = this.world.farmerX(this.lives, this.state === 'caught');
    TurkeyRender.drawFarmer(ctx, farmerX, C.groundY, t.runPhase, this.state === 'caught');
    TurkeyRender.drawTurkey(ctx, C.turkeyX, t.y, {
      runPhase: t.runPhase,
      sliding: t.sliding,
      airborne: t.airborne,
      invincible: this.time < t.invincibleUntil,
      time: this.time,
    });
    if (this.state === 'playing') TurkeyRender.drawHud(ctx, this);
    if (this.time < this.spottedUntil && this.state === 'playing') TurkeyRender.drawSpotted(ctx, this.time);
    if (this.state === 'title') {
      // A hero turkey posing on the title screen, clear of the centred text.
      TurkeyRender.drawTurkey(ctx, C.turkeyX + 760, C.groundY, { runPhase: 0.6, sliding: false, airborne: false, invincible: false, time: this.time });
      TurkeyRender.drawTitle(ctx, this, this.time);
    }
    if (this.state === 'caught') TurkeyRender.drawEnd(ctx, this, 'caught', this.time);
    if (this.state === 'escaped') TurkeyRender.drawEnd(ctx, this, 'escaped', this.time);
    if (this.paused && this.state === 'playing') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, C.canvasWidth, C.canvasHeight);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 54px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED — press P to resume', C.canvasWidth / 2, C.canvasHeight / 2);
      ctx.restore();
    }
    const debug = document.getElementById('debug-state');
    if (debug) {
      debug.textContent = JSON.stringify({
        state: this.state,
        score: this.score,
        distance: Math.floor(this.world.distanceMetres),
        lives: this.lives,
        stage: this.stage.name,
        obstacles: this.world.obstacles.length,
      });
    }
  };

  TurkeyGame.prototype.tick = function (nowMs) {
    if (!this.frozen) {
      const dt = Math.min(0.033, Math.max(0.0001, (nowMs - this.lastTick) / 1000));
      this.time += dt;
      this.update(dt);
    }
    this.render();
    this.lastTick = nowMs;
  };

  // Headless self-test (?selftest=1): fixed-step auto-play, twice with the
  // same seed, proving the loop, collisions, scoring and determinism.
  TurkeyGame.prototype.runSelfTest = function () {
    function simulate(game, seed) {
      game.startRun(seed);
      let jumps = 0;
      let slides = 0;
      const dt = 1 / 60;
      for (let step = 0; step < 3600; step++) {
        game.time += dt;
        // Simple auto-player: jump before near obstacles, double-jump when
        // falling short, run under a knife whose blade has swung up.
        let nearest = null;
        for (let i = 0; i < game.world.obstacles.length; i++) {
          const ob = game.world.obstacles[i];
          const gap = ob.x - TURKEY_CONFIG.turkeyX;
          if (gap > -40 && gap < 320 && (!nearest || ob.x < nearest.x)) nearest = ob;
        }
        if (nearest) {
          const gap = nearest.x - TURKEY_CONFIG.turkeyX;
          if (nearest.kind === 'knife') {
            const angle = Math.sin(nearest.phase) * 0.9;
            const tipY = (TURKEY_CONFIG.groundY - 146) + Math.cos(angle) * 118;
            const bladeLow = tipY > TURKEY_CONFIG.groundY - 100;
            if (bladeLow && gap < 200 && !game.turkey.airborne) { game.jump(); jumps++; }
            else if (bladeLow && gap < 130 && game.turkey.airborne && game.turkey.vy > 0) { game.jump(); jumps++; }
          } else if (gap < 240 && !game.turkey.airborne) {
            game.jump();
            jumps++;
          } else if (gap < 140 && game.turkey.airborne && game.turkey.vy > 0 && game.turkey.jumps < 2) {
            game.jump();
            jumps++;
          }
          game.slideEnd();
        } else {
          game.slideEnd();
        }
        game.update(dt);
        if (game.state !== 'playing') break;
      }
      return {
        state: game.state,
        score: game.score,
        distance: Math.floor(game.world.distanceMetres),
        lives: game.lives,
        corn: game.cornEaten,
        jumps: jumps,
        slides: slides,
      };
    }
    const first = simulate(this, 99);
    const second = simulate(this, 99);
    const deterministic = JSON.stringify(first) === JSON.stringify(second);
    const result = {
      selftest: 'turkey-run',
      deterministic: deterministic,
      run1: first,
      run2: second,
      played: first.distance > 100 && first.score > 100,
    };
    const el = document.getElementById('selftest');
    if (el) el.textContent = JSON.stringify(result);
    document.title = 'SELFTEST ' + JSON.stringify(result);
    return result;
  };

  return TurkeyGame;
})();

(function bootTurkeyRun() {
  const canvas = document.getElementById('game-canvas');
  const game = new TurkeyGame(canvas);
  window.__turkeyRun = game;

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    game.frozen = true;
    game.time = 0.5;
    buildShotScene(game, shot);
  }
  if (params.get('selftest') === '1') {
    game.runSelfTest();
  }

  new TurkeyInput({
    onJump: function () { game.jump(); },
    onSlideStart: function () { game.slideStart(); },
    onSlideEnd: function () { game.slideEnd(); },
    onRestart: function () { if (game.state === 'caught' || game.state === 'escaped') game.startRun(); },
    onPause: function () { game.togglePause(); },
    onMute: function () { game.toggleMute(); },
    onConfirm: function () { game.jump(); },
    onTap: function () { game.jump(); },
  });

  function frame(nowMs) {
    game.tick(nowMs);
    window.requestAnimationFrame(frame);
  }
  game.lastTick = performance.now();
  window.requestAnimationFrame(frame);
})();
