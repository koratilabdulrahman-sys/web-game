let isPlaying = false;
let isPaused = false;
let animationFrameId;

let player;
let projectiles = [];
let enemies = [];
let platforms = [];
let obstacles = [];
let drops = []; 
let effects = []; // NEW: Visual effects (explosions, etc)
let uiBridge;
let currentLevel = 1;
const MAX_LEVELS = 50;

window.setup = function() {
    window.initInput(togglePause);
    window.initRenderer('gameCanvas');
    
    uiBridge = window.initUI((selectedChar, mapLevelNum) => {
        // Start Game Callback from Level Map Node click
        window.sounds.init();
        window.sounds.startBGM();
        startGame(selectedChar, mapLevelNum);
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        isPaused = false;
        uiBridge.showScreen('mobileControls');
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
        window._settingsSource = 'pause';
        uiBridge.showScreen('settings');
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
        isPlaying = false;
        isPaused = false;
        uiBridge.refreshHome();
        uiBridge.showScreen('main');
    });
    
    document.getElementById('btn-next-level').addEventListener('click', () => {
        if (currentLevel < MAX_LEVELS) {
            const equippedData = window.characterDB.find(c => c.id === window.equippedCharId);
            startGame(equippedData, currentLevel + 1);
        } else {
            uiBridge.showScreen('main');
        }
    });

    document.getElementById('btn-replay-level').addEventListener('click', () => {
        const equippedData = window.characterDB.find(c => c.id === window.equippedCharId);
        startGame(equippedData, currentLevel);
    });

    document.getElementById('btn-victory-main-menu').addEventListener('click', () => {
        isPlaying = false;
        isPaused = false;
        uiBridge.refreshHome();
        uiBridge.showScreen('main');
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
        uiBridge.showScreen('main'); 
    });
};

function togglePause() {
    if(!isPlaying) return;
    if(window._editorOpen) return; // don't pause while controls editor is open
    isPaused = !isPaused;
    if (isPaused) {
        uiBridge.showScreen('pause');
    } else {
        uiBridge.showScreen('mobileControls');
    }
}

function generateLevel(levelNum) {
    platforms = [];
    enemies = [];
    obstacles = [];
    drops = [];
    effects = [];
    
    // Set Biome and Weather based on level
    let biome = 'city';
    let weather = 'none';

    if (levelNum <= 10) { biome = 'city'; weather = 'rain'; }
    else if (levelNum <= 20) { biome = 'forest'; weather = 'rain'; }
    else if (levelNum <= 30) { biome = 'desert'; weather = 'none'; }
    else if (levelNum <= 40) { biome = 'snow'; weather = 'snow'; }
    else if (levelNum <= 50) { biome = 'building'; weather = 'none'; }

    window.setBiome(biome);
    window.setWeather(weather);

    const levelLength = 3000 + (levelNum * 300);
    const difficultyMult = 1 + (levelNum * 0.15);
    
    document.getElementById('hud-level-num').innerText = levelNum;

    // SAFE START: First 800 units are clear of enemies/obstacles
    let currentX = 800; 
    while(currentX < levelLength - 600) {
        let pWidth = 150 + Math.random() * 250;
        let pHeight = 25;
        let pY = window.physicsConfig.groundY - 120 - (Math.random() * 120);
        
        platforms.push({ x: currentX, y: pY, width: pWidth, height: pHeight });
        
        // Hurdles on platforms
        if (Math.random() < 0.5) {
            obstacles.push({
                x: currentX + (pWidth / 2) - 30,
                y: pY - 80,
                width: 60,
                height: 80,
                type: 'crate'
            });
        }
        
        // Spawn enemies
        if (Math.random() < 0.4) {
            enemies.push(new window.Enemy(currentX + pWidth/2, pY - 90, false, difficultyMult));
        }
        
        if (Math.random() < 0.3) {
            enemies.push(new window.Enemy(currentX + 100, window.physicsConfig.groundY - 90, false, difficultyMult));
        }

        currentX += pWidth + 150 + (Math.random() * 250);
    }
    
    // Ground obstacles (Big Hurdles)
    for (let i = 0; i < levelLength / 1000; i++) {
        let ox = 1200 + (i * 1000) + (Math.random() * 300);
        obstacles.push({
            x: ox,
            y: window.physicsConfig.groundY - 100,
            width: 80,
            height: 100,
            type: 'barrier'
        });
    }

    // Boss at the end
    enemies.push(new window.Enemy(levelLength, window.physicsConfig.groundY - 160, true, difficultyMult));
}

function startGame(selectedCharData, level = 1) {
    currentLevel = level;
    player = new window.Player();
    player.setChar(selectedCharData);
    projectiles = [];
    drops = [];
    effects = [];
    
    generateLevel(currentLevel);
    
    player.updateHUD();
    uiBridge.showScreen('mobileControls');
    
    isPlaying = true;
    isPaused = false;
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

window.triggerGameOver = function() {
    isPlaying = false;
    uiBridge.showScreen('gameover');
};

function winLevel() {
    isPlaying = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.addCoins(100); // Boss kill reward
    
    // Unlock next level
    if (currentLevel === window.maxUnlockedLevel && currentLevel < MAX_LEVELS) {
        window.maxUnlockedLevel++;
        localStorage.setItem('sa_max_level', window.maxUnlockedLevel);
    }
    
    uiBridge.showScreen('victory');
    window.sounds.playWin();
}

function update() {
    if (!isPlaying || isPaused) return;

    player.update(projectiles, platforms.concat(obstacles), enemies);

    // Update Drops (Hearts & Coins)
    for (let i = drops.length - 1; i >= 0; i--) {
        let d = drops[i];
        if (window.checkCollisionAABB(player, d)) {
            if (d.type === 'heart') {
                player.health = Math.min(100, player.health + 10);
                window.sounds.playTone(600, 'sine', 0.1);
            } else if (d.type === 'coin') {
                window.addCoins(10);
                window.sounds.playTone(800, 'square', 0.05);
            }
            player.updateHUD();
            drops.splice(i, 1);
        }
    }

    // Update Effects
    for (let i = effects.length - 1; i >= 0; i--) {
        effects[i].timer--;
        if (effects[i].timer <= 0) effects.splice(i, 1);
    }

    // Update projectiles & hit detection
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        if (p.type === 'grenade') {
            p.velY += 0.4; // Gravity
            p.x += p.velX;
            p.y += p.velY;
            p.timer--;
            
            // Bounce on platforms/ground
            if (p.y + p.height > window.physicsConfig.groundY) {
                p.y = window.physicsConfig.groundY - p.height;
                p.velY *= -0.5;
                p.velX *= 0.8;
            }

            if (p.timer <= 0) {
                // EXPLODE
                window.sounds.playExplosion();
                // Add Explosion Effect
                effects.push({ x: p.x, y: p.y, type: 'explosion', timer: 30, radius: 100 });
                // Damage enemies in radius
                for (let j = enemies.length - 1; j >= 0; j--) {
                    let e = enemies[j];
                    let dist = Math.sqrt(Math.pow(e.x - p.x, 2) + Math.pow(e.y - p.y, 2));
                    if (dist < 200) {
                        e.hp -= 15;
                        if (e.hp <= 0) {
                            // Drop rewards
                            if (Math.random() < 0.3) drops.push({ x: e.x, y: e.y + 40, width: 30, height: 30, type: 'heart' });
                            drops.push({ x: e.x + 10, y: e.y + 40, width: 20, height: 20, type: 'coin' });
                            enemies.splice(j, 1);
                            if (e.isBoss) winLevel();
                        }
                    }
                }
                projectiles.splice(i, 1);
                continue;
            }
        } else {
            p.x += p.velX;
        }
        
        if (p.x < window.cameraX - 500 || p.x > window.cameraX + window.innerWidth + 500) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Collision logic
        let bulletDestroyed = false;
        
        // Check Obstacle collision first (boxes block bullets)
        for (let obs of obstacles) {
            if (window.checkCollisionAABB(p, obs)) {
                if (p.type === 'grenade') {
                    p.velY *= -0.5;
                    p.velX *= -0.5;
                } else {
                    bulletDestroyed = true;
                    window.sounds.playTone(100, 'sine', 0.05);
                }
                break;
            }
        }

        if (bulletDestroyed) {
            projectiles.splice(i, 1);
            continue;
        }

        if (p.type === 'player') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (window.checkCollisionAABB(p, e)) {
                    e.hp -= (p.damage || 1);
                    bulletDestroyed = true;
                    if (e.hp <= 0) {
                        // Drop rewards
                        if (Math.random() < 0.3) drops.push({ x: e.x, y: e.y + 40, width: 30, height: 30, type: 'heart' });
                        drops.push({ x: e.x + 10, y: e.y + 40, width: 20, height: 20, type: 'coin' });
                        enemies.splice(j, 1);
                        window.sounds.playExplosion();
                        if (e.isBoss) winLevel();
                    }
                    break;
                }
            }
        } else if (p.type === 'enemy') {
            if (window.checkCollisionAABB(p, player)) {
                player.takeDamage();
                bulletDestroyed = true;
            }
        }

        if (bulletDestroyed) {
            projectiles.splice(i, 1);
        }
    }

    // Update enemies & player collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.update(platforms.concat(obstacles), player, projectiles);
        
        // If enemy touches player
        if (window.checkCollisionAABB(player, e)) {
            player.takeDamage();
        }
    }
}

function draw() {
    if (!isPlaying) return;
    window.drawGame(player, projectiles, platforms, enemies, obstacles, drops, effects);
}

function gameLoop() {
    update();
    draw();
    
    if (isPlaying) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

window.onload = window.setup;
