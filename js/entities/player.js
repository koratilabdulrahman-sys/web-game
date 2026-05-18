window.Player = class Player {
    constructor() {
        this.x = 100;
        this.y = 100;
        this.width = 45;
        this.height = 90;
        this.velX = 0;
        this.velY = 0;
        
        this.moveSpeed = 9; 
        this.jumpForce = -14;
        this.jumpCount = 0;
        this.maxJumps = 2; 
        this.jumpPressedLastFrame = false;
        
        this.isGrounded = false;
        this.isCrouching = false;
        this.direction = 1; 
        
        this.charID = 'agent';
        this.color = '#777'; 
        
        // --- Weapons ---
        this.weapons = [
            { id: 'normal', name: 'Standard', damage: 1, speed: 25, interval: 150, color: '#f9d71c' },
            { id: 'sniper', name: 'Sniper', damage: 10, speed: 45, interval: 1200, color: '#f0131e' },
            { id: 'heavy', name: 'Heavy', damage: 5, speed: 15, interval: 500, color: '#9b59b6' }
        ];
        this.currentWeaponIndex = 0;
        this.lastWeaponSwitch = 0;

        // --- Powers ---
        this.powerActive = false;
        this.powerTimer = 0;
        this.powerCooldown = 0;
        this.powerDuration = 600; // 10 seconds @ 60fps
        this.powerMaxCooldown = 3600; // 60 seconds @ 60fps
        
        this.hoverTime = 0;
        this.lastShoot = 0;
        
        this.maxLives = 3;
        this.lives = 3;
        this.health = 100;
        this.grenades = 3;
        this.lastGrenade = 0;
        this.invulnerableTimer = 0;

        this.animTime = 0;
    }

    setChar(charData) {
        this.charID = charData.id;
        this.color = charData.color;
        this.y = 50;
    }

    takeDamage() {
        if (this.invulnerableTimer > 0) return;
        if (this.charID === 'cap' && this.powerActive) return;
        if (this.charID === 'spider' && this.powerActive) return;
        
        this.health -= 10;
        this.invulnerableTimer = 60; 
        this.velY = -6;
        this.velX = -this.direction * 10;
        
        if (this.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.health = 100;
                this.respawn();
            } else {
                window.sounds.playLose();
                window.triggerGameOver();
            }
        } else {
            window.sounds.playHit();
        }
        
        this.updateHUD();
    }

    respawn() {
        this.x = 100; // Reset to start
        this.y = 100;
        this.velX = 0;
        this.velY = 0;
        this.invulnerableTimer = 120; // Longer invulnerability after respawn
    }

    updateHUD() {
        const hudLives = document.getElementById('hud-lives');
        if(hudLives) hudLives.innerText = this.lives;
        const hudHealth = document.getElementById('hud-health');
        if(hudHealth) hudHealth.innerText = this.health;
    }

    update(projectiles, platforms, enemies) {
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        // Update Weapon, Power and Grenade HUD
        this.updateHUD();
        const currentWeapon = this.weapons[this.currentWeaponIndex];
        const hudW = document.getElementById('hud-weapon');
        if(hudW) hudW.innerText = currentWeapon.name;

        const hudG = document.getElementById('hud-grenades');
        if(hudG) hudG.innerText = this.grenades;

        const hudPS = document.getElementById('hud-power-status');
        if(hudPS) {
            if (this.powerActive) {
                hudPS.innerText = 'ACTIVE';
                hudPS.className = 'active';
            } else if (this.powerCooldown > 0) {
                hudPS.innerText = Math.ceil(this.powerCooldown / 60) + 's';
                hudPS.className = 'cooldown';
                // Update mobile button visual
                const cdPerc = (this.powerCooldown / this.powerMaxCooldown) * 100;
                document.documentElement.style.setProperty('--power-cd', cdPerc + '%');
            } else {
                hudPS.innerText = 'READY';
                hudPS.className = 'ready';
                document.documentElement.style.setProperty('--power-cd', '0%');
            }
        }

        if (this.isGrounded) {
            this.jumpCount = 0;
        }

        let currentMoveSpeed = this.moveSpeed;
        if (this.charID === 'spider') currentMoveSpeed = 12;
        if (this.charID === 'hulk') currentMoveSpeed = 7;
        
        // Power-based speed boosts
        if (this.powerActive) {
            if (this.charID === 'spider') currentMoveSpeed *= 1.5;
            if (this.charID === 'panther') currentMoveSpeed *= 1.8;
        }

        this.velX = 0;
        let isMoving = false;
        
        if (window.keys.left) { this.velX = -currentMoveSpeed; this.direction = -1; isMoving = true; }
        if (window.keys.right) { this.velX = currentMoveSpeed; this.direction = 1; isMoving = true; }

        if (isMoving) {
            this.animTime += 0.15;
        } else {
            this.animTime = 0;
        }

        if (window.keys.down && this.isGrounded) {
            this.isCrouching = true;
            this.velX = 0;
        } else {
            this.isCrouching = false;
        }

        if (window.keys.up && !this.isCrouching) {
            if (this.jumpCount < this.maxJumps && !this.jumpPressedLastFrame) {
                this.velY = (this.charID === 'hulk' || (this.charID === 'panther' && this.powerActive)) ? -18 : this.jumpForce;
                this.isGrounded = false;
                this.jumpCount++;
                window.sounds.playJump();
            }
            this.jumpPressedLastFrame = true;
        } else if (!window.keys.up) {
            this.jumpPressedLastFrame = false;
        }

        // --- Powers Logic ---
        if (this.powerCooldown > 0) this.powerCooldown--;

        if (window.keys.power && this.powerCooldown <= 0 && !this.powerActive) {
            this.powerActive = true;
            this.powerTimer = this.powerDuration;
            window.sounds.playTone(400, 'sawtooth', 0.2); // Power activate sound
        }

        if (this.powerActive) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerActive = false;
                this.powerCooldown = this.powerMaxCooldown;
            }

            // Continuous Power Effects
            if (this.charID === 'iron' || this.charID === 'strange') {
                this.velY = Math.max(this.velY - 0.8, -8); // Hovering
            }
            
            if (this.charID === 'thor' && this.powerTimer % 120 === 0) {
                // Zap random enemy
                if (enemies.length > 0) {
                    const target = enemies[Math.floor(Math.random() * enemies.length)];
                    target.hp -= 10;
                    if (target.hp <= 0) {
                        // handled in main update loop but we can trigger it here too or let it be
                    }
                }
            }

            if (this.charID === 'wolverine' && this.powerTimer % 60 === 0) {
                if (this.lives < this.maxLives) {
                    this.lives++;
                    if(document.getElementById('hud-lives')) document.getElementById('hud-lives').innerText = this.lives;
                }
            }
        }

        // --- Weapon Switching ---
        if (window.keys.switchWeapon && performance.now() - this.lastWeaponSwitch > 300) {
            this.lastWeaponSwitch = performance.now();
            this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
            window.sounds.playTone(200, 'square', 0.1);
        }

        // --- Grenades ---
        if (window.keys.throwGrenade && this.grenades > 0 && performance.now() - this.lastGrenade > 1000) {
            this.lastGrenade = performance.now();
            this.grenades--;
            projectiles.push({
                type: 'grenade',
                x: this.x + this.width / 2,
                y: this.y + 20,
                width: 20,
                height: 20,
                velX: this.direction * 12,
                velY: -10,
                timer: 120, // 2 seconds
                color: '#2ecc71'
            });
            window.sounds.playTone(150, 'triangle', 0.2);
        }

        // Combat
        if (window.keys.shoot && performance.now() - this.lastShoot > currentWeapon.interval) {
            this.lastShoot = performance.now();
            window.sounds.playShoot();
            
            projectiles.push({
                type: 'player',
                x: this.direction > 0 ? this.x + this.width : this.x - 25,
                y: this.isCrouching ? this.y + this.height * 0.4 : this.y + 35,
                width: currentWeapon.id === 'heavy' ? 40 : 25,
                height: currentWeapon.id === 'heavy' ? 12 : 8,
                velX: this.direction * currentWeapon.speed,
                color: currentWeapon.color,
                damage: currentWeapon.damage
            });
        }

        window.applyPhysics(this, platforms);
    }
};

window.Enemy = class Enemy {
    constructor(x, y, isBoss = false, levelMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.isBoss = isBoss;
        
        this.width = isBoss ? 80 : 40;
        this.height = isBoss ? 150 : 80;
        
        this.maxHP = isBoss ? (40 * levelMultiplier) : (3 * levelMultiplier);
        this.hp = this.maxHP;
        this.velX = isBoss ? -1.5 : -2.5; 
        this.velY = 0;
        this.direction = -1;
        this.isGrounded = false;
        
        this.lastShoot = 0;
        this.shootInterval = isBoss ? 800 : (1500 + Math.random() * 1000);
        this.animTime = Math.random() * 10;
        
        // AI State
        this.state = 'patrol'; 
        this.patrolRange = 250;
        this.detectionRange = 600;
        this.isSpotted = false;
        
        this.levelMultiplier = levelMultiplier;
    }

    update(platforms, player, projectiles) {
        this.animTime += 0.12;

        const distToPlayer = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
        
        // AI Evasion: Jump if player bullet is coming
        if (this.isGrounded && this.levelMultiplier > 1.2) {
            for (let p of projectiles) {
                if (p.type === 'player' && Math.abs(p.y - this.y) < 100 && Math.abs(p.x - this.x) < 200) {
                    if (Math.random() < 0.05 * this.levelMultiplier) { // Probability increases with level
                        this.velY = -12;
                        this.isGrounded = false;
                    }
                }
            }
        }

        // Detection Logic
        let canSeePlayer = false;
        if (distToPlayer < this.detectionRange) {
            const toPlayerX = player.x - this.x;
            if ((this.direction > 0 && toPlayerX > 0) || (this.direction < 0 && toPlayerX < 0)) {
                canSeePlayer = true;
                this.isSpotted = true;
            }
        }

        if (this.isSpotted || this.isBoss) {
            this.state = 'attack';
            this.direction = player.x < this.x ? -1 : 1;
            
            if (distToPlayer > 350) {
                this.velX = this.direction * 2.5;
            } else if (distToPlayer < 200) {
                this.velX = -this.direction * 1.5; // Back away if too close
            } else {
                this.velX = 0;
            }

            // Shooting logic
            if (performance.now() - this.lastShoot > this.shootInterval) {
                this.lastShoot = performance.now();
                projectiles.push({
                    type: 'enemy',
                    x: this.direction > 0 ? this.x + this.width : this.x - 20,
                    y: this.isBoss ? this.y + 80 : this.y + 35, // Boss bullet spawn adjusted
                    width: 20,
                    height: 6,
                    velX: this.direction * (this.isBoss ? 16 : 12),
                    color: '#ff3333'
                });
            }
        } else {
            this.state = 'patrol';
            if (Math.abs(this.x - this.startX) > this.patrolRange) {
                this.direction *= -1;
                this.x = this.startX + (this.patrolRange * this.direction);
            }
            this.velX = this.direction * 1.5;
        }
        
        window.applyPhysics(this, platforms);
    }
};
