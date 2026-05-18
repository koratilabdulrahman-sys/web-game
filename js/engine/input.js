// Input Management System
window.keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    power: false,
    switchWeapon: false,
    throwGrenade: false
};

window.initInput = function(togglePauseCallback) {
    // Keyboard support for PC
    window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') window.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') window.keys.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') window.keys.up = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') window.keys.down = true;
        if (e.code === 'Space') window.keys.shoot = true;
        if (e.code === 'KeyF' || e.code === 'KeyE') window.keys.power = true;
        if (e.code === 'KeyQ') window.keys.switchWeapon = true;
        if (e.code === 'KeyG') window.keys.throwGrenade = true;
        
        if (e.code === 'KeyP' || e.code === 'Escape') {
            togglePauseCallback();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') window.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') window.keys.right = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') window.keys.up = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') window.keys.down = false;
        if (e.code === 'Space') window.keys.shoot = false;
        if (e.code === 'KeyF' || e.code === 'KeyE') window.keys.power = false;
        if (e.code === 'KeyQ') window.keys.switchWeapon = false;
        if (e.code === 'KeyG') window.keys.throwGrenade = false;
    });

    // Touch support (Mobile DOM buttons) - IMPROVED FOR MOBILE
    const bindTouch = (id, keyName) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        
        let activeTouches = 0;

        const setDown = (e) => { 
            if(e.cancelable) e.preventDefault(); 
            if(activeTouches === 0) {
                window.keys[keyName] = true; 
                btn.classList.add('active-btn');
                btn.style.transform = 'scale(0.85)';
                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            }
            activeTouches++;
        };
        const setUp = (e) => { 
            if(e.cancelable) e.preventDefault(); 
            activeTouches--;
            if(activeTouches <= 0) {
                activeTouches = 0;
                window.keys[keyName] = false; 
                btn.classList.remove('active-btn');
                btn.style.transform = 'scale(1)';
                btn.style.backgroundColor = '';
            }
        };
        
        btn.addEventListener('touchstart', setDown, {passive: false});
        btn.addEventListener('touchend', setUp, {passive: false});
        btn.addEventListener('touchcancel', setUp, {passive: false});
        
        // Also keep mouse for testing on PC
        btn.addEventListener('mousedown', (e) => {
            window.keys[keyName] = true;
            btn.style.transform = 'scale(0.85)';
        });
        btn.addEventListener('mouseup', (e) => {
            window.keys[keyName] = false;
            btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('mouseleave', (e) => {
            window.keys[keyName] = false;
            btn.style.transform = 'scale(1)';
        });
    };

    bindTouch('btn-left', 'left');
    bindTouch('btn-right', 'right');
    bindTouch('btn-jump', 'up');
    bindTouch('btn-crouch', 'down');
    bindTouch('btn-shoot', 'shoot');
    bindTouch('btn-power', 'power');
    bindTouch('btn-switch-weapon', 'switchWeapon');
    bindTouch('btn-grenade', 'throwGrenade');

    document.getElementById('mobile-controls').addEventListener('touchstart', (e) => {
        if(e.cancelable) e.preventDefault();
    }, {passive: false});

    const pauseBtn = document.getElementById('btn-pause');
    if(pauseBtn) {
        pauseBtn.addEventListener('touchstart', (e) => {
            if(e.cancelable) e.preventDefault();
            togglePauseCallback();
        });
        pauseBtn.addEventListener('mousedown', (e) => {
            togglePauseCallback();
        });
    }
};
