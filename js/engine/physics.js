// Physics configuration
window.physicsConfig = {
    gravity: 0.6,
    terminalVelocity: 15,
    groundY: 450 // dynamic relative to screen
};

window.checkCollisionAABB = function(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
};

window.applyPhysics = function(entity, platforms) {
    // Apply gravity
    if (!entity.isGrounded) {
        entity.velY += window.physicsConfig.gravity;
        if (entity.velY > window.physicsConfig.terminalVelocity) {
            entity.velY = window.physicsConfig.terminalVelocity;
        }
    }

    // --- X-AXIS COLLISION ---
    entity.x += entity.velX;
    if (platforms) {
        for (let plat of platforms) {
            if (window.checkCollisionAABB(entity, plat)) {
                // If moving right, hit left side of wall
                if (entity.velX > 0) {
                    entity.x = plat.x - entity.width;
                }
                // If moving left, hit right side of wall
                else if (entity.velX < 0) {
                    entity.x = plat.x + plat.width;
                }
                entity.velX = 0;
            }
        }
    }
    
    // --- Y-AXIS COLLISION ---
    entity.y += entity.velY;
    entity.isGrounded = false;

    if (platforms) {
        for (let plat of platforms) {
            // If moving down, and bottom of entity is intersecting top of platform
            if (entity.velY > 0 && 
                entity.y + entity.height >= plat.y && 
                entity.y + entity.height - entity.velY <= plat.y + 10 && 
                entity.x + entity.width > plat.x && 
                entity.x < plat.x + plat.width) {
                
                entity.y = plat.y - entity.height;
                entity.velY = 0;
                entity.isGrounded = true;
            }
            // If moving up, hit ceiling (bottom of platform)
            else if (entity.velY < 0 && 
                     entity.y <= plat.y + plat.height && 
                     entity.y - entity.velY >= plat.y + plat.height - 10 &&
                     entity.x + entity.width > plat.x && 
                     entity.x < plat.x + plat.width) {
                entity.y = plat.y + plat.height;
                entity.velY = 0;
            }
        }
    }

    // Floor collision
    if (entity.y + entity.height >= window.physicsConfig.groundY) {
        entity.y = window.physicsConfig.groundY - entity.height;
        entity.velY = 0;
        entity.isGrounded = true;
    }
    
    // World Boundary X
    if (entity.x < 0) entity.x = 0;
};
