window.characterDB = [
    { id: 'agent', name: 'SHIELD Agent', color: '#f0131e', cost: 0, power: 'Standard Gun', img: '' },
    { id: 'spider', name: 'Spider-Man', color: '#e23636', cost: 100, power: 'Web Pull & Agility', img: '' },
    { id: 'cap', name: 'Captain America', color: '#0b2265', cost: 250, power: 'Shield Block', img: '' },
    { id: 'iron', name: 'Iron Man', color: '#f9d71c', cost: 500, power: 'Flight & Repulsor', img: '' },
    { id: 'hulk', name: 'Hulk', color: '#5cb85c', cost: 800, power: 'Super Jump & Smash', img: '' },
    { id: 'thor', name: 'Thor', color: '#c4d3e0', cost: 1000, power: 'Lightning Strike', img: '' },
    { id: 'panther', name: 'Black Panther', color: '#2a2a2a', cost: 1200, power: 'Kinetic Burst', img: '' },
    { id: 'wolverine', name: 'Wolverine', color: '#f4c51f', cost: 1500, power: 'Regeneration', img: '' },
    { id: 'strange', name: 'Dr. Strange', color: '#4a148c', cost: 2000, power: 'Levitation & Magic', img: '' }
];

window.loadedImages = {};
window.characterDB.forEach(char => {
    if (char.img) {
        let imgObj = new Image();
        imgObj.src = char.img;
        window.loadedImages[char.id] = imgObj;
    }
});

window.playerCoins = parseInt(localStorage.getItem('sa_coins')) || 0;
window.ownedChars = JSON.parse(localStorage.getItem('sa_owned')) || ['agent'];
window.equippedCharId = localStorage.getItem('sa_equipped') || 'agent';
window.maxUnlockedLevel = parseInt(localStorage.getItem('sa_max_level')) || 1;

window.addCoins = function(amount) {
    window.playerCoins += amount;
    localStorage.setItem('sa_coins', window.playerCoins);
    window.updateCoinDisplays();
};

window.updateCoinDisplays = function() {
    const cm = document.getElementById('coin-amount');
    if(cm) cm.innerText = window.playerCoins;
    const mc = document.getElementById('menu-coins');
    if(mc) mc.innerText = window.playerCoins;
    const hudC = document.getElementById('hud-coins');
    if(hudC) hudC.innerText = window.playerCoins;
};

window.initUI = function(startGameCallback) {
    let marketIndex = 0;
    window._settingsSource = 'main'; // track where settings was opened from

    // Default positions for all control buttons (for reset)
    const defaultControls = {
        'btn-left':          { left: '3vw',  bottom: '14vh', right: '',   top: '', width: '14vw', height: '14vw' },
        'btn-right':         { left: '19vw', bottom: '14vh', right: '',   top: '', width: '14vw', height: '14vw' },
        'btn-jump':          { right: '4vw',  bottom: '22vh', left: '',   top: '', width: '14vw', height: '14vw' },
        'btn-shoot':         { right: '20vw', bottom: '22vh', left: '',   top: '', width: '14vw', height: '14vw' },
        'btn-crouch':        { right: '4vw',  bottom: '7vh',  left: '',   top: '', width: '14vw', height: '14vw' },
        'btn-power':         { right: '20vw', bottom: '7vh',  left: '',   top: '', width: '14vw', height: '14vw' },
        'btn-grenade':       { right: '36vw', bottom: '7vh',  left: '',   top: '', width: '14vw', height: '14vw' },
        'btn-switch-weapon': { right: '36vw', bottom: '22vh', left: '',   top: '', width: '14vw', height: '14vw' },
    };

    // Apply saved or default control positions
    window.applyCustomControls = function() {
        const saved = JSON.parse(localStorage.getItem('sa_custom_controls') || 'null');
        const controlIds = Object.keys(defaultControls);
        controlIds.forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const data = (saved && saved[id]) ? saved[id] : defaultControls[id];
            btn.style.left   = data.left   || '';
            btn.style.right  = data.right  || '';
            btn.style.top    = data.top    || '';
            btn.style.bottom = data.bottom || '';
            if (data.widthPx)  { btn.style.width  = data.widthPx  + 'px'; btn.style.height = data.widthPx  + 'px'; }
            else               { btn.style.width  = data.width  || ''; btn.style.height = data.height || ''; }
        });
    };
    window.applyCustomControls();
    
    const elements = {
        main: document.getElementById('main-menu'),
        market: document.getElementById('market-menu'),
        levelMap: document.getElementById('level-map'),
        settings: document.getElementById('settings-menu'),
        mobileControls: document.getElementById('mobile-controls'),
        pause: document.getElementById('pause-menu'),
        hud: document.getElementById('hud'),
        gameover: document.getElementById('game-over-screen'),
        victory: document.getElementById('victory-screen'),
        uiLayer: document.getElementById('ui-layer')
    };

    function showScreen(screenId) {
        // First hide everything in the list
        Object.entries(elements).forEach(([key, el]) => { 
            if(el) el.classList.add('hidden');
        });

        // If it's a game-related screen, hide the UI layer background
        const gameScreens = ['mobileControls', 'hud'];
        if (gameScreens.includes(screenId)) {
            if(elements.uiLayer) elements.uiLayer.classList.add('hidden');
            if(elements.mobileControls) elements.mobileControls.classList.remove('hidden');
            if(elements.hud) elements.hud.classList.remove('hidden');
        } else {
            // It's a menu screen, show the UI layer
            if(elements.uiLayer) elements.uiLayer.classList.remove('hidden');
            if(elements[screenId]) elements[screenId].classList.remove('hidden');
        }
    }
    
    function refreshHomeShowcase() {
        const equipped = window.characterDB.find(c => c.id === window.equippedCharId) || window.characterDB[0];
        document.getElementById('home-char-name').innerText = equipped.name;
        if (window.loadedImages[equipped.id] && equipped.img) {
            document.getElementById('home-char-image').style.backgroundImage = `url(${equipped.img})`;
            document.getElementById('home-char-image').style.background = 'none'; // reset gradient
        } else {
            document.getElementById('home-char-image').style.background = `linear-gradient(135deg, ${equipped.color}, #111)`;
        }
    }

    refreshHomeShowcase();
    window.updateCoinDisplays();

    // Map Generation
    function buildLevelMap() {
        const container = document.getElementById('map-container');
        container.innerHTML = '';
        
        // Build bottom-up (level 50 at top, level 1 at bottom) for a vertical climb
        for (let i = 50; i >= 1; i--) {
            const nodeWrap = document.createElement('div');
            nodeWrap.className = 'map-node-container';
            
            // Wavy path effect
            const offset = Math.sin(i) * 50;
            nodeWrap.style.left = `${offset}px`;

            if (i < 50) {
                const line = document.createElement('div');
                line.className = 'node-line';
                if (i < window.maxUnlockedLevel) line.classList.add('cleared');
                nodeWrap.appendChild(line);
            }

            const nodeBtn = document.createElement('div');
            nodeBtn.className = 'map-node';
            
            const nodeNum = document.createElement('span');
            nodeNum.innerText = i;
            nodeBtn.appendChild(nodeNum);
            
            if (i < window.maxUnlockedLevel) {
                nodeBtn.classList.add('cleared');
            } else if (i === window.maxUnlockedLevel) {
                nodeBtn.classList.add('unlocked');
            } else {
                nodeBtn.classList.add('locked');
            }

            nodeBtn.onclick = () => {
                if (i <= window.maxUnlockedLevel) {
                    if (confirm(`MISSION ${i}: Eliminate all target beans. Proceed?`)) {
                        showScreen('mobileControls');
                        elements.hud.classList.remove('hidden');
                        const equippedData = window.characterDB.find(c => c.id === window.equippedCharId);
                        startGameCallback(equippedData, i);
                    }
                }
            };

            nodeWrap.appendChild(nodeBtn);
            container.appendChild(nodeWrap);
        }
        
        // Scroll to the latest unlocked level automatically
        setTimeout(() => {
            const nodes = container.getElementsByClassName('unlocked');
            if(nodes.length > 0) nodes[0].scrollIntoView({ block: 'center' });
        }, 10);
    }

    // Home Actions
    document.getElementById('nav-play').addEventListener('click', () => {
        showScreen('levelMap');
        buildLevelMap();
    });
    
    document.getElementById('nav-market').addEventListener('click', () => {
        showScreen('market');
        renderMarket();
    });
    
    document.getElementById('nav-settings').addEventListener('click', () => {
        window._settingsSource = 'main';
        showScreen('settings');
    });

    // Market Actions
    function renderMarket() {
        window.updateCoinDisplays();
        const char = window.characterDB[marketIndex];
        
        document.getElementById('char-name').innerText = char.name;
        document.getElementById('char-power').innerText = char.power;
        
        if (char.img) {
            document.getElementById('char-image').style.backgroundImage = `url(${char.img})`;
        } else {
            document.getElementById('char-image').style.background = `linear-gradient(135deg, ${char.color}, #111)`;
        }
        
        const buyBtn = document.getElementById('btn-buy-equip');
        
        if (window.ownedChars.includes(char.id)) {
            if (window.equippedCharId === char.id) {
                document.getElementById('char-cost').innerText = 'EQUIPPED';
                buyBtn.innerText = 'Equipped';
                buyBtn.className = 'secondary-btn';
            } else {
                document.getElementById('char-cost').innerText = 'Owned';
                buyBtn.innerText = 'Equip';
                buyBtn.className = 'primary-btn';
            }
        } else {
            document.getElementById('char-cost').innerText = `Cost: ${char.cost} Coins`;
            buyBtn.innerText = 'Buy';
            buyBtn.className = window.playerCoins >= char.cost ? 'primary-btn pulse' : 'secondary-btn'; 
        }
    }

    document.getElementById('btn-prev-char').addEventListener('click', () => {
        marketIndex = (marketIndex === 0) ? window.characterDB.length - 1 : marketIndex - 1;
        renderMarket();
    });
    
    document.getElementById('btn-next-char').addEventListener('click', () => {
        marketIndex = (marketIndex + 1) % window.characterDB.length;
        renderMarket();
    });

    document.getElementById('btn-buy-equip').addEventListener('click', () => {
        const char = window.characterDB[marketIndex];
        if (window.ownedChars.includes(char.id)) {
            window.equippedCharId = char.id;
            localStorage.setItem('sa_equipped', window.equippedCharId);
            renderMarket();
        } else {
            if (window.playerCoins >= char.cost) {
                window.playerCoins -= char.cost;
                window.ownedChars.push(char.id);
                window.equippedCharId = char.id; // Auto equip on buy
                localStorage.setItem('sa_coins', window.playerCoins);
                localStorage.setItem('sa_owned', JSON.stringify(window.ownedChars));
                localStorage.setItem('sa_equipped', window.equippedCharId);
                renderMarket();
            } else {
                alert("Not enough coins!");
            }
        }
    });

    // Sub-menu back buttons
    document.getElementById('nav-back-map').addEventListener('click', () => {
        refreshHomeShowcase();
        showScreen('main');
    });
    
    document.getElementById('nav-back-market').addEventListener('click', () => {
        refreshHomeShowcase();
        showScreen('main');
    });
    
    document.getElementById('nav-back-settings').addEventListener('click', () => {
        if (window._settingsSource === 'pause') {
            showScreen('pause');
        } else {
            showScreen('main');
        }
    });

    // Editor back button
    document.getElementById('btn-editor-back').addEventListener('click', () => {
        closeEditor();
        if (window._settingsSource === 'pause') {
            showScreen('pause');
        } else {
            showScreen('settings');
        }
    });

    // --- Controls Editor Logic ---
    const controlsEditorOverlay = document.getElementById('controls-editor-overlay');
    const mobileControlsEl = document.getElementById('mobile-controls');
    const editorSizeSlider = document.getElementById('editor-size-slider');
    const editorSelectedName = document.getElementById('editor-selected-name');
    
    let editorSelectedBtn = null;
    let editorSnapshot = {}; // snapshot of styles before editing (for cancel)
    
    const controlNames = {
        'btn-left': '← LEFT', 'btn-right': '→ RIGHT',
        'btn-jump': 'JUMP', 'btn-shoot': 'SHOOT',
        'btn-crouch': 'CROUCH', 'btn-power': 'POWER',
        'btn-grenade': 'GRENADE', 'btn-switch-weapon': 'WEAPON'
    };

    function openControlsEditor() {
        window._editorOpen = true; // block Escape/pause while editor is open
        // Snapshot current styles so we can cancel
        editorSnapshot = {};
        Object.keys(controlNames).forEach(id => {
            const b = document.getElementById(id);
            if (!b) return;
            editorSnapshot[id] = { left: b.style.left, right: b.style.right, top: b.style.top, bottom: b.style.bottom, width: b.style.width, height: b.style.height };
        });
        // Show editor: show mobile controls + editor overlay side by side
        mobileControlsEl.classList.remove('hidden');
        mobileControlsEl.classList.add('controls-edit-active');
        mobileControlsEl.style.zIndex = '600';
        mobileControlsEl.style.pointerEvents = 'auto'; // allow clicks on buttons during edit
        controlsEditorOverlay.classList.remove('hidden');
        editorSelectedBtn = null;
        editorSelectedName.textContent = 'NONE';
        editorSizeSlider.disabled = true;
        editorSizeSlider.value = 80;
        // Make each control button draggable in editor mode
        Object.keys(controlNames).forEach(id => makeDraggable(id));
    }

    function makeDraggable(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn || btn._editorBound) return;
        btn._editorBound = true;

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        function selectBtn() {
            if (editorSelectedBtn) editorSelectedBtn.classList.remove('selected-for-edit');
            editorSelectedBtn = btn;
            btn.classList.add('selected-for-edit');
            editorSelectedName.textContent = controlNames[btnId];
            // Read current computed pixel size
            const rect = btn.getBoundingClientRect();
            const sz = Math.round(rect.width);
            editorSizeSlider.disabled = false;
            editorSizeSlider.value = sz;
        }

        function getClientXY(e) {
            if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            return { x: e.clientX, y: e.clientY };
        }

        function onDown(e) {
            if (!window._editorOpen) return; // only drag when editor is active
            if (e.cancelable) e.preventDefault();
            selectBtn();
            isDragging = true;
            const pt = getClientXY(e);
            startX = pt.x; startY = pt.y;
            // Convert to absolute pixel position
            const rect = btn.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            // Switch to pixel absolute positioning
            btn.style.position = 'absolute';
            btn.style.left   = startLeft + 'px';
            btn.style.top    = startTop  + 'px';
            btn.style.right  = '';
            btn.style.bottom = '';
        }

        function onMove(e) {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            const pt = getClientXY(e);
            const dx = pt.x - startX;
            const dy = pt.y - startY;
            const W = window.innerWidth;
            const H = window.innerHeight;
            const rect = btn.getBoundingClientRect();
            const bw = rect.width; const bh = rect.height;
            let newLeft = startLeft + dx;
            let newTop  = startTop  + dy;
            // Clamp inside screen
            newLeft = Math.max(0, Math.min(W - bw, newLeft));
            newTop  = Math.max(0, Math.min(H - bh, newTop));
            btn.style.left = newLeft + 'px';
            btn.style.top  = newTop  + 'px';
        }

        function onUp(e) {
            isDragging = false;
        }

        btn.addEventListener('pointerdown', onDown, { passive: false });
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
    }

    // Size slider changes selected button size
    editorSizeSlider.addEventListener('input', () => {
        if (!editorSelectedBtn) return;
        const sz = editorSizeSlider.value + 'px';
        editorSelectedBtn.style.width  = sz;
        editorSelectedBtn.style.height = sz;
    });

    // Save button
    document.getElementById('btn-editor-save').addEventListener('click', () => {
        const saved = {};
        Object.keys(controlNames).forEach(id => {
            const b = document.getElementById(id);
            if (!b) return;
            saved[id] = {
                left: b.style.left, right: b.style.right,
                top: b.style.top, bottom: b.style.bottom,
                width: b.style.width, height: b.style.height
            };
            // if pixel-based, store widthPx
            if (b.style.width && b.style.width.endsWith('px')) {
                saved[id].widthPx = parseFloat(b.style.width);
            }
        });
        localStorage.setItem('sa_custom_controls', JSON.stringify(saved));
        closeEditor();
        if (window._settingsSource === 'pause') showScreen('pause');
        else showScreen('settings');
    });

    // Cancel button
    document.getElementById('btn-editor-cancel').addEventListener('click', () => {
        // Restore snapshot
        Object.keys(editorSnapshot).forEach(id => {
            const b = document.getElementById(id);
            if (!b) return;
            const s = editorSnapshot[id];
            b.style.left = s.left; b.style.right = s.right;
            b.style.top = s.top; b.style.bottom = s.bottom;
            b.style.width = s.width; b.style.height = s.height;
        });
        closeEditor();
        if (window._settingsSource === 'pause') showScreen('pause');
        else showScreen('settings');
    });

    // Reset to defaults
    document.getElementById('btn-editor-reset').addEventListener('click', () => {
        localStorage.removeItem('sa_custom_controls');
        window.applyCustomControls();
        // Re-select and refresh slider
        editorSelectedBtn = null;
        editorSelectedName.textContent = 'NONE';
        editorSizeSlider.disabled = true;
        Object.keys(controlNames).forEach(id => {
            const b = document.getElementById(id);
            if (b) { b.classList.remove('selected-for-edit'); b._editorBound = false; }
        });
        Object.keys(controlNames).forEach(id => makeDraggable(id));
    });

    function closeEditor() {
        window._editorOpen = false;
        controlsEditorOverlay.classList.add('hidden');
        mobileControlsEl.classList.remove('controls-edit-active');
        mobileControlsEl.classList.add('hidden');
        mobileControlsEl.style.zIndex = ''; // restore default z-index
        if (editorSelectedBtn) editorSelectedBtn.classList.remove('selected-for-edit');
        editorSelectedBtn = null;
        // Unbind drag listeners by clearing flags
        Object.keys(controlNames).forEach(id => {
            const b = document.getElementById(id);
            if (b) b._editorBound = false;
        });
    }

    // Open editor from Settings menu
    document.getElementById('btn-open-controls-editor').addEventListener('click', () => {
        // Hide ui-layer (settings/menus), then show editor on top
        // The editor overlay is OUTSIDE ui-layer so hiding ui-layer won't affect it
        elements.uiLayer.classList.add('hidden');
        openControlsEditor();
    });

    // Splash Screen Logic (Multi-Step)
    const splash = document.getElementById('splash-screen');
    const splashMark = document.getElementById('splash-mark');
    const splashTitle = document.getElementById('splash-title');

    // Audio Start on first interaction
    const startAudio = () => {
        window.sounds.init();
        window.sounds.startBGM();
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
    };
    document.addEventListener('click', startAudio);
    document.addEventListener('touchstart', startAudio);

    if (splash) {
        elements.uiLayer.style.pointerEvents = 'none';
        
        // Step 1: Show MARK (it's already visible by default)
        setTimeout(() => {
            if(splashMark) {
                splashMark.style.opacity = '0';
                splashMark.style.transition = 'opacity 0.5s ease';
            }
            
            setTimeout(() => {
                if(splashMark) splashMark.classList.add('hidden');
                if(splashTitle) {
                    splashTitle.classList.remove('hidden');
                    // Step 2: Show Game Title (animation is handled by CSS titleEntrance)
                }

                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => {
                        splash.classList.add('hidden');
                        elements.uiLayer.style.pointerEvents = 'auto';
                        showScreen('main'); // Show main menu after splash
                    }, 800);
                }, 2500);
            }, 600);
        }, 2000);
    }

    // Pause Resume X button
    document.getElementById('btn-resume-x').onclick = () => {
        elements.pause.classList.add('hidden');
        showScreen('mobileControls');
    };

    return {
        showScreen: showScreen,
        refreshHome: refreshHomeShowcase
    };
};
