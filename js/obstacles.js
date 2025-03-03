// This file is for specialized obstacle types that need dedicated behaviors
// Basic obstacles are handled in level.js, but more complex ones can be defined here

class ObstaclesManager {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // Track active obstacles
        this.obstacles = [];
        
        // Track specialized obstacle types
        this.spikesActive = false;
        this.timeToNextSpikeToggle = 2.0;
        
        // Materials
        this.obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc3333,
            metalness: 0.6,
            roughness: 0.4
        });
        
        this.warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            emissive: 0xffcc00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
    }
    
    update(deltaTime) {
        // Update all active obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (obstacle.update) {
                obstacle.update(deltaTime);
            }
            
            // Remove any obstacles marked for deletion
            if (obstacle.markedForDeletion) {
                this.removeObstacle(obstacle);
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update spike trap timing
        if (this.timeToNextSpikeToggle > 0) {
            this.timeToNextSpikeToggle -= deltaTime;
            
            if (this.timeToNextSpikeToggle <= 0) {
                this.spikesActive = !this.spikesActive;
                this.timeToNextSpikeToggle = this.spikesActive ? 1.0 : 2.0; // Active for 1 second, inactive for 2
                
                // Update all spike traps
                for (const obstacle of this.obstacles) {
                    if (obstacle.type === 'spikeTrap') {
                        obstacle.setActive(this.spikesActive);
                    }
                }
            }
        }
    }
    
    createSpikeTrap(position, size = 2) {
        // Create a platform with spikes that appear and disappear
        const baseSize = size;
        const spikeHeight = 0.6;
        
        // Base platform
        const baseGeometry = new THREE.BoxGeometry(baseSize, 0.2, baseSize);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.2,
            roughness: 0.8
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.copy(position);
        this.scene.add(baseMesh);
        
        // Create spikes
        const spikesGroup = new THREE.Group();
        const warningGeometry = new THREE.PlaneGeometry(baseSize * 0.95, baseSize * 0.95);
        const warningMesh = new THREE.Mesh(warningGeometry, this.warningMaterial.clone());
        warningMesh.rotation.x = -Math.PI / 2;
        warningMesh.position.y = 0.11;
        spikesGroup.add(warningMesh);
        
        // Create individual spikes
        const spikeCount = 5;
        const offset = baseSize / spikeCount;
        const spikeSize = offset * 0.4;
        
        for (let x = 0; x < spikeCount; x++) {
            for (let z = 0; z < spikeCount; z++) {
                const spikeGeom = new THREE.ConeGeometry(spikeSize, spikeHeight, 4);
                const spikeMesh = new THREE.Mesh(spikeGeom, this.obstacleMaterial);
                
                // Position the spike
                spikeMesh.position.set(
                    (x - (spikeCount - 1) / 2) * offset,
                    spikeHeight / 2,
                    (z - (spikeCount - 1) / 2) * offset
                );
                
                // Rotate to point upward
                spikeMesh.rotation.x = Math.PI;
                
                // Add to the group
                spikesGroup.add(spikeMesh);
            }
        }
        
        // Position the group
        spikesGroup.position.copy(position);
        spikesGroup.position.y += 0.1; // Above the base
        spikesGroup.visible = false; // Start hidden
        this.scene.add(spikesGroup);
        
        // Create physics body for the base
        const baseBody = this.physics.createBoxBody(
            baseSize, 0.2, baseSize,
            position
        );
        
        // Spike trap collision body (only active when spikes are up)
        const spikePosition = { ...position };
        spikePosition.y += 0.1 + spikeHeight / 2;
        
        const spikeBody = this.physics.createBoxBody(
            baseSize * 0.9, spikeHeight, baseSize * 0.9,
            spikePosition,
            null,
            0 // Static body
        );
        
        // Disable collision initially
        spikeBody.collisionResponse = false;
        
        // Create the obstacle object
        const spikeTrap = {
            type: 'spikeTrap',
            baseMesh: baseMesh,
            spikesMesh: spikesGroup,
            warningMesh: warningMesh,
            baseBody: baseBody,
            spikeBody: spikeBody,
            isActive: false,
            
            // Method to toggle the spikes
            setActive: function(active) {
                this.isActive = active;
                this.spikesMesh.visible = active;
                this.spikeBody.collisionResponse = active;
                
                // Pulse the warning when about to activate
                if (!active) {
                    this.pulseWarning();
                }
            },
            
            // Method to pulse the warning before spikes emerge
            pulseWarning: function() {
                const material = this.warningMesh.material;
                
                // Animation for the warning
                const startOpacity = 0.2;
                const endOpacity = 0.8;
                const duration = 2.0; // Match the inactive duration
                const steps = 20;
                
                for (let i = 0; i <= steps; i++) {
                    setTimeout(() => {
                        if (this.warningMesh) {
                            const progress = i / steps;
                            const opacity = startOpacity + progress * (endOpacity - startOpacity) * 
                                          (1 - Math.cos(progress * Math.PI * 4)) * 0.5; // Pulsing
                            
                            material.opacity = opacity;
                        }
                    }, (duration * 1000 * i) / steps);
                }
            },
            
            // Not needed for spike traps, but included for consistency
            update: function(deltaTime) {}
        };
        
        // Add to the obstacles list
        this.obstacles.push(spikeTrap);
        
        // Link meshes and bodies
        this.physics.addBodyMeshPair(baseBody, baseMesh);
        
        return spikeTrap;
    }
    
    createPendulum(position, length = 5, radius = 0.6) {
        // Create a swinging pendulum obstacle
        
        // Anchor point
        const anchorGeometry = new THREE.SphereGeometry(0.3);
        const anchorMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.7,
            roughness: 0.2
        });
        const anchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
        anchorMesh.position.copy(position);
        this.scene.add(anchorMesh);
        
        // Chain
        const chainGroup = new THREE.Group();
        const chainSegments = 8;
        const chainSegmentLength = length / chainSegments;
        const chainRadius = 0.1;
        
        for (let i = 0; i < chainSegments; i++) {
            const segmentGeometry = new THREE.CylinderGeometry(chainRadius, chainRadius, chainSegmentLength, 8);
            const segmentMesh = new THREE.Mesh(segmentGeometry, anchorMaterial);
            
            // Position along the chain
            segmentMesh.position.y = -chainSegmentLength * (i + 0.5);
            
            // Rotate to point down
            segmentMesh.rotation.x = Math.PI / 2;
            
            chainGroup.add(segmentMesh);
        }
        
        // Add chain to scene
        chainGroup.position.copy(position);
        this.scene.add(chainGroup);
        
        // Ball
        const ballGeometry = new THREE.SphereGeometry(radius);
        const ballMaterial = this.obstacleMaterial.clone();
        const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        
        // Position at the end of the chain
        ballMesh.position.copy(position);
        ballMesh.position.y -= length;
        this.scene.add(ballMesh);
        
        // Physics for the ball
        const ballBody = this.physics.createSphereBody(radius, {
            x: position.x,
            y: position.y - length,
            z: position.z
        }, 5); // Some mass for the ball
        
        // Create a constraint to simulate the pendulum
        const anchorPoint = new CANNON.Vec3(position.x, position.y, position.z);
        const constraint = new CANNON.PointToPointConstraint(
            ballBody,
            new CANNON.Vec3(0, 0, 0),
            this.physics.bodies[0], // Ground body or other static body
            anchorPoint
        );
        
        this.physics.world.addConstraint(constraint);
        
        // Apply initial impulse to start swinging
        const impulse = new CANNON.Vec3(10, 0, 0);
        ballBody.applyImpulse(impulse, ballBody.position);
        
        // Create the obstacle object
        const pendulum = {
            type: 'pendulum',
            anchorMesh: anchorMesh,
            chainGroup: chainGroup,
            ballMesh: ballMesh,
            ballBody: ballBody,
            constraint: constraint,
            length: length,
            
            // Update chain position based on ball position
            update: function(deltaTime) {
                // Update chain to follow the ball
                if (this.ballMesh && this.chainGroup && this.anchorMesh) {
                    // Calculate direction vector from anchor to ball
                    const dirVector = new THREE.Vector3().subVectors(
                        this.ballMesh.position,
                        this.anchorMesh.position
                    );
                    
                    // Calculate rotation needed to point to the ball
                    this.chainGroup.lookAt(this.ballMesh.position);
                    
                    // Adjust scale to maintain connection
                    const distance = dirVector.length();
                    this.chainGroup.scale.y = distance / this.length;
                }
            }
        };
        
        // Add to the obstacles list
        this.obstacles.push(pendulum);
        
        // Link meshes and bodies
        this.physics.addBodyMeshPair(ballBody, ballMesh);
        
        return pendulum;
    }
    
    createDisappearingPlatform(position, size = { width: 2, height: 0.5, depth: 2 }) {
        // Create a platform that disappears when the player stands on it
        
        // Platform mesh
        const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x887788,
            metalness: 0.3,
            roughness: 0.7,
            transparent: true,
            opacity: 1.0
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        // Physics body
        const body = this.physics.createBoxBody(
            size.width, size.height, size.depth,
            position
        );
        
        // Create the obstacle object
        const platform = {
            type: 'disappearingPlatform',
            mesh: mesh,
            body: body,
            initialPosition: { ...position },
            touchTime: 0,
            disappearDelay: 0.5, // Time after touch before disappearing
            disappearDuration: 2.0, // How long to disappear for
            respawnDuration: 3.0, // How long until respawn
            isDisappearing: false,
            isDisappeared: false,
            disappearTimer: 0,
            respawnTimer: 0,
            
            // Update the platform state
            update: function(deltaTime) {
                if (this.isDisappearing && !this.isDisappeared) {
                    // Platform is in the process of disappearing
                    this.disappearTimer += deltaTime;
                    
                    if (this.disappearTimer >= this.disappearDuration) {
                        // Platform has disappeared
                        this.isDisappeared = true;
                        this.isDisappearing = false;
                        this.disappearTimer = 0;
                        
                        // Hide the platform
                        this.mesh.visible = false;
                        this.body.collisionResponse = false;
                        
                        // Start respawn timer
                        this.respawnTimer = 0;
                    } else {
                        // Update visual appearance during disappearing
                        const progress = this.disappearTimer / this.disappearDuration;
                        this.mesh.material.opacity = 1 - progress;
                        
                        // Move slightly downward
                        this.mesh.position.y = this.initialPosition.y - progress * 0.5;
                    }
                } else if (this.isDisappeared) {
                    // Platform is disappeared, waiting to respawn
                    this.respawnTimer += deltaTime;
                    
                    if (this.respawnTimer >= this.respawnDuration) {
                        // Respawn the platform
                        this.isDisappeared = false;
                        this.mesh.visible = true;
                        this.mesh.material.opacity = 1.0;
                        this.mesh.position.copy(this.initialPosition);
                        
                        // Restore physics
                        this.body.position.copy(this.initialPosition);
                        this.body.collisionResponse = true;
                    }
                }
            },
            
            // Called when player collides with platform
            onPlayerContact: function() {
                if (!this.isDisappearing && !this.isDisappeared) {
                    this.isDisappearing = true;
                    this.disappearTimer = 0;
                }
            }
        };
        
        // Add to the obstacles list
        this.obstacles.push(platform);
        
        // Link meshes and bodies
        this.physics.addBodyMeshPair(body, mesh);
        
        return platform;
    }
    
    createVortex(position, radius = 3, strength = 10) {
        // Create a vortex that pulls the player towards it
        
        // Visual representation
        const vortexGeometry = new THREE.TorusGeometry(radius * 0.7, 0.2, 16, 100);
        const vortexMaterial = new THREE.MeshStandardMaterial({
            color: 0x6633cc,
            emissive: 0x3311aa,
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        const vortexMesh = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortexMesh.position.copy(position);
        vortexMesh.rotation.x = Math.PI / 2; // Lay flat
        this.scene.add(vortexMesh);
        
        // Particle effect for the vortex
        const particleCount = 50;
        const particles = [];
        
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x9966ff,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            
            // Random position around the vortex
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            particle.position.set(
                position.x + Math.cos(angle) * distance,
                position.y,
                position.z + Math.sin(angle) * distance
            );
            
            particle.userData = {
                angle: angle,
                distance: distance,
                speed: 0.5 + Math.random() * 0.5,
                orbitSpeed: 1 + Math.random(),
                verticalSpeed: 0.2 + Math.random() * 0.3,
                verticalPos: Math.random() * Math.PI * 2
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Create the obstacle object
        const vortex = {
            type: 'vortex',
            mesh: vortexMesh,
            particles: particles,
            position: position,
            radius: radius,
            strength: strength,
            rotationSpeed: 1.0,
            
            // Update the vortex appearance
            update: function(deltaTime) {
                // Rotate the vortex ring
                this.mesh.rotation.z += deltaTime * this.rotationSpeed;
                
                // Update particles
                const time = performance.now() * 0.001;
                
                for (const particle of this.particles) {
                    const data = particle.userData;
                    
                    // Update orbit position
                    data.angle += deltaTime * data.orbitSpeed;
                    
                    // Gradually move towards center
                    data.distance -= deltaTime * 0.2;
                    if (data.distance < 0.2) {
                        data.distance = this.radius;
                    }
                    
                    // Update vertical position
                    data.verticalPos += deltaTime * data.verticalSpeed;
                    
                    // Set new position
                    particle.position.set(
                        this.position.x + Math.cos(data.angle) * data.distance,
                        this.position.y + Math.sin(data.verticalPos) * 0.3,
                        this.position.z + Math.sin(data.angle) * data.distance
                    );
                    
                    // Fade opacity based on distance from center
                    const distanceRatio = data.distance / this.radius;
                    particle.material.opacity = 0.2 + 0.6 * (1 - distanceRatio);
                }
            },
            
            // Apply force to player near the vortex
            applyForceToPlayer: function(player, deltaTime) {
                // Calculate distance to player
                const dx = this.position.x - player.mesh.position.x;
                const dz = this.position.z - player.mesh.position.z;
                const distanceSquared = dx * dx + dz * dz;
                
                // Check if player is within range
                if (distanceSquared < this.radius * this.radius) {
                    // Calculate force based on distance
                    const distance = Math.sqrt(distanceSquared);
                    const forceMagnitude = (1 - distance / this.radius) * this.strength;
                    
                    // Direction towards vortex center
                    const direction = {
                        x: dx / distance,
                        y: 0,
                        z: dz / distance
                    };
                    
                    // Apply force to player
                    if (player.body) {
                        this.physics.applyForce(
                            player.body,
                            direction,
                            forceMagnitude * deltaTime
                        );
                    }
                }
            }
        };
        
        // Add to the obstacles list
        this.obstacles.push(vortex);
        
        return vortex;
    }
    
    // Apply forces from obstacles to the player
    applyObstacleForces(player, deltaTime) {
        for (const obstacle of this.obstacles) {
            // Special cases for different obstacle types
            if (obstacle.type === 'vortex' && obstacle.applyForceToPlayer) {
                obstacle.applyForceToPlayer(player, deltaTime);
            }
            
            // Check for platform collisions
            if (obstacle.type === 'disappearingPlatform') {
                // Check if player is on the platform
                const playerPos = player.mesh.position;
                const platformPos = obstacle.mesh.position;
                
                // Simple box collision check
                if (Math.abs(playerPos.x - platformPos.x) < obstacle.mesh.geometry.parameters.width / 2 &&
                    Math.abs(playerPos.z - platformPos.z) < obstacle.mesh.geometry.parameters.depth / 2 &&
                    Math.abs(playerPos.y - (platformPos.y + obstacle.mesh.geometry.parameters.height / 2 + player.radius)) < 0.1) {
                    
                    obstacle.onPlayerContact();
                }
            }
        }
    }
    
    removeObstacle(obstacle) {
        // Remove meshes
        if (obstacle.mesh) {
            this.scene.remove(obstacle.mesh);
        }
        
        if (obstacle.chainGroup) {
            this.scene.remove(obstacle.chainGroup);
        }
        
        if (obstacle.anchorMesh) {
            this.scene.remove(obstacle.anchorMesh);
        }
        
        if (obstacle.ballMesh) {
            this.scene.remove(obstacle.ballMesh);
        }
        
        if (obstacle.baseMesh) {
            this.scene.remove(obstacle.baseMesh);
        }
        
        if (obstacle.spikesMesh) {
            this.scene.remove(obstacle.spikesMesh);
        }
        
        // Remove particles
        if (obstacle.particles) {
            for (const particle of obstacle.particles) {
                this.scene.remove(particle);
            }
        }
        
        // Remove physics bodies
        if (obstacle.body) {
            this.physics.world.removeBody(obstacle.body);
        }
        
        if (obstacle.ballBody) {
            this.physics.world.removeBody(obstacle.ballBody);
        }
        
        if (obstacle.baseBody) {
            this.physics.world.removeBody(obstacle.baseBody);
        }
        
        if (obstacle.spikeBody) {
            this.physics.world.removeBody(obstacle.spikeBody);
        }
        
        // Remove constraints
        if (obstacle.constraint) {
            this.physics.world.removeConstraint(obstacle.constraint);
        }
    }
    
    cleanup() {
        // Remove all obstacles
        for (const obstacle of this.obstacles) {
            this.removeObstacle(obstacle);
        }
        
        this.obstacles = [];
    }
}