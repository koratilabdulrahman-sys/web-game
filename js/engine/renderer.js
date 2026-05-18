let canvas, ctx;
window.cameraX = 0;
let weatherParticles = [];
let weatherType = 'none'; 
let currentBiome = 'city'; // 'city', 'forest', 'desert', 'snow', 'building'

window.initRenderer = function(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        window.physicsConfig.groundY = canvas.height - 60; 
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    return { canvas, ctx };
};

window.setBiome = function(biome) {
    currentBiome = biome;
};

window.drawBean = function(x, y, w, h, color, direction, animTime, isGrounded, isCrouching, charId) {
    ctx.save();
    
    // Position and Rotation
    let bounce = 0;
    let tilt = 0;
    let scaleY = 1;
    let scaleX = 1;

    if (!isGrounded) {
        scaleY = 1.1;
        scaleX = 0.9;
    } else if (isCrouching) {
        scaleY = 0.6;
        scaleX = 1.3;
        y += h * 0.4;
    } else if (animTime > 0) {
        bounce = Math.abs(Math.sin(animTime * 1.5)) * 10;
        tilt = Math.sin(animTime * 1.5) * 0.1 * direction;
    }

    ctx.translate(x + w / 2, y + h);
    ctx.rotate(tilt);
    ctx.translate(-w / 2, -h - bounce);
    ctx.scale(scaleX, scaleY);

    // --- Draw Limbs (Realistic Movement) ---
    const drawLimb = (lx, ly, lw, lh, angle, lColor) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        ctx.fillStyle = lColor || 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.roundRect(-lw/2, 0, lw, lh, 10);
        ctx.fill();
        ctx.restore();
    };

    // --- Draw Gun ---
    const drawGun = (gx, gy, gDir) => {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(gDir, 1);
        
        // Gun body
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 30, 12);
        ctx.fillRect(0, 10, 8, 15); // Handle
        
        // Barrel detail
        ctx.fillStyle = '#111';
        ctx.fillRect(25, 2, 8, 6);
        
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, 0, 30, 4);
        
        ctx.restore();
    };

    if (!isCrouching) {
        let legAngle = Math.sin(animTime * 1.5) * 0.5;
        let armAngle = -Math.sin(animTime * 1.5) * 0.4;

        // Back limbs
        drawLimb(w * 0.3, h * 0.8, w * 0.3, h * 0.4, -legAngle, color);
        drawLimb(w * 0.7, h * 0.4, w * 0.25, h * 0.5, armAngle, color);

        // Body
        const charImg = window.loadedImages[charId];
        if (charImg) {
            if (direction < 0) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(charImg, -w, 0, w, h);
                ctx.restore();
            } else {
                ctx.drawImage(charImg, 0, 0, w, h);
            }
        } else {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(0, 0, w, h, w/2);
            ctx.fill();
            // Shade
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.roundRect(w*0.5, 0, w*0.5, h, w/2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#fff';
            let eyeX = direction > 0 ? w * 0.5 : w * 0.1;
            ctx.fillRect(eyeX, h * 0.2, w * 0.4, h * 0.15);
            ctx.fillStyle = '#111';
            let pupilX = direction > 0 ? eyeX + w * 0.2 : eyeX + w * 0.05;
            ctx.fillRect(pupilX, h * 0.22, 6, h * 0.1);
        }

        // Front limbs
        drawLimb(w * 0.7, h * 0.8, w * 0.3, h * 0.4, legAngle, color);
        drawLimb(w * 0.3, h * 0.4, w * 0.25, h * 0.5, -armAngle, color);
        
        // DRAW GUN in front hand
        let handX = direction > 0 ? w * 0.8 : w * 0.2;
        let handY = h * 0.5 + Math.sin(animTime * 1.5) * 5;
        drawGun(handX, handY, direction);

    } else {
        // Simple crouch body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, w/2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        let eyeX = direction > 0 ? w * 0.5 : w * 0.1;
        ctx.fillRect(eyeX, h * 0.2, w * 0.4, h * 0.2);
        
        // Gun when crouching
        drawGun(direction > 0 ? w * 0.9 : w * 0.1, h * 0.6, direction);
    }

    ctx.restore();
};

window.setWeather = function(type) {
    weatherType = type;
    weatherParticles = [];
    if (type === 'none') return;
    
    const count = type === 'rain' ? 120 : 80;
    for (let i = 0; i < count; i++) {
        weatherParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            velY: type === 'rain' ? 15 + Math.random() * 10 : 2 + Math.random() * 3,
            velX: (Math.random() - 0.5) * (type === 'rain' ? 1 : 4),
            size: type === 'rain' ? 2 : 4
        });
    }
};

window.drawBackground = function() {
    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    switch(currentBiome) {
        case 'forest':
            bgGradient.addColorStop(0, '#1a472a'); bgGradient.addColorStop(1, '#0d2b1a');
            break;
        case 'desert':
            bgGradient.addColorStop(0, '#ffcc33'); bgGradient.addColorStop(1, '#e68a00');
            break;
        case 'snow':
            bgGradient.addColorStop(0, '#e6f3ff'); bgGradient.addColorStop(1, '#b3d9ff');
            break;
        case 'building':
            bgGradient.addColorStop(0, '#2c3e50'); bgGradient.addColorStop(1, '#1a252f');
            break;
        default: // city
            bgGradient.addColorStop(0, '#1e2430'); bgGradient.addColorStop(1, '#0a0d12');
    }
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax details
    ctx.save();
    ctx.translate(-window.cameraX * 0.2, 0);
    
    if (currentBiome === 'city') {
        ctx.fillStyle = '#0a0d12';
        for(let i=0; i<15; i++) {
            ctx.fillRect(i * 300, canvas.height - 400, 150, 400);
        }
    } else if (currentBiome === 'forest') {
        ctx.fillStyle = '#061a0d';
        for(let i=0; i<20; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 200, canvas.height);
            ctx.lineTo(i * 200 + 100, canvas.height - 400);
            ctx.lineTo(i * 200 + 200, canvas.height);
            ctx.fill();
        }
    } else if (currentBiome === 'desert') {
        ctx.fillStyle = '#cc7a00';
        for(let i=0; i<10; i++) {
            ctx.beginPath();
            ctx.arc(i * 500, canvas.height, 300, Math.PI, 0);
            ctx.fill();
        }
    } else if (currentBiome === 'building') {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 2;
        for(let i=0; i<20; i++) {
            ctx.strokeRect(i * 100, 0, 50, canvas.height);
        }
    }
    ctx.restore();
};

window.drawGame = function(player, projectiles, platforms, enemies, obstacles, drops, effects) {
    // ---- CAMERA LOGIC ----
    let targetCamX = player.x - (canvas.width / 3);
    if(targetCamX < 0) targetCamX = 0;
    window.cameraX += (targetCamX - window.cameraX) * 0.1;

    window.drawBackground();

    ctx.save();
    ctx.translate(-window.cameraX, 0);

    // Ground
    ctx.fillStyle = currentBiome === 'snow' ? '#fff' : (currentBiome === 'desert' ? '#e6b800' : '#111');
    ctx.fillRect(window.cameraX, window.physicsConfig.groundY, canvas.width + 1000, 100);

    // Platforms
    ctx.fillStyle = currentBiome === 'building' ? '#34495e' : '#222';
    platforms.forEach(plat => {
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
        ctx.fillStyle = currentBiome === 'building' ? '#34495e' : '#222';
    });

    // Drops (Hearts & Coins)
    drops.forEach(d => {
        if (d.type === 'heart') {
            ctx.fillStyle = '#ff3366';
            ctx.beginPath();
            ctx.moveTo(d.x + 15, d.y + 10);
            ctx.bezierCurveTo(d.x + 15, d.y + 7, d.x + 10, d.y, d.x, d.y);
            ctx.bezierCurveTo(d.x - 15, d.y, d.x - 15, d.y + 17.5, d.x - 15, d.y + 17.5);
            ctx.bezierCurveTo(d.x - 15, d.y + 25, d.x - 5, d.y + 32.5, d.x + 15, d.y + 40);
            ctx.bezierCurveTo(d.x + 35, d.y + 32.5, d.x + 45, d.y + 25, d.x + 45, d.y + 17.5);
            ctx.bezierCurveTo(d.x + 45, d.y + 17.5, d.x + 45, d.y, d.x + 30, d.y);
            ctx.bezierCurveTo(d.x + 22.5, d.y, d.x + 15, d.y + 7, d.x + 15, d.y + 10);
            ctx.fill();
        } else if (d.type === 'coin') {
            // Spinning Gold Coin
            let spin = Math.abs(Math.sin(Date.now() / 200)) * 20;
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.ellipse(d.x + 10, d.y + 10, spin, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Effects (Explosions)
    effects.forEach(fx => {
        if (fx.type === 'explosion') {
            let p = 1 - (fx.timer / 30); // Progress 0 to 1
            ctx.save();
            ctx.globalAlpha = 1 - p;
            
            // Outer fire ring
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, fx.radius * p * 1.5, 0, Math.PI*2);
            ctx.fill();
            
            // Inner blast
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, fx.radius * p, 0, Math.PI*2);
            ctx.fill();
            
            ctx.restore();
        }
    });

    // Obstacles (Boxes/Crates)
    obstacles.forEach(obs => {
        // Draw Crate with texture effect
        ctx.fillStyle = '#8b4513'; // Brown
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#5d2e0d';
        ctx.lineWidth = 4;
        ctx.strokeRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
        ctx.beginPath();
        ctx.moveTo(obs.x + 5, obs.y + 5); ctx.lineTo(obs.x + obs.width - 5, obs.y + obs.height - 5);
        ctx.stroke();
    });

    // Enemies
    enemies.forEach(e => {
        let eColor = e.isBoss ? '#f0131e' : '#2a4d87';
        window.drawBean(e.x, e.y, e.width, e.height, eColor, e.direction, e.animTime, e.isGrounded, false);
        
        // Health Bar for Boss
        if (e.isBoss) {
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x, e.y - 20, e.width, 10);
            ctx.fillStyle = '#f00';
            ctx.fillRect(e.x, e.y - 20, (e.hp / e.maxHP) * e.width, 10);
        }
    });

    // Projectiles
    projectiles.forEach(p => {
        if (p.type === 'grenade') {
            ctx.fillStyle = '#2ecc71'; // Green grenade
            ctx.beginPath();
            ctx.arc(p.x + 10, p.y + 10, 10, 0, Math.PI*2);
            ctx.fill();
            // Pin/Top
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(p.x + 6, p.y - 4, 8, 6);
            // Fuse (Sparkle effect)
            if (p.timer % 10 < 5) {
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(p.x + 8, p.y - 8, 4, 4);
            }
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Glow effect for special bullets
            if (p.damage > 1) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.shadowBlur = 0;
            }
        }
    });

    // Player
    if (player) {
        let pColor = player.color || '#f0131e';
        
        // Power Aura
        if (player.powerActive) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.1;
            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width * 1.5, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        window.drawBean(player.x, player.y, player.width, player.height, pColor, player.direction, player.animTime, player.isGrounded, player.isCrouching, player.charID);
        
        if (player.powerActive) {
            ctx.strokeStyle = player.charID === 'spider' ? '#fff' : (player.charID === 'cap' ? '#4b7bec' : '#f9d71c');
            ctx.lineWidth = 4;
            ctx.beginPath();
            
            if(player.charID === 'spider') {
                // Web Shield
                ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width * 1.2, 0, Math.PI*2);
                for(let i=0; i<8; i++) {
                    ctx.moveTo(player.x + player.width/2, player.y + player.height/2);
                    let angle = (i / 8) * Math.PI * 2;
                    ctx.lineTo(player.x + player.width/2 + Math.cos(angle) * 60, player.y + player.height/2 + Math.sin(angle) * 60);
                }
            } else if (player.charID === 'cap') {
                // Circular Shield
                ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width * 1.1, 0, Math.PI*2);
            } else if (player.charID === 'iron') {
                // Thrusters and Hand Repulsors
                ctx.fillStyle = '#f9d71c';
                ctx.fillRect(player.x + player.width/2 - 10, player.y + player.height, 20, 25);
                ctx.beginPath();
                ctx.arc(player.x + player.width/2 + player.direction * 30, player.y + 40, 10, 0, Math.PI*2);
                ctx.fill();
            } else if (player.charID === 'thor') {
                // Lightning effects
                ctx.strokeStyle = '#00d2ff';
                ctx.moveTo(player.x + player.width/2, player.y);
                ctx.lineTo(player.x + player.width/2 + (Math.random()-0.5)*100, player.y - 100);
            }
            ctx.stroke();
        }
    }

    ctx.restore();

    // Weather
    if (weatherType !== 'none') {
        ctx.fillStyle = weatherType === 'rain' ? 'rgba(170, 170, 255, 0.6)' : 'rgba(255, 255, 255, 0.8)';
        weatherParticles.forEach(p => {
            ctx.fillRect(p.x, p.y, p.size, p.size * (weatherType === 'rain' ? 5 : 1));
            p.y += p.velY;
            p.x += p.velX;
            if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        });
    }

    // Time Slow Effect (Strange)
    if (player && player.charID === 'strange' && player.powerActive) {
        ctx.fillStyle = 'rgba(74, 20, 140, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
};
