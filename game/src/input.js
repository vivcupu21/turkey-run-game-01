// SPDX-License-Identifier: MIT
// Turkey Run: input — keyboard and mouse, translated into game actions.
// One job: listen for keys and clicks and call the handlers the game hands in.
'use strict';

function TurkeyInput(handlers) {
  this.handlers = handlers;
  this.slideHeld = false;
  this.attach();
}

TurkeyInput.prototype.attach = function () {
  const self = this;
  window.addEventListener('keydown', function (event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault();
        self.handlers.onJump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        event.preventDefault();
        self.slideHeld = true;
        self.handlers.onSlideStart();
        break;
      case 'KeyR':
        self.handlers.onRestart();
        break;
      case 'KeyP':
        self.handlers.onPause();
        break;
      case 'KeyM':
        self.handlers.onMute();
        break;
      case 'Enter':
        self.handlers.onConfirm();
        break;
      default:
        break;
    }
  });
  window.addEventListener('keyup', function (event) {
    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      self.slideHeld = false;
      self.handlers.onSlideEnd();
    }
  });
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      self.handlers.onTap(event.clientX, event.clientY);
    });
  }
  window.addEventListener('blur', function () {
    self.slideHeld = false;
    self.handlers.onSlideEnd();
  });
};
