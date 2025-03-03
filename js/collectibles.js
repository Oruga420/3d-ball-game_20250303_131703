// Collectibles manager for the 3D Ball Adventure game
class CollectiblesManager {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // Collection of all collectibles
        this.collectibles = [];
        
        // Collectible types
        this.types = {
            COIN: 'coin',
            JUMP_POWER: 'jump_power',
            SPEED_BOOST: 'speed_boost',
            CHECKPOINT: 'checkpoint'
        };
        
        // Collectible animations
        this.animating = true;
        this.animationTime = 0;
        
        // Reusable geometries
        this.coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
        this.powerGeometry = new THREE.IcosahedronGeometry(0.3, 1);
        this.checkpointGeometry = new THREE.BoxGeometry(1, 0.2, 1);
        
        // Reusable materials
        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 1.0,
            roughness: 0.3,
            emissive: 0x996600,
            emissiveIntensity: 0.4
        });
        
        this.jumpMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x00aa00,
            emissiveIntensity: 0.5
        });
        
        this.speedMaterial = new THREE.MeshStandardMaterial({
            color: 0xff8800,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0xaa5500,
            emissiveIntensity: 0.5
        });
        
        this.checkpointMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.5,
            roughness: 0.5,
            emissive: 0x00aaaa,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
    }
    
    update(deltaTime, player) {
        // Update all collectibles (animation, collision detection)
        this.updateAnimation(deltaTime);
        this.checkCollisions(player);
    }
    
    updateAnimation(deltaTime) {
        if (!this.animating) return;
        
        // Update animation time
        this.animationTime += deltaTime;
        
        // Animate each collectible
        for (const collectible of this.collectibles) {
            if (!collectible.collected) {
                // Rotate coins
                if (collectible.type === this.types.COIN) {
                    collectible.mesh.rotation.y += 2 * deltaTime;
                }
                
                // Hover effect for all collectibles
                const hoverHeight = 0.1;
                const hoverSpeed = 2;
                const newY = collectible.basePosition.y + 
                    Math.sin(this.animationTime * hoverSpeed) * hoverHeight;
                
                collectible.mesh.position.y = newY;
                
                // Pulse effect for power-ups
                if (collectible.type === this.types.JUMP_POWER || 
                    collectible.type === this.types.SPEED_BOOST) {
                    // Scale pulse
                    const scale = 1 + Math.sin(this.animationTime * 5) * 0.1;
                    collectible.mesh.scale.set(scale, scale, scale);
                    
                    // Rotate on two axes
                    collectible.mesh.rotation.x += deltaTime;
                    collectible.mesh.rotation.y += deltaTime * 1.5;
                }
                
                // Checkpoint pulse
                if (collectible.type === this.types.CHECKPOINT && !collectible.activated) {
                    // Pulse the opacity
                    const opacity = 0.5 + Math.sin(this.animationTime * 3) * 0.3;
                    collectible.mesh.material.opacity = Math.max(0.2, opacity);
                }
            }
        }
    }
    
    checkCollisions(player) {
        // Check for collisions between player and collectibles
        for (const collectible of this.collectibles) {
            // Skip already collected items
            if (collectible.collected) continue;
            
            // Calculate distance to player
            const distance = player.mesh.position.distanceTo(collectible.mesh.position);
            
            // Collision check based on collectible type and radius
            const collisionRadius = collectible.radius + player.radius;
            
            if (distance < collisionRadius) {
                // Handle the collection
                this.collectItem(collectible, player);
            }
        }
    }
    
    createCoin(position) {
        const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
        mesh.position.copy(position);
        mesh.rotation.x = Math.PI / 2; // Lay the cylinder flat
        mesh.castShadow = true;
        
        const collectible = {
            type: this.types.COIN,
            mesh: mesh,
            collected: false,
            basePosition: { ...position },
            radius: 0.5,
            value: 10
        };
        
        this.scene.add(mesh);
        this.collectibles.push(collectible);
        
        return collectible;
    }
    
    createJumpPower(position) {
        const mesh = new THREE.Mesh(this.powerGeometry, this.jumpMaterial);
        mesh.position.copy(position);
        mesh.castShadow = true;
        
        const collectible = {
            type: this.types.JUMP_POWER,
            mesh: mesh,
            collected: false,
            basePosition: { ...position },
            radius: 0.6,
            duration: 10 // seconds of effect
        };
        
        this.scene.add(mesh);
        this.collectibles.push(collectible);
        
        return collectible;
    }
    
    createSpeedBoost(position) {
        const mesh = new THREE.Mesh(this.powerGeometry, this.speedMaterial);
        mesh.position.copy(position);
        mesh.castShadow = true;
        
        const collectible = {
            type: this.types.SPEED_BOOST,
            mesh: mesh,
            collected: false,
            basePosition: { ...position },
            radius: 0.6,
            duration: 5 // seconds of effect
        };
        
        this.scene.add(mesh);
        this.collectibles.push(collectible);
        
        return collectible;
    }
    
    createCheckpoint(position) {
        const mesh = new THREE.Mesh(this.checkpointGeometry, this.checkpointMaterial.clone());
        mesh.position.copy(position);
        mesh.receiveShadow = true;
        
        const collectible = {
            type: this.types.CHECKPOINT,
            mesh: mesh,
            collected: false,
            activated: false,
            basePosition: { ...position },
            radius: 1.0
        };
        
        this.scene.add(mesh);
        this.collectibles.push(collectible);
        
        return collectible;
    }
    
    collectItem(collectible, player) {
        // Mark as collected
        collectible.collected = true;
        
        // Create collection effect
        this.createCollectionEffect(collectible);
        
        // Handle based on type
        switch(collectible.type) {
            case this.types.COIN:
                // Add to score
                if (this.onCoinCollected) {
                    this.onCoinCollected(collectible.value);
                }
                
                // Remove the coin mesh
                this.scene.remove(collectible.mesh);
                break;
                
            case this.types.JUMP_POWER:
                // Give player jump power
                player.giveJumpPower(collectible.duration);
                
                // Remove the powerup mesh
                this.scene.remove(collectible.mesh);
                break;
                
            case this.types.SPEED_BOOST:
                // Give player speed boost
                player.giveSpeedBoost(collectible.duration);
                
                // Remove the powerup mesh
                this.scene.remove(collectible.mesh);
                break;
                
            case this.types.CHECKPOINT:
                // Activate checkpoint
                if (!collectible.activated) {
                    collectible.activated = true;
                    collectible.mesh.material.color.set(0x00ff00);
                    collectible.mesh.material.emissive.set(0x00aa00);
                    collectible.mesh.material.opacity = 0.9;
                    
                    // Set player's spawn point
                    const spawnPosition = {
                        x: collectible.mesh.position.x,
                        y: collectible.mesh.position.y + 1, // Spawn slightly above the checkpoint
                        z: collectible.mesh.position.z
                    };
                    player.setSpawnPoint(spawnPosition);
                    
                    // Call callback
                    if (this.onCheckpointActivated) {
                        this.onCheckpointActivated(collectible);
                    }
                }
                
                // Don't set collected flag for checkpoints
                collectible.collected = false;
                break;
        }
        
        // Call general callback
        if (this.onCollectible) {
            this.onCollectible(collectible);
        }
    }
    
    createCollectionEffect(collectible) {
        // Create particle effect when collecting an item
        const particleCount = collectible.type === this.types.COIN ? 10 : 15;
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        
        // Determine particle color based on collectible type
        let color;
        switch(collectible.type) {
            case this.types.COIN:
                color = 0xFFD700; // Gold
                break;
            case this.types.JUMP_POWER:
                color = 0x00ff00; // Green
                break;
            case this.types.SPEED_BOOST:
                color = 0xff8800; // Orange
                break;
            case this.types.CHECKPOINT:
                color = 0x00ffff; // Cyan
                break;
            default:
                color = 0xffffff; // White
        }
        
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.position.copy(collectible.mesh.position);
            
            // Random velocity in all directions
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle1) * Math.cos(angle2) * speed,
                    Math.sin(angle2) * speed,
                    Math.sin(angle1) * Math.cos(angle2) * speed
                ),
                life: 0,
                maxLife: 30 + Math.random() * 30
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const animateParticles = () => {
            let allDead = true;
            
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];
                particle.userData.life++;
                
                if (particle.userData.life < particle.userData.maxLife) {
                    allDead = false;
                    
                    // Update position
                    particle.position.add(particle.userData.velocity);
                    
                    // Add slight gravity
                    particle.userData.velocity.y -= 0.001;
                    
                    // Fade out
                    const lifeRatio = particle.userData.life / particle.userData.maxLife;
                    particle.material.opacity = 0.8 * (1 - lifeRatio);
                } else {
                    // Remove dead particles
                    this.scene.remove(particle);
                }
            }
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    resetCollectibles() {
        // Reset all collectibles (e.g., when restarting a level)
        for (const collectible of this.collectibles) {
            // Skip checkpoints that have been activated
            if (collectible.type === this.types.CHECKPOINT && collectible.activated) {
                continue;
            }
            
            // Reset collected state
            if (collectible.collected) {
                collectible.collected = false;
                collectible.mesh.visible = true;
                this.scene.add(collectible.mesh);
            }
        }
    }
    
    getCoinCount() {
        // Get total number of coins in the level
        return this.collectibles.filter(c => c.type === this.types.COIN).length;
    }
    
    getCollectedCoins() {
        // Get number of collected coins
        return this.collectibles.filter(c => c.type === this.types.COIN && c.collected).length;
    }
    
    setCallbacks(callbacks) {
        // Set callbacks for collectible events
        this.onCollectible = callbacks.onCollectible;
        this.onCoinCollected = callbacks.onCoinCollected;
        this.onCheckpointActivated = callbacks.onCheckpointActivated;
    }
    
    cleanup() {
        // Remove all collectibles from the scene
        for (const collectible of this.collectibles) {
            this.scene.remove(collectible.mesh);
        }
        
        // Clear the collectibles array
        this.collectibles = [];
    }
}