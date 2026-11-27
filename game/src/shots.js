// SPDX-License-Identifier: MIT
// Turkey Run: screenshot scenes — fixed, deterministic game states built by
// the game's own code so the screenshots are real renders of the game.
// ?shot=title | play | caught | escaped  (no parameter = title screen)
'use strict';

function buildShotScene(game, name) {
  const C = TURKEY_CONFIG;
  if (name === 'play') {
    game.startRun(7);
    game.world.distanceMetres = 742;
    game.score = 1250;
    game.cornPoints = 508;
    game.lives = 2;
    game.cornEaten = 14;
    game.stage = game.world.stageFor(742);
    game.turkey.y = C.groundY - 150;
    game.turkey.vy = -260;
    game.turkey.airborne = true;
    game.turkey.runPhase = 2.4;
    game.world.obstacles = [
      { kind: 'hay', x: 430, y: C.groundY - 62, width: 74, height: 62, phase: 0, swingSpeed: 2.4, passed: false },
      { kind: 'oven', x: 640, y: C.groundY - 100, width: 128, height: 100, phase: 1.2, swingSpeed: 2.4, passed: false },
      { kind: 'knife', x: 900, y: C.groundY - 150, width: 40, height: 150, phase: -0.9, swingSpeed: 2.8, passed: false },
      { kind: 'fence', x: 1120, y: C.groundY - 84, width: 46, height: 84, phase: 0, swingSpeed: 2.4, passed: false },
    ];
    game.world.corns = [
      { x: 480, y: C.groundY - 190, golden: false, taken: false, bob: 0.4 },
      { x: 522, y: C.groundY - 216, golden: false, taken: false, bob: 1.1 },
      { x: 564, y: C.groundY - 190, golden: false, taken: false, bob: 2.0 },
      { x: 700, y: C.groundY - 220, golden: true, taken: false, bob: 0.9 },
      { x: 1020, y: C.groundY - 150, golden: false, taken: false, bob: 1.7 },
    ];
    game.world.nextSpawnX = 1500;
    game.world.stumbleBoost = 0.4;
    game.scrollX = 742 * C.pixelsPerMetre;
  } else if (name === 'caught') {
    game.startRun(11);
    game.world.distanceMetres = 913;
    game.score = 1840;
    game.cornPoints = 927;
    game.lives = 0;
    game.cornEaten = 21;
    game.stage = game.world.stageFor(913);
    game.state = 'caught';
    game.world.obstacles = [
      { kind: 'oven', x: 700, y: C.groundY - 100, width: 128, height: 100, phase: 0.6, swingSpeed: 2.4, passed: false },
    ];
    game.world.corns = [];
    game.world.nextSpawnX = 1500;
    game.scrollX = 913 * C.pixelsPerMetre;
    game.turkey.y = C.groundY;
    game.turkey.airborne = false;
  } else if (name === 'escaped') {
    game.startRun(21);
    game.world.distanceMetres = 2000;
    game.score = 4210;
    game.cornPoints = 2210;
    game.lives = 2;
    game.cornEaten = 38;
    game.stage = game.world.stageFor(2000);
    game.state = 'escaped';
    game.world.obstacles = [];
    game.world.corns = [
      { x: 700, y: C.groundY - 180, golden: true, taken: false, bob: 0.3 },
      { x: 760, y: C.groundY - 200, golden: false, taken: false, bob: 1.2 },
    ];
    game.world.nextSpawnX = 1500;
    game.scrollX = 2000 * C.pixelsPerMetre;
    game.turkey.y = C.groundY;
    game.turkey.airborne = false;
    game.turkey.runPhase = 1.2;
  }
  // title: nothing to build — the game boots on the title screen.
}
