// SPDX-License-Identifier: MIT
// Turkey Run: all drawing — backgrounds, the turkey, the farmer, obstacles,
// corn, the HUD, the title screen and the end screens. Canvas 2D, no images.
'use strict';

const TurkeyRender = (function () {
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground(ctx, stage, scrollX, time) {
    const W = TURKEY_CONFIG.canvasWidth;
    const H = TURKEY_CONFIG.canvasHeight;
    const groundY = TURKEY_CONFIG.groundY;
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, stage.skyTop);
    sky.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundY + 2);

    // Sun.
    ctx.fillStyle = stage.sunColor;
    ellipse(ctx, 1080, 110, 52, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, 1080, 110, 66, 66);

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 340 - scrollX * 0.12 + time * 6) % (W + 320) + W + 320) % (W + 320) - 160;
      const cy = 70 + i * 34;
      ellipse(ctx, cx, cy, 62, 20);
      ellipse(ctx, cx + 44, cy + 6, 46, 16);
      ellipse(ctx, cx - 46, cy + 8, 40, 14);
    }

    // Far hills and near hills.
    ctx.fillStyle = stage.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 80) {
      ctx.lineTo(x, groundY - 90 - Math.sin((x + scrollX * 0.25) * 0.004) * 46);
    }
    ctx.lineTo(W, groundY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = stage.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 80) {
      ctx.lineTo(x, groundY - 34 - Math.sin((x + scrollX * 0.5) * 0.006 + 2) * 26);
    }
    ctx.lineTo(W, groundY);
    ctx.closePath();
    ctx.fill();

    // Stage silhouettes: barn in the farmyard, corn stalks in the cornfield,
    // a fence line on the lane, a farmhouse window in the kitchen, pines in the woods.
    ctx.fillStyle = stage.accent;
    ctx.globalAlpha = 0.55;
    if (stage.name === 'Farmyard') {
      const bx = 900 - ((scrollX * 0.6) % 1500);
      ctx.fillRect(bx, groundY - 150, 190, 150);
      ctx.beginPath();
      ctx.moveTo(bx - 16, groundY - 150);
      ctx.lineTo(bx + 95, groundY - 220);
      ctx.lineTo(bx + 206, groundY - 150);
      ctx.closePath();
      ctx.fill();
    } else if (stage.name === 'Cornfield') {
      for (let i = 0; i < 9; i++) {
        const sx = ((i * 170 - scrollX * 0.7) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.fillRect(sx, groundY - 150, 8, 150);
        ellipse(ctx, sx + 4, groundY - 160, 26, 12);
      }
    } else if (stage.name === 'The Woods') {
      for (let i = 0; i < 7; i++) {
        const sx = ((i * 220 - scrollX * 0.7) % (W + 240) + W + 240) % (W + 240) - 120;
        ctx.beginPath();
        ctx.moveTo(sx - 44, groundY);
        ctx.lineTo(sx, groundY - 190);
        ctx.lineTo(sx + 44, groundY);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Ground.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = stage.groundTop;
    ctx.fillRect(0, groundY, W, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 26; i++) {
      const gx = ((i * 97 - scrollX) % (W + 120) + W + 120) % (W + 120) - 60;
      ctx.fillRect(gx, groundY + 34 + (i % 3) * 26, 34, 5);
    }
    // Fence posts scrolling past.
    ctx.fillStyle = '#6b4a26';
    for (let i = 0; i < 9; i++) {
      const fx = ((i * 170 - scrollX) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.fillRect(fx, groundY - 44, 10, 44);
    }
    ctx.fillRect(0, groundY - 40, W, 7);
  }

  function drawTurkey(ctx, x, y, opts) {
    // y is the ground contact point. opts: runPhase, sliding, airborne, invincible, time.
    const phase = opts.runPhase || 0;
    const sliding = !!opts.sliding;
    const airborne = !!opts.airborne;
    ctx.save();
    if (opts.invincible && Math.floor((opts.time || 0) * 14) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.translate(x, y);
    if (sliding) ctx.scale(1.25, 0.62);

    const legSwing = airborne ? 0.5 : Math.sin(phase) * 0.9;
    // Legs.
    ctx.strokeStyle = '#e8912d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -26);
    ctx.lineTo(-8 + legSwing * 16, 0);
    ctx.moveTo(8, -26);
    ctx.lineTo(8 - legSwing * 16, 0);
    ctx.stroke();

    // Tail feathers fanned behind.
    for (let i = -2; i <= 2; i++) {
      const ang = -Math.PI / 2 + i * 0.42;
      const fx = Math.cos(ang) * 52;
      const fy = -34 + Math.sin(ang) * 52;
      ctx.strokeStyle = i % 2 === 0 ? '#a33d1e' : '#c96a2e';
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(-26, -40);
      ctx.lineTo(-26 + fx, -40 + fy);
      ctx.stroke();
      ctx.fillStyle = '#f2d8a0';
      ellipse(ctx, -26 + fx, -40 + fy, 7, 7);
    }

    // Body.
    ctx.fillStyle = '#8b5a2b';
    ellipse(ctx, 0, -46, 42, 34);
    ctx.fillStyle = '#b07a3e';
    ellipse(ctx, 8, -38, 28, 22);

    // Wing.
    ctx.fillStyle = '#6e451f';
    const flap = airborne ? -0.9 : Math.sin(phase * 1.4) * 0.35;
    ctx.save();
    ctx.translate(-4, -52);
    ctx.rotate(flap);
    ellipse(ctx, -6, 0, 26, 13);
    ctx.restore();

    // Head and neck.
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(24, -96, 16, 44);
    ctx.fillStyle = '#a06a33';
    ellipse(ctx, 36, -100, 19, 18);
    // Beak.
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.moveTo(50, -104);
    ctx.lineTo(68, -98);
    ctx.lineTo(50, -94);
    ctx.closePath();
    ctx.fill();
    // Wattle.
    ctx.fillStyle = '#d9382b';
    ellipse(ctx, 52, -88, 6, 10);
    // Eye.
    ctx.fillStyle = '#fff';
    ellipse(ctx, 40, -106, 6, 6);
    ctx.fillStyle = '#222';
    ellipse(ctx, 42, -106, 3, 3);
    // Snood.
    ctx.strokeStyle = '#d9382b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, -112);
    ctx.quadraticCurveTo(52, -104, 48, -96);
    ctx.stroke();

    ctx.restore();
  }

  function drawFarmer(ctx, x, y, runPhase, grabbing) {
    ctx.save();
    ctx.translate(x, y);
    const swing = Math.sin(runPhase) * 0.8;
    // Legs: blue overalls.
    ctx.strokeStyle = '#2f5da8';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -52);
    ctx.lineTo(-6 + swing * 18, 0);
    ctx.moveTo(6, -52);
    ctx.lineTo(6 - swing * 18, 0);
    ctx.stroke();
    // Body: red shirt + overalls.
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, -20, -104, 44, 58, 10);
    ctx.fill();
    ctx.fillStyle = '#2f5da8';
    ctx.fillRect(-20, -72, 44, 26);
    // Arm reaching forward with a pitchfork.
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(14, -92);
    ctx.lineTo(grabbing ? 58 : 40, grabbing ? -84 : -70);
    ctx.stroke();
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(40, -120);
    ctx.lineTo(58, -58);
    ctx.stroke();
    ctx.strokeStyle = '#cfd6dd';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 6, -120);
      ctx.lineTo(44 + i * 7, -138);
      ctx.stroke();
    }
    // Head + straw hat.
    ctx.fillStyle = '#f2c89b';
    ellipse(ctx, 4, -118, 17, 17);
    ctx.fillStyle = '#e8c96a';
    ellipse(ctx, 4, -130, 30, 8);
    ctx.fillStyle = '#d4af37';
    ellipse(ctx, 4, -138, 16, 10);
    // Mustache.
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-6, -110, 20, 5);
    ctx.fillStyle = '#222';
    ellipse(ctx, 10, -122, 2.5, 2.5);
    ctx.restore();
  }

  function drawHayBale(ctx, ob) {
    ctx.fillStyle = '#d9a441';
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, 12);
    ctx.fill();
    ctx.strokeStyle = '#a87c22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ob.x + 8, ob.y + 14);
    ctx.lineTo(ob.x + ob.width - 8, ob.y + 14);
    ctx.moveTo(ob.x + 8, ob.y + ob.height - 14);
    ctx.lineTo(ob.x + ob.width - 8, ob.y + ob.height - 14);
    ctx.stroke();
    ctx.fillStyle = '#e8c25e';
    ellipse(ctx, ob.x + ob.width / 2, ob.y + 8, 22, 7);
  }

  function drawFence(ctx, ob) {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(ob.x, ob.y, 10, ob.height);
    ctx.fillRect(ob.x + ob.width - 10, ob.y, 10, ob.height);
    ctx.fillRect(ob.x, ob.y + 12, ob.width, 10);
    ctx.fillRect(ob.x, ob.y + 40, ob.width, 10);
    ctx.fillStyle = '#8f6a3e';
    ctx.fillRect(ob.x + 2, ob.y - 6, 6, 6);
    ctx.fillRect(ob.x + ob.width - 8, ob.y - 6, 6, 6);
  }

  function drawOven(ctx, ob, time) {
    // A wood-fired oven, door glowing with fire.
    ctx.fillStyle = '#4a4a52';
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, 10);
    ctx.fill();
    ctx.fillStyle = '#33333a';
    ctx.fillRect(ob.x - 6, ob.y - 26, 26, 30);
    ctx.fillStyle = '#5a5a63';
    ctx.fillRect(ob.x + 10, ob.y + 8, ob.width - 20, 8);
    const flicker = 0.75 + Math.sin(time * 11 + ob.x) * 0.25;
    ctx.fillStyle = 'rgba(255,' + Math.floor(120 + 60 * flicker) + ',30,' + flicker + ')';
    roundRect(ctx, ob.x + 22, ob.y + 34, ob.width - 44, 58, 8);
    ctx.fill();
    ctx.fillStyle = '#2b2b31';
    ctx.fillRect(ob.x + 22, ob.y + 34, ob.width - 44, 10);
    ctx.fillStyle = '#cfd6dd';
    ellipse(ctx, ob.x + ob.width - 16, ob.y + 20, 5, 5);
    // Heat waves.
    ctx.strokeStyle = 'rgba(255,140,40,0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const wx = ob.x + 30 + i * 34;
      ctx.beginPath();
      ctx.moveTo(wx, ob.y - 8);
      ctx.quadraticCurveTo(wx + 8, ob.y - 22, wx, ob.y - 34);
      ctx.stroke();
    }
  }

  function drawKnife(ctx, ob) {
    // A carving knife swinging from a wooden frame — slide under it when it swings up.
    const swing = Math.sin(ob.phase);
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(ob.x - 8, ob.y - 6, 10, ob.height + 6);
    ctx.fillRect(ob.x + ob.width - 2, ob.y - 6, 10, ob.height + 6);
    ctx.fillRect(ob.x - 8, ob.y - 6, ob.width + 16, 10);
    const pivotX = ob.x + ob.width / 2;
    const pivotY = ob.y + 4;
    const angle = swing * 0.9;
    const len = 118;
    const tipX = pivotX + Math.sin(angle) * len;
    const tipY = pivotY + Math.cos(angle) * len;
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // Blade.
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = '#dfe6ec';
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-8, -14, 16, 16);
    ctx.restore();
    ctx.fillStyle = '#c0392b';
    ellipse(ctx, pivotX, pivotY, 6, 6);
  }

  function drawCorn(ctx, corn) {
    const bobY = Math.sin(corn.bob) * 4;
    const y = corn.y + bobY;
    ctx.save();
    ctx.translate(corn.x, y);
    if (corn.golden) {
      ctx.fillStyle = 'rgba(255,215,0,0.35)';
      ellipse(ctx, 0, 0, 24, 24);
    }
    ctx.fillStyle = corn.golden ? '#ffd700' : '#f7c948';
    ellipse(ctx, 0, 0, 11, 17);
    ctx.strokeStyle = corn.golden ? '#c9a227' : '#c99a2e';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -13);
      ctx.lineTo(i * 5, 13);
      ctx.stroke();
    }
    ctx.fillStyle = '#5da24e';
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(-16, 26);
    ctx.lineTo(-2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.lineTo(16, 26);
    ctx.lineTo(2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHud(ctx, game) {
    const W = TURKEY_CONFIG.canvasWidth;
    ctx.save();
    // Top bar.
    ctx.fillStyle = 'rgba(20,16,10,0.55)';
    roundRect(ctx, 16, 14, W - 32, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCORE ' + game.score, 34, 46);
    ctx.fillText('DIST ' + Math.floor(game.world.distanceMetres) + ' m', 330, 46);
    // Escape progress bar.
    const barX = 560;
    const barW = 300;
    const progress = Math.min(1, game.world.distanceMetres / TURKEY_CONFIG.escapeDistance);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, barX, 30, barW, 18, 9);
    ctx.fill();
    ctx.fillStyle = progress > 0.9 ? '#7be07b' : '#ffd94d';
    roundRect(ctx, barX, 30, Math.max(18, barW * progress), 18, 9);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPE ' + Math.floor(progress * 100) + '%', barX + barW / 2, 58);
    // Stage + lives.
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px Verdana, sans-serif';
    ctx.fillText(game.stage.name.toUpperCase(), W - 34, 38);
    for (let i = 0; i < TURKEY_CONFIG.startLives; i++) {
      const hx = W - 150 + i * 34;
      const hy = 56;
      ctx.fillStyle = i < game.lives ? '#ff4d6d' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 5, hy - 12, hx, hy - 5);
      ctx.bezierCurveTo(hx + 5, hy - 12, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSpotted(ctx, time) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,40,40,' + (0.22 + Math.sin(time * 20) * 0.08) + ')';
    ctx.fillRect(0, 0, TURKEY_CONFIG.canvasWidth, TURKEY_CONFIG.canvasHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 8;
    ctx.strokeText(TURKEY_TEXT.spotted, TURKEY_CONFIG.canvasWidth / 2, 150);
    ctx.fillText(TURKEY_TEXT.spotted, TURKEY_CONFIG.canvasWidth / 2, 150);
    ctx.restore();
  }

  function drawTitle(ctx, game, time) {
    const W = TURKEY_CONFIG.canvasWidth;
    const H = TURKEY_CONFIG.canvasHeight;
    ctx.save();
    ctx.fillStyle = 'rgba(30,20,8,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 96px Verdana, sans-serif';
    ctx.strokeStyle = '#7a3b12';
    ctx.lineWidth = 12;
    ctx.strokeText(TURKEY_TEXT.title, W / 2, 190);
    ctx.fillText(TURKEY_TEXT.title, W / 2, 190);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px Verdana, sans-serif';
    ctx.fillText(TURKEY_TEXT.subtitle, W / 2, 248);
    ctx.font = '20px Verdana, sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(TURKEY_TEXT.tagline, W / 2, 292);
    // Start button.
    const pulse = 0.85 + Math.sin(time * 4) * 0.15;
    ctx.fillStyle = 'rgba(255,217,77,' + pulse + ')';
    roundRect(ctx, W / 2 - 260, 340, 520, 64, 14);
    ctx.fill();
    ctx.fillStyle = '#5a2d0c';
    ctx.font = 'bold 26px Verdana, sans-serif';
    ctx.fillText(TURKEY_TEXT.startPrompt, W / 2, 373);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Verdana, sans-serif';
    ctx.fillText(TURKEY_TEXT.controls, W / 2, 440);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '18px Verdana, sans-serif';
    ctx.fillText('Run 2000 m to reach the woods — dodge ovens, fences and the carving knife.', W / 2, 472);
    ctx.fillText('Grab corn for points. Three stumbles and the farmer catches you.', W / 2, 500);
    if (game.bestScore > 0) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 20px Verdana, sans-serif';
      ctx.fillText('BEST SCORE: ' + game.bestScore, W / 2, 548);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '15px Verdana, sans-serif';
    ctx.fillText('An original game — art, sound and code made for this bounty. M to mute.', W / 2, 668);
    ctx.restore();
  }

  function drawEnd(ctx, game, kind, time) {
    const W = TURKEY_CONFIG.canvasWidth;
    const H = TURKEY_CONFIG.canvasHeight;
    const caught = kind === 'caught';
    ctx.save();
    ctx.fillStyle = caught ? 'rgba(60,10,10,0.55)' : 'rgba(10,50,20,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = caught ? '#ff6b5e' : '#7be07b';
    ctx.font = 'bold 88px Verdana, sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 10;
    const title = caught ? TURKEY_TEXT.caughtTitle : TURKEY_TEXT.escapedTitle;
    ctx.strokeText(title, W / 2, 220);
    ctx.fillText(title, W / 2, 220);
    ctx.fillStyle = '#fff';
    ctx.font = '26px Verdana, sans-serif';
    ctx.fillText(caught ? TURKEY_TEXT.caughtLine : TURKEY_TEXT.escapedLine, W / 2, 280);
    // Stats panel.
    ctx.fillStyle = 'rgba(20,16,10,0.6)';
    roundRect(ctx, W / 2 - 300, 320, 600, 150, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 30px Verdana, sans-serif';
    ctx.fillText('SCORE  ' + game.score, W / 2, 362);
    ctx.fillStyle = '#fff';
    ctx.font = '21px Verdana, sans-serif';
    ctx.fillText('Distance: ' + Math.floor(game.world.distanceMetres) + ' m    •    Corn: ' + game.cornEaten + '    •    Stage: ' + game.stage.name, W / 2, 406);
    ctx.fillText('Best score: ' + Math.max(game.bestScore, game.score), W / 2, 442);
    const pulse = 0.85 + Math.sin(time * 4) * 0.15;
    ctx.fillStyle = 'rgba(255,217,77,' + pulse + ')';
    roundRect(ctx, W / 2 - 260, 510, 520, 60, 14);
    ctx.fill();
    ctx.fillStyle = '#5a2d0c';
    ctx.font = 'bold 24px Verdana, sans-serif';
    ctx.fillText(TURKEY_TEXT.restartPrompt, W / 2, 542);
    ctx.restore();
  }

  return {
    drawBackground: drawBackground,
    drawTurkey: drawTurkey,
    drawFarmer: drawFarmer,
    drawHayBale: drawHayBale,
    drawFence: drawFence,
    drawOven: drawOven,
    drawKnife: drawKnife,
    drawCorn: drawCorn,
    drawHud: drawHud,
    drawSpotted: drawSpotted,
    drawTitle: drawTitle,
    drawEnd: drawEnd,
  };
})();
