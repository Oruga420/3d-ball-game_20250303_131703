// Player class for the 3D Ball Adventure game
class Player {
    constructor(scene, physics, position = { x: 0, y: 3, z: 0 }) {
        this.scene = scene;
        this.physics = physics;
        
        // Player properties
        this.radius = 0.5;
        this.position = position;
        this.spawnPosition = { ...position }; // Store initial position for respawning
        this.moveForce = 20;
        this.jumpForce = 12;
        this.maxSpeed = 10;
        this.canJump = false;
        this.isJumping = false;
        this.jumpCooldown = 0;
        
        // Movement state
        this.moveDirection = { x: 0, z: 0 };
        this.isMoving = false;
        
        // Special abilities
        this.hasJumpPower = false;
        this.hasSpeedBoost = false;
        this.speedBoostFactor = 1.5;
        
        // Create the ball mesh
        this.createBallMesh();
        
        // Create physics body
        this.createPhysicsBody();
        
        // Add trail effect
        this.createTrail();
        
        // Setup contact detection
        this.setupContactEvents();
    }
    
    createBallMesh() {
        // Create the main ball geometry
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        
        // Create materials for the ball with a slightly metallic appearance
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0x2194ce,
            metalness: 0.7,
            roughness: 0.3,
            envMapIntensity: 0.8
        });
        
        // Create the mesh
        this.mesh = new THREE.Mesh(geometry, ballMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Add decoration to the ball - stripes
        const stripeGeometry = new THREE.TorusGeometry(this.radius * 0.85, this.radius * 0.15, 16, 100);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.4
        });
        
        this.stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
        this.stripe1.rotation.x = Math.PI / 2;
        this.mesh.add(this.stripe1);
        
        this.stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
        this.stripe2.rotation.z = Math.PI / 2;
        this.mesh.add(this.stripe2);
        
        // Add the mesh to the scene
        this.scene.add(this.mesh);
    }
    
    createPhysicsBody() {
        // Create a sphere physics body
        this.body = this.physics.createSphereBody(this.radius, this.position);
        
        // Store references to link the mesh with the physics body
        this.physics.addBodyMeshPair(this.body, this.mesh);
        
        // Set up collision filtering if needed
        // this.body.collisionFilterGroup = 2;
        // this.body.collisionFilterMask = 1 | 4;  // Collide with groups 1 and 4
    }
    
    createTrail() {
        // Create a trail effect using particles
        this.trailActive = false;
        this.trailParticles = [];
        this.trailMaxParticles = 30;
        this.trailEmitRate = 3; // Particles per frame when moving fast
        this.trailCounter = 0;
        
        // Create a particle geometry and material
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        this.particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.7
        });
        
        // Pre-create some particles
        for (let i = 0; i < this.trailMaxParticles; i++) {
            const particle = new THREE.Mesh(particleGeometry, this.particleMaterial.clone());
            particle.scale.set(1, 1, 1);
            particle.visible = false;
            this.scene.add(particle);
            
            this.trailParticles.push({
                mesh: particle,
                life: 0,
                maxLife: 30,
                active: false
            });
        }
    }
    
    setupContactEvents() {
        // Listen for contact events to detect when the ball is touching the ground
        const self = this;
        
        this.body.addEventListener('collide', function(event) {
            const contact = event.contact;
            
            // Check if the contact normal is pointing upward (ball is on ground)
            // We use a slight threshold to account for uneven surfaces
            if (contact.ni.y > 0.5) {
                self.canJump = true;
                self.isJumping = false;
            }
        });
    }
    
    update(deltaTime, inputState) {
        // Process input and update movement
        this.processInput(inputState, deltaTime);
        
        // Apply movement forces
        this.applyMovementForces(deltaTime);
        
        // Check if player has fallen off the level
        this.checkBounds();
        
        // Update the trail effect
        this.updateTrail(deltaTime);
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        // Update any powerup effects
        this.updatePowerups(deltaTime);
    }
    
    processInput(inputState, deltaTime) {
        // Reset movement direction
        this.moveDirection.x = 0;
        this.moveDirection.z = 0;
        
        // Process keyboard input
        if (inputState.forward) this.moveDirection.z -= 1;
        if (inputState.backward) this.moveDirection.z += 1;
        if (inputState.left) this.moveDirection.x -= 1;
        if (inputState.right) this.moveDirection.x += 1;
        
        // Normalize the direction if moving diagonally
        if (this.moveDirection.x !== 0 || this.moveDirection.z !== 0) {
            this.isMoving = true;
            
            // Normalize only if moving diagonally
            if (this.moveDirection.x !== 0 && this.moveDirection.z !== 0) {
                const length = Math.sqrt(this.moveDirection.x * this.moveDirection.x + this.moveDirection.z * this.moveDirection.z);
                this.moveDirection.x /= length;
                this.moveDirection.z /= length;
            }
        } else {
            this.isMoving = false;
        }
        
        // Handle jumping
        if (inputState.jump && this.canJump && this.jumpCooldown <= 0) {
            this.jump();
        }
    }
    
    applyMovementForces(deltaTime) {
        if (this.isMoving) {
            // Apply the movement force
            let actualMoveForce = this.moveForce;
            
            // Apply speed boost if active
            if (this.hasSpeedBoost) {
                actualMoveForce *= this.speedBoostFactor;
            }
            
            // Get current velocity
            const velocity = this.body.velocity;
            
            // Apply force in the movement direction
            const force = new CANNON.Vec3(
                this.moveDirection.x * actualMoveForce * deltaTime,
                0,
                this.moveDirection.z * actualMoveForce * deltaTime
            );
            
            // Rotate force to align with camera if needed
            // We'd need to apply the camera's Y-axis rotation here
            
            this.body.applyForce(force, this.body.position);
            
            // Limit maximum speed (only for horizontal motion)
            const horizontalVelocity = new CANNON.Vec3(velocity.x, 0, velocity.z);
            const speed = horizontalVelocity.length();
            
            let maxSpeed = this.maxSpeed;
            if (this.hasSpeedBoost) {
                maxSpeed *= this.speedBoostFactor;
            }
            
            if (speed > maxSpeed) {
                // Scale the velocity to the max speed
                const scaleFactor = maxSpeed / speed;
                velocity.x *= scaleFactor;
                velocity.z *= scaleFactor;
                this.body.velocity = velocity;
            }
            
            // Set the trail to active when moving fast
            this.trailActive = speed > maxSpeed * 0.7;
            
            // Rotate ball mesh based on movement direction
            // We can calculate the rotation axis based on the current velocity and up vector
            const vx = this.body.velocity.x;
            const vz = this.body.velocity.z;
            
            if (Math.abs(vx) > 0.1 || Math.abs(vz) > 0.1) {
                // The axis of rotation should be perpendicular to movement direction
                const rotationAxis = new THREE.Vector3(-vz, 0, vx).normalize();
                const rotationAmount = speed * deltaTime * 1.5;
                
                // Create a quaternion for this rotation
                const quat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAmount);
                
                // Apply this rotation to the ball's decoration elements
                this.stripe1.applyQuaternion(quat);
                this.stripe2.applyQuaternion(quat);
            }
        } else {
            // Apply some damping when not actively moving
            this.body.velocity.x *= 0.95;
            this.body.velocity.z *= 0.95;
            this.trailActive = false;
        }
    }
    
    jump() {
        if (!this.canJump) return;
        
        // Only allow jumping with the jump powerup, or from special launch pads
        if (!this.hasJumpPower && !this.isOnJumpPad) return;
        
        // Apply upward impulse
        const jumpImpulse = new CANNON.Vec3(0, this.jumpForce, 0);
        this.body.applyImpulse(jumpImpulse, this.body.position);
        
        // Update state
        this.canJump = false;
        this.isJumping = true;
        this.jumpCooldown = 0.5; // Half-second cooldown
        
        // Trigger jump animation or effect
        this.triggerJumpEffect();
    }
    
    triggerJumpEffect() {
        // Play a jumping animation or particle effect
        // For example, create a small burst of particles at the jump location
        
        // Create 5 temporary particles that shoot downward
        const jumpParticleCount = 5;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < jumpParticleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.mesh.position);
            particle.position.y -= this.radius * 0.9;
            
            // Random horizontal velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    -0.02 - Math.random() * 0.03,
                    Math.sin(angle) * speed
                ),
                life: 0,
                maxLife: 30 + Math.random() * 30
            };
            
            this.scene.add(particle);
            
            // Set a timeout to remove the particle
            setTimeout(() => {
                this.scene.remove(particle);
            }, 1000);
        }
    }
    
    updateTrail(deltaTime) {
        // Update existing trail particles
        for (let i = 0; i < this.trailParticles.length; i++) {
            const particle = this.trailParticles[i];
            
            if (particle.active) {
                particle.life++;
                
                // Fade out and shrink based on life
                const lifeRatio = particle.life / particle.maxLife;
                particle.mesh.material.opacity = 0.7 * (1 - lifeRatio);
                particle.mesh.scale.setScalar(1 - lifeRatio);
                
                // Deactivate if past max life
                if (particle.life >= particle.maxLife) {
                    particle.active = false;
                    particle.mesh.visible = false;
                }
            }
        }
        
        // Emit new particles if moving fast
        if (this.trailActive) {
            this.trailCounter += this.trailEmitRate * deltaTime * 60; // Scale with frame rate
            
            while (this.trailCounter >= 1) {
                this.emitTrailParticle();
                this.trailCounter--;
            }
        }
    }
    
    emitTrailParticle() {
        // Find an inactive particle
        for (let i = 0; i < this.trailParticles.length; i++) {
            const particle = this.trailParticles[i];
            
            if (!particle.active) {
                // Position at bottom of ball
                particle.mesh.position.copy(this.mesh.position);
                particle.mesh.position.y -= this.radius * 0.8;
                
                // Reset particle properties
                particle.life = 0;
                particle.active = true;
                particle.mesh.visible = true;
                particle.mesh.scale.set(1, 1, 1);
                
                // Set a random color variation
                const hue = Math.random() * 0.1 + 0.6; // Blue-ish hue
                particle.mesh.material.color.setHSL(hue, 0.8, 0.5);
                particle.mesh.material.opacity = 0.7;
                
                return;
            }
        }
    }
    
    checkBounds() {
        // Check if player has fallen below the level's death plane
        if (this.mesh.position.y < -10) {
            this.die();
        }
    }
    
    die() {
        // Handle player death
        // Trigger death animation and respawn
        
        // Emit a burst of particles for death effect
        this.createDeathEffect();
        
        // Respawn the player
        this.respawn();
        
        // Notify the game manager about the death
        if (this.onDeath) {
            this.onDeath();
        }
    }
    
    createDeathEffect() {
        // Create a burst of particles at the player's last position
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5555,
            transparent: true,
            opacity: 0.9
        });
        
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.position.copy(this.mesh.position);
            
            // Random color
            particle.material.color.setHSL(Math.random(), 0.8, 0.5);
            
            // Random velocity
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2;
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle1) * Math.cos(angle2) * speed,
                    Math.sin(angle2) * speed,
                    Math.sin(angle1) * Math.cos(angle2) * speed
                ),
                life: 0,
                maxLife: 60
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate the particles
        const animateParticles = () => {
            let allDead = true;
            
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];
                particle.userData.life++;
                
                if (particle.userData.life < particle.userData.maxLife) {
                    allDead = false;
                    
                    // Update position
                    particle.position.add(particle.userData.velocity);
                    
                    // Add gravity effect
                    particle.userData.velocity.y -= 0.005;
                    
                    // Fade out
                    const lifeRatio = particle.userData.life / particle.userData.maxLife;
                    particle.material.opacity = 0.9 * (1 - lifeRatio);
                    particle.scale.setScalar(1 - 0.5 * lifeRatio);
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
    
    respawn() {
        // Reset the player's position and velocity
        this.body.position.set(
            this.spawnPosition.x,
            this.spawnPosition.y,
            this.spawnPosition.z
        );
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        // Reset other player states
        this.canJump = false;
        this.isJumping = false;
        this.jumpCooldown = 0.5;
        
        // Reset powerups
        this.removeAllPowerups();
    }
    
    setSpawnPoint(position) {
        this.spawnPosition = { ...position };
    }
    
    giveJumpPower(duration = 10) {
        this.hasJumpPower = true;
        
        // Change appearance to indicate jump power
        this.mesh.material.color.set(0x00ff00); // Green color
        
        // Clear any existing jump power timeout
        if (this.jumpPowerTimeout) {
            clearTimeout(this.jumpPowerTimeout);
        }
        
        // Set timeout to remove the power
        this.jumpPowerTimeout = setTimeout(() => {
            this.hasJumpPower = false;
            this.mesh.material.color.set(0x2194ce); // Reset to original color
            this.jumpPowerTimeout = null;
        }, duration * 1000);
    }
    
    giveSpeedBoost(duration = 5) {
        this.hasSpeedBoost = true;
        
        // Change appearance to indicate speed boost
        this.mesh.material.color.set(0xff8800); // Orange color
        
        // Clear any existing speed boost timeout
        if (this.speedBoostTimeout) {
            clearTimeout(this.speedBoostTimeout);
        }
        
        // Set timeout to remove the power
        this.speedBoostTimeout = setTimeout(() => {
            this.hasSpeedBoost = false;
            this.mesh.material.color.set(0x2194ce); // Reset to original color
            this.speedBoostTimeout = null;
        }, duration * 1000);
    }
    
    removeAllPowerups() {
        // Remove all powerups and reset appearance
        this.hasJumpPower = false;
        this.hasSpeedBoost = false;
        
        // Clear any existing timeouts
        if (this.jumpPowerTimeout) {
            clearTimeout(this.jumpPowerTimeout);
            this.jumpPowerTimeout = null;
        }
        
        if (this.speedBoostTimeout) {
            clearTimeout(this.speedBoostTimeout);
            this.speedBoostTimeout = null;
        }
        
        // Reset appearance
        this.mesh.material.color.set(0x2194ce);
    }
    
    updatePowerups(deltaTime) {
        // Update the visual effects for powerups
        if (this.hasJumpPower || this.hasSpeedBoost) {
            // Pulsate effect on the ball
            const time = performance.now() * 0.001;
            const pulseScale = 1 + Math.sin(time * 5) * 0.05;
            
            // Apply the pulse scale to the decoration elements
            this.stripe1.scale.setScalar(pulseScale);
            this.stripe2.scale.setScalar(pulseScale);
        } else {
            // Reset scales if no powerups are active
            this.stripe1.scale.setScalar(1);
            this.stripe2.scale.setScalar(1);
        }
    }
    
    setOnDeathCallback(callback) {
        this.onDeath = callback;
    }
    
    cleanup() {
        // Remove the player's mesh from the scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Remove the player's body from the physics world
        if (this.body) {
            this.physics.removeBodyMeshPair(this.body, this.mesh);
        }
        
        // Clear trail particles
        for (let i = 0; i < this.trailParticles.length; i++) {
            const particle = this.trailParticles[i];
            if (particle.mesh) {
                this.scene.remove(particle.mesh);
            }
        }
        
        // Clear timeouts
        if (this.jumpPowerTimeout) {
            clearTimeout(this.jumpPowerTimeout);
        }
        
        if (this.speedBoostTimeout) {
            clearTimeout(this.speedBoostTimeout);
        }
    }
}