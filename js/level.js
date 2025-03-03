// Level management for the 3D Ball Adventure game
class LevelManager {
    constructor(scene, physics, collectibles) {
        this.scene = scene;
        this.physics = physics;
        this.collectibles = collectibles;
        
        // Level data
        this.levels = [];
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        
        // Level objects
        this.platforms = [];
        this.obstacles = [];
        this.decorations = [];
        
        // Level state
        this.isLevelComplete = false;
        this.startTime = 0;
        this.completionTime = 0;
        
        // Materials
        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x666699,
            metalness: 0.2,
            roughness: 0.8
        });
        
        this.wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x557799,
            metalness: 0.3,
            roughness: 0.7
        });
        
        this.finishMaterial = new THREE.MeshStandardMaterial({
            color: 0x33aa33,
            metalness: 0.3,
            roughness: 0.5,
            emissive: 0x116611,
            emissiveIntensity: 0.5
        });
        
        // Create levels
        this.createLevels();
    }
    
    createLevels() {
        // Define level 1
        const level1 = {
            name: "Level 1: The Beginning",
            playerStart: { x: 0, y: 3, z: 0 },
            platforms: [
                // Main platform
                {
                    type: 'box',
                    width: 20, 
                    height: 1, 
                    depth: 20,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Ramp
                {
                    type: 'box',
                    width: 5,
                    height: 0.5,
                    depth: 3,
                    position: { x: 5, y: 0.5, z: 0 },
                    rotation: { x: 0.2, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Elevated platform
                {
                    type: 'box',
                    width: 8,
                    height: 1,
                    depth: 8,
                    position: { x: 12, y: 2, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Bridge
                {
                    type: 'box',
                    width: 2,
                    height: 0.5,
                    depth: 6,
                    position: { x: 12, y: 2, z: 8 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Final platform
                {
                    type: 'box',
                    width: 6,
                    height: 1,
                    depth: 6,
                    position: { x: 12, y: 2, z: 14 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                }
            ],
            obstacles: [
                // Revolving barrier
                {
                    type: 'revolvingBar',
                    width: 6,
                    height: 0.5,
                    depth: 0.5,
                    position: { x: 12, y: 3, z: 0 },
                    speed: 1.0
                },
                // Moving platform
                {
                    type: 'movingPlatform',
                    width: 2,
                    height: 0.5,
                    depth: 2,
                    position: { x: -6, y: 1, z: 0 },
                    axis: 'z',
                    distance: 5,
                    speed: 2.0
                }
            ],
            collectibles: [
                // Coins on main platform
                { type: 'coin', position: { x: -5, y: 1.5, z: -5 } },
                { type: 'coin', position: { x: -5, y: 1.5, z: 5 } },
                { type: 'coin', position: { x: 5, y: 1.5, z: -5 } },
                // Coins on ramp
                { type: 'coin', position: { x: 5, y: 2, z: 0 } },
                // Coins on elevated platform
                { type: 'coin', position: { x: 10, y: 3.5, z: 0 } },
                { type: 'coin', position: { x: 14, y: 3.5, z: 0 } },
                { type: 'coin', position: { x: 12, y: 3.5, z: -2 } },
                // Coins on bridge
                { type: 'coin', position: { x: 12, y: 3.5, z: 6 } },
                { type: 'coin', position: { x: 12, y: 3.5, z: 10 } },
                // Coins on final platform
                { type: 'coin', position: { x: 12, y: 3.5, z: 14 } },
                
                // Power-ups
                { type: 'jumpPower', position: { x: -8, y: 1.5, z: 0 } },
                { type: 'speedBoost', position: { x: 14, y: 3.5, z: -4 } },
                
                // Checkpoint
                { type: 'checkpoint', position: { x: 12, y: 2.5, z: 4 } }
            ],
            finish: {
                position: { x: 12, y: 2.5, z: 14 },
                radius: 1.5
            },
            decorations: [
                // Some trees or other decorative elements
                {
                    type: 'tree',
                    scale: 1.0,
                    position: { x: -8, y: 1, z: -8 }
                },
                {
                    type: 'tree',
                    scale: 1.2,
                    position: { x: 8, y: 1, z: -8 }
                },
                {
                    type: 'tree',
                    scale: 0.8,
                    position: { x: -8, y: 1, z: 8 }
                },
                {
                    type: 'tree',
                    scale: 1.5,
                    position: { x: 8, y: 1, z: 8 }
                }
            ]
        };
        
        // Define level 2
        const level2 = {
            name: "Level 2: The Challenge",
            playerStart: { x: 0, y: 3, z: 0 },
            platforms: [
                // Main starting platform
                {
                    type: 'box',
                    width: 10, 
                    height: 1, 
                    depth: 10,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // First gap with moving platform
                {
                    type: 'box',
                    width: 6,
                    height: 1,
                    depth: 6,
                    position: { x: 0, y: 0, z: 12 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Rotating platform section
                {
                    type: 'box',
                    width: 10,
                    height: 1,
                    depth: 10,
                    position: { x: 12, y: 2, z: 12 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Spiral ramp section
                {
                    type: 'box',
                    width: 10,
                    height: 1,
                    depth: 10,
                    position: { x: 12, y: 4, z: -8 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Ramp to spiral section
                {
                    type: 'box',
                    width: 6,
                    height: 0.5,
                    depth: 4,
                    position: { x: 12, y: 3, z: 2 },
                    rotation: { x: 0.1, y: 0, z: 0 },
                    material: this.groundMaterial
                },
                // Final platform
                {
                    type: 'box',
                    width: 6,
                    height: 1,
                    depth: 6,
                    position: { x: 24, y: 4, z: -8 },
                    rotation: { x: 0, y: 0, z: 0 },
                    material: this.groundMaterial
                }
            ],
            obstacles: [
                // Moving platform across first gap
                {
                    type: 'movingPlatform',
                    width: 3,
                    height: 0.5,
                    depth: 3,
                    position: { x: 0, y: 0.5, z: 6 },
                    axis: 'z',
                    distance: 3,
                    speed: 2.0
                },
                // Revolving bar on rotating platform
                {
                    type: 'revolvingBar',
                    width: 8,
                    height: 0.5,
                    depth: 0.5,
                    position: { x: 12, y: 3.5, z: 12 },
                    speed: 1.5
                },
                // Multiple revolving barriers on spiral section
                {
                    type: 'revolvingBar',
                    width: 6,
                    height: 0.5,
                    depth: 0.5,
                    position: { x: 12, y: 5.5, z: -8 },
                    speed: 2.0
                },
                // Moving obstacle between spiral and final
                {
                    type: 'movingPlatform',
                    width: 1,
                    height: 2,
                    depth: 1,
                    position: { x: 18, y: 5, z: -8 },
                    axis: 'x',
                    distance: 2,
                    speed: 3.0
                }
            ],
            collectibles: [
                // Coins on main platform
                { type: 'coin', position: { x: -3, y: 1.5, z: -3 } },
                { type: 'coin', position: { x: 3, y: 1.5, z: -3 } },
                { type: 'coin', position: { x: 3, y: 1.5, z: 3 } },
                { type: 'coin', position: { x: -3, y: 1.5, z: 3 } },
                
                // Coins near moving platform
                { type: 'coin', position: { x: 0, y: 1.5, z: 6 } },
                { type: 'coin', position: { x: 0, y: 1.5, z: 9 } },
                
                // Coins on second platform
                { type: 'coin', position: { x: 0, y: 1.5, z: 12 } },
                
                // Coins around rotating platform
                { type: 'coin', position: { x: 9, y: 3.5, z: 9 } },
                { type: 'coin', position: { x: 15, y: 3.5, z: 9 } },
                { type: 'coin', position: { x: 9, y: 3.5, z: 15 } },
                { type: 'coin', position: { x: 15, y: 3.5, z: 15 } },
                { type: 'coin', position: { x: 12, y: 3.5, z: 12 } },
                
                // Coins on ramp
                { type: 'coin', position: { x: 12, y: 4, z: 2 } },
                
                // Coins around spiral section
                { type: 'coin', position: { x: 9, y: 5.5, z: -5 } },
                { type: 'coin', position: { x: 9, y: 5.5, z: -11 } },
                { type: 'coin', position: { x: 15, y: 5.5, z: -5 } },
                { type: 'coin', position: { x: 15, y: 5.5, z: -11 } },
                { type: 'coin', position: { x: 12, y: 5.5, z: -8 } },
                
                // Coins on final platform
                { type: 'coin', position: { x: 24, y: 5.5, z: -8 } },
                
                // Power-ups
                { type: 'jumpPower', position: { x: 0, y: 1.5, z: 0 } },
                { type: 'speedBoost', position: { x: 10, y: 3.5, z: 12 } },
                { type: 'jumpPower', position: { x: 12, y: 5.5, z: -12 } },
                
                // Checkpoints
                { type: 'checkpoint', position: { x: 0, y: 0.5, z: 12 } },
                { type: 'checkpoint', position: { x: 12, y: 2.5, z: 12 } },
                { type: 'checkpoint', position: { x: 12, y: 4.5, z: -8 } }
            ],
            finish: {
                position: { x: 24, y: 4.5, z: -8 },
                radius: 1.5
            },
            decorations: [
                // Some decorative elements
                {
                    type: 'rock',
                    scale: 1.0,
                    position: { x: -4, y: 1, z: -4 }
                },
                {
                    type: 'rock',
                    scale: 1.2,
                    position: { x: 4, y: 1, z: -4 }
                },
                {
                    type: 'crystal',
                    scale: 1.5,
                    position: { x: 12, y: 4, z: 12 }
                },
                {
                    type: 'crystal',
                    scale: 1.8,
                    position: { x: 24, y: 6, z: -8 }
                }
            ]
        };
        
        // Add levels to the manager
        this.levels.push(level1);
        this.levels.push(level2);
    }
    
    loadLevel(levelIndex) {
        // Clear previous level
        this.clearLevel();
        
        // Set new level
        this.currentLevelIndex = levelIndex;
        this.currentLevel = this.levels[levelIndex];
        
        // Reset level state
        this.isLevelComplete = false;
        this.startTime = Date.now();
        
        // Build the level
        this.buildLevel(this.currentLevel);
        
        // Return the player's starting position
        return this.currentLevel.playerStart;
    }
    
    buildLevel(level) {
        // Create platforms
        for (const platformData of level.platforms) {
            this.createPlatform(platformData);
        }
        
        // Create obstacles
        for (const obstacleData of level.obstacles) {
            this.createObstacle(obstacleData);
        }
        
        // Create collectibles
        for (const collectibleData of level.collectibles) {
            this.createCollectible(collectibleData);
        }
        
        // Create finish area
        this.createFinishArea(level.finish);
        
        // Create decorations
        for (const decorationData of level.decorations) {
            this.createDecoration(decorationData);
        }
        
        // Create environment
        this.createEnvironment();
    }
    
    createPlatform(data) {
        let mesh, geometry, body;
        
        // Create geometry based on type
        switch (data.type) {
            case 'box':
                geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
                mesh = new THREE.Mesh(geometry, data.material || this.groundMaterial);
                
                // Position and rotation
                mesh.position.set(data.position.x, data.position.y, data.position.z);
                mesh.rotation.set(
                    data.rotation.x || 0,
                    data.rotation.y || 0,
                    data.rotation.z || 0
                );
                
                // Create physics body
                body = this.physics.createBoxBody(
                    data.width, data.height, data.depth,
                    data.position,
                    new CANNON.Quaternion().setFromEuler(
                        data.rotation.x || 0,
                        data.rotation.y || 0,
                        data.rotation.z || 0
                    )
                );
                break;
                
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    data.radiusTop, data.radiusBottom, data.height, 32
                );
                mesh = new THREE.Mesh(geometry, data.material || this.groundMaterial);
                
                // Position and rotation
                mesh.position.set(data.position.x, data.position.y, data.position.z);
                mesh.rotation.set(
                    data.rotation.x || 0,
                    data.rotation.y || 0,
                    data.rotation.z || 0
                );
                
                // Create physics body
                body = this.physics.createCylinderBody(
                    data.radiusTop, data.radiusBottom, data.height,
                    data.position,
                    new CANNON.Quaternion().setFromEuler(
                        data.rotation.x || 0,
                        data.rotation.y || 0,
                        data.rotation.z || 0
                    )
                );
                break;
                
            // Add more platform types as needed
        }
        
        if (mesh) {
            // Add shadow properties
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Add to scene
            this.scene.add(mesh);
            
            // Store in platforms array
            this.platforms.push({
                mesh: mesh,
                body: body,
                data: data
            });
            
            // Link mesh and body for physics updates
            this.physics.addBodyMeshPair(body, mesh);
        }
    }
    
    createObstacle(data) {
        let mesh, geometry, body, obstacle;
        
        // Create geometry based on type
        switch (data.type) {
            case 'revolvingBar':
                // Create a revolving obstacle
                geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
                mesh = new THREE.Mesh(geometry, this.wallMaterial);
                
                // Position
                mesh.position.set(data.position.x, data.position.y, data.position.z);
                
                // Create physics body
                body = this.physics.createBoxBody(
                    data.width, data.height, data.depth,
                    data.position,
                    null,
                    1 // Give it a small mass so it can be moved
                );
                
                // Constrain to rotate around center point
                const centerPos = new CANNON.Vec3(data.position.x, data.position.y, data.position.z);
                const constraint = new CANNON.PointToPointConstraint(
                    body,
                    new CANNON.Vec3(0, 0, 0),
                    this.physics.bodies[0], // Ground body or other static body
                    centerPos
                );
                
                this.physics.world.addConstraint(constraint);
                
                // Store in obstacles array with specific properties
                obstacle = {
                    mesh: mesh,
                    body: body,
                    data: data,
                    type: 'revolvingBar',
                    rotationAxis: new CANNON.Vec3(0, 1, 0),
                    rotationSpeed: data.speed || 1.0,
                    centerPoint: centerPos
                };
                
                break;
                
            case 'movingPlatform':
                // Create a moving platform
                geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
                mesh = new THREE.Mesh(geometry, this.wallMaterial);
                
                // Position
                mesh.position.set(data.position.x, data.position.y, data.position.z);
                
                // Create physics body
                body = this.physics.createBoxBody(
                    data.width, data.height, data.depth,
                    data.position,
                    null,
                    5 // Give it mass so it can be moved
                );
                
                // Store in obstacles array with specific properties
                obstacle = {
                    mesh: mesh,
                    body: body,
                    data: data,
                    type: 'movingPlatform',
                    startPos: { ...data.position },
                    axis: data.axis || 'x',
                    distance: data.distance || 5,
                    speed: data.speed || 1.0,
                    direction: 1,
                    progress: 0
                };
                
                break;
                
            // Add more obstacle types as needed
        }
        
        if (mesh) {
            // Add shadow properties
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Add to scene
            this.scene.add(mesh);
            
            // Store in obstacles array if not already added
            if (!obstacle) {
                obstacle = {
                    mesh: mesh,
                    body: body,
                    data: data
                };
            }
            
            this.obstacles.push(obstacle);
            
            // Link mesh and body for physics updates
            this.physics.addBodyMeshPair(body, mesh);
        }
    }
    
    createCollectible(data) {
        // Create the collectible based on type
        switch (data.type) {
            case 'coin':
                this.collectibles.createCoin(data.position);
                break;
                
            case 'jumpPower':
                this.collectibles.createJumpPower(data.position);
                break;
                
            case 'speedBoost':
                this.collectibles.createSpeedBoost(data.position);
                break;
                
            case 'checkpoint':
                this.collectibles.createCheckpoint(data.position);
                break;
        }
    }
    
    createFinishArea(data) {
        // Create a visual indicator for the finish area
        const geometry = new THREE.CylinderGeometry(data.radius, data.radius, 0.1, 32);
        const mesh = new THREE.Mesh(geometry, this.finishMaterial);
        
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.receiveShadow = true;
        
        this.scene.add(mesh);
        
        // Add particles or effects around the finish area
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            
            // Position in a circle around the finish area
            const angle = (i / particleCount) * Math.PI * 2;
            particle.position.set(
                data.position.x + Math.cos(angle) * (data.radius + 0.2),
                data.position.y + 0.5,
                data.position.z + Math.sin(angle) * (data.radius + 0.2)
            );
            
            // Add animation data
            particle.userData = {
                baseY: data.position.y + 0.5,
                angle: angle,
                speed: 0.5 + Math.random() * 0.5,
                amplitude: 0.2 + Math.random() * 0.3
            };
            
            this.scene.add(particle);
            
            // Add to decorations for animation
            this.decorations.push({
                mesh: particle,
                type: 'finishParticle',
                data: particle.userData
            });
        }
        
        // Store finish area data
        this.finishArea = {
            position: data.position,
            radius: data.radius,
            mesh: mesh
        };
    }
    
    createDecoration(data) {
        let mesh;
        
        switch(data.type) {
            case 'tree':
                // Create a simple tree
                const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                
                const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
                const leavesMaterial = new THREE.MeshStandardMaterial({
                    color: 0x2E8B57,
                    roughness: 0.8
                });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 1.5;
                
                mesh = new THREE.Group();
                mesh.add(trunk);
                mesh.add(leaves);
                break;
                
            case 'rock':
                // Create a simple rock
                const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
                const rockMaterial = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 1.0
                });
                mesh = new THREE.Mesh(rockGeometry, rockMaterial);
                mesh.scale.y = 0.7;
                break;
                
            case 'crystal':
                // Create a crystal decoration
                const crystalGeometry = new THREE.OctahedronGeometry(0.5, 0);
                const crystalMaterial = new THREE.MeshStandardMaterial({
                    color: 0x88CCFF,
                    metalness: 0.9,
                    roughness: 0.2,
                    transparent: true,
                    opacity: 0.8,
                    emissive: 0x4444FF,
                    emissiveIntensity: 0.5
                });
                mesh = new THREE.Mesh(crystalGeometry, crystalMaterial);
                break;
        }
        
        if (mesh) {
            // Apply scale
            const scale = data.scale || 1.0;
            mesh.scale.set(scale, scale, scale);
            
            // Position
            mesh.position.set(data.position.x, data.position.y, data.position.z);
            
            // Random rotation for variety
            mesh.rotation.y = Math.random() * Math.PI * 2;
            
            // Cast shadows
            mesh.castShadow = true;
            mesh.receiveShadow = false;
            
            // Add to scene
            this.scene.add(mesh);
            
            // Store for animations if needed
            this.decorations.push({
                mesh: mesh,
                type: data.type,
                data: data
            });
        }
    }
    
    createEnvironment() {
        // Create sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Add directional light for sun
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        
        // Configure shadow properties
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        
        // Set up shadow camera
        const shadowSize = 50;
        sunLight.shadow.camera.left = -shadowSize;
        sunLight.shadow.camera.right = shadowSize;
        sunLight.shadow.camera.top = shadowSize;
        sunLight.shadow.camera.bottom = -shadowSize;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 500;
        
        this.scene.add(sunLight);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
    }
    
    updateObstacles(deltaTime) {
        // Update all obstacles
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'revolvingBar') {
                // Apply torque to keep the bar rotating
                const rotationForce = new CANNON.Vec3();
                obstacle.rotationAxis.scale(obstacle.rotationSpeed, rotationForce);
                obstacle.body.angularVelocity.copy(rotationForce);
            }
            else if (obstacle.type === 'movingPlatform') {
                // Update platform position based on progress
                obstacle.progress += deltaTime * obstacle.speed * obstacle.direction;
                
                // Check if we need to change direction
                if (obstacle.progress >= obstacle.distance) {
                    obstacle.direction = -1;
                    obstacle.progress = obstacle.distance;
                } else if (obstacle.progress <= 0) {
                    obstacle.direction = 1;
                    obstacle.progress = 0;
                }
                
                // Calculate new position
                let newPos = { ...obstacle.startPos };
                newPos[obstacle.axis] += obstacle.progress * obstacle.direction;
                
                // Update physics body position
                const body = obstacle.body;
                body.position.set(newPos.x, newPos.y, newPos.z);
                
                // Reset velocity to prevent physics engine from affecting movement
                body.velocity.set(0, 0, 0);
                body.angularVelocity.set(0, 0, 0);
            }
        }
    }
    
    updateDecorations(deltaTime) {
        const time = performance.now() * 0.001; // Current time in seconds
        
        // Update decoration animations
        for (const decoration of this.decorations) {
            if (decoration.type === 'finishParticle') {
                const data = decoration.data;
                
                // Move around in a circle and bob up and down
                decoration.mesh.position.y = data.baseY + Math.sin(time * data.speed) * data.amplitude;
                
                // Rotate around center
                const angle = data.angle + time * 0.5;
                const radius = this.finishArea.radius + 0.2 + Math.sin(time * 0.3) * 0.1;
                
                decoration.mesh.position.x = this.finishArea.position.x + Math.cos(angle) * radius;
                decoration.mesh.position.z = this.finishArea.position.z + Math.sin(angle) * radius;
                
                // Pulse effect
                const scale = 1 + Math.sin(time * 2) * 0.1;
                decoration.mesh.scale.set(scale, scale, scale);
            }
            else if (decoration.type === 'crystal') {
                // Rotate and pulse crystal
                decoration.mesh.rotation.y += deltaTime * 0.5;
                decoration.mesh.rotation.z += deltaTime * 0.3;
                
                // Pulse emissive intensity
                if (decoration.mesh.material) {
                    decoration.mesh.material.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.3;
                }
            }
        }
    }
    
    checkFinish(playerPosition) {
        if (this.isLevelComplete) return true;
        
        // Check if player has reached the finish area
        const finishPos = this.finishArea.position;
        const distance = Math.sqrt(
            Math.pow(playerPosition.x - finishPos.x, 2) +
            Math.pow(playerPosition.z - finishPos.z, 2)
        );
        
        if (distance < this.finishArea.radius) {
            // Level complete!
            this.isLevelComplete = true;
            this.completionTime = (Date.now() - this.startTime) / 1000; // in seconds
            return true;
        }
        
        return false;
    }
    
    getCompletionTime() {
        return this.completionTime;
    }
    
    getCurrentLevelIndex() {
        return this.currentLevelIndex;
    }
    
    getNextLevelIndex() {
        const nextIndex = this.currentLevelIndex + 1;
        if (nextIndex < this.levels.length) {
            return nextIndex;
        }
        return -1; // No more levels
    }
    
    hasNextLevel() {
        return this.getNextLevelIndex() !== -1;
    }
    
    getCurrentLevelName() {
        return this.currentLevel ? this.currentLevel.name : '';
    }
    
    update(deltaTime, player) {
        // Update obstacles
        this.updateObstacles(deltaTime);
        
        // Update decorations
        this.updateDecorations(deltaTime);
        
        // Check if player has reached the finish
        this.checkFinish(player.mesh.position);
    }
    
    clearLevel() {
        // Remove platforms
        for (const platform of this.platforms) {
            this.scene.remove(platform.mesh);
            this.physics.removeBodyMeshPair(platform.body, platform.mesh);
        }
        this.platforms = [];
        
        // Remove obstacles
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle.mesh);
            this.physics.removeBodyMeshPair(obstacle.body, obstacle.mesh);
        }
        this.obstacles = [];
        
        // Remove decorations
        for (const decoration of this.decorations) {
            this.scene.remove(decoration.mesh);
        }
        this.decorations = [];
        
        // Remove finish area
        if (this.finishArea && this.finishArea.mesh) {
            this.scene.remove(this.finishArea.mesh);
        }
        
        // Remove collectibles
        this.collectibles.cleanup();
        
        // Remove lights and environment (except main lights)
        // We'd need to keep track of environment objects separately
    }
    
    cleanup() {
        // Clear the current level
        this.clearLevel();
        
        // Additional cleanup if needed
    }
}