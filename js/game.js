// Main game class for the 3D Ball Adventure game
class Game {
    constructor() {
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.score = 0;
        
        // Performance monitoring
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        
        // Game systems
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physics = null;
        this.player = null;
        this.levelManager = null;
        this.collectiblesManager = null;
        this.obstaclesManager = null;
        this.audioManager = null;
        this.uiManager = null;
        
        // Input state
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Initialize the game
        this.initialize();
    }
    
    async initialize() {
        // Create the renderer
        this.setupRenderer();
        
        // Create the scene and camera
        this.setupScene();
        
        // Initialize audio system
        this.setupAudio();
        
        // Initialize UI
        this.setupUI();
        
        // Initialize physics
        this.setupPhysics();
        
        // Create game systems
        this.createGameSystems();
        
        // Set up input handlers
        this.setupInputHandlers();
        
        // Show the UI
        this.uiManager.showMainMenu();
        
        // Start loading assets
        this.loadAssets();
        
        // Start the main loop
        this.animate();
    }
    
    setupRenderer() {
        // Create the WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true,
            alpha: false
        });
        
        // Configure renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupScene() {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Create the camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        
        // Position the camera
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 30, 10);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        
        const shadowSize = 20;
        directionalLight.shadow.camera.left = -shadowSize;
        directionalLight.shadow.camera.right = shadowSize;
        directionalLight.shadow.camera.top = shadowSize;
        directionalLight.shadow.camera.bottom = -shadowSize;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 60;
        
        this.scene.add(directionalLight);
    }
    
    setupAudio() {
        // Create audio manager
        this.audioManager = new AudioManager();
    }
    
    setupUI() {
        // Create UI manager and set callbacks
        this.uiManager = new UIManager(this.audioManager);
        
        // Set callback functions
        this.uiManager.setCallbacks({
            onStart: () => this.startGame(),
            onResume: () => this.resumeGame(),
            onPause: () => this.pauseGame(),
            onRestart: () => this.restartLevel(),
            onQuit: () => this.quitToMenu(),
            onNextLevel: () => this.nextLevel()
        });
    }
    
    setupPhysics() {
        // Create physics system
        this.physics = new PhysicsSystem(this.scene);
    }
    
    createGameSystems() {
        // Create collectibles manager
        this.collectiblesManager = new CollectiblesManager(this.scene, this.physics);
        
        // Set collectible callbacks
        this.collectiblesManager.setCallbacks({
            onCollectible: (collectible) => this.onCollectibleCollected(collectible),
            onCoinCollected: (value) => this.onCoinCollected(value),
            onCheckpointActivated: (checkpoint) => this.onCheckpointActivated(checkpoint)
        });
        
        // Create obstacles manager
        this.obstaclesManager = new ObstaclesManager(this.scene, this.physics);
        
        // Create level manager
        this.levelManager = new LevelManager(this.scene, this.physics, this.collectiblesManager);
    }
    
    setupInputHandlers() {
        // Keyboard event handlers
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // Touch controls could be added here for mobile devices
    }
    
    handleKeyDown(event) {
        // Only process input if the game is running and not paused
        if (!this.isRunning || this.isPaused) return;
        
        switch (event.key) {
            // Movement
            case 'w':
            case 'W':
            case 'ArrowUp':
                this.inputState.forward = true;
                break;
            case 's':
            case 'S':
            case 'ArrowDown':
                this.inputState.backward = true;
                break;
            case 'a':
            case 'A':
            case 'ArrowLeft':
                this.inputState.left = true;
                break;
            case 'd':
            case 'D':
            case 'ArrowRight':
                this.inputState.right = true;
                break;
            
            // Actions
            case ' ':
                this.inputState.jump = true;
                break;
            case 'p':
            case 'P':
                // Pause is handled by UI
                break;
            case 'r':
            case 'R':
                // Reset level
                this.restartLevel();
                break;
        }
    }
    
    handleKeyUp(event) {
        switch (event.key) {
            case 'w':
            case 'W':
            case 'ArrowUp':
                this.inputState.forward = false;
                break;
            case 's':
            case 'S':
            case 'ArrowDown':
                this.inputState.backward = false;
                break;
            case 'a':
            case 'A':
            case 'ArrowLeft':
                this.inputState.left = false;
                break;
            case 'd':
            case 'D':
            case 'ArrowRight':
                this.inputState.right = false;
                break;
            case ' ':
                this.inputState.jump = false;
                break;
        }
    }
    
    async loadAssets() {
        // Start loading audio assets
        if (this.audioManager) {
            await this.audioManager.loadSounds();
        }
        
        // Additional asset loading could be done here
    }
    
    startGame() {
        // Reset game state
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.score = 0;
        
        // Load first level
        const playerStartPosition = this.levelManager.loadLevel(0);
        
        // Create player if needed or reset position
        if (!this.player) {
            this.player = new Player(this.scene, this.physics, playerStartPosition);
            this.player.setOnDeathCallback(() => this.onPlayerDeath());
        } else {
            // Reset player to starting position
            this.player.respawn();
            this.player.setSpawnPoint(playerStartPosition);
        }
        
        // Update UI
        this.uiManager.updateScore(0);
        this.uiManager.updateCoins(0, this.collectiblesManager.getCoinCount());
        this.uiManager.updateLevel(1);
        
        // Set up camera to follow player
        this.setupCameraFollow();
        
        // Play game music
        if (this.audioManager) {
            this.audioManager.playGameplayMusic();
        }
    }
    
    setupCameraFollow() {
        // Configure camera to follow the player from behind and slightly above
        this.cameraOffset = new THREE.Vector3(0, 7, 10);
        this.cameraLookOffset = new THREE.Vector3(0, 0, -3);
        this.cameraFollowSpeed = 0.1;
    }
    
    updateCamera() {
        if (!this.player) return;
        
        // Calculate target camera position
        const targetPosition = new THREE.Vector3().copy(this.player.mesh.position).add(this.cameraOffset);
        
        // Smoothly move camera towards target position
        this.camera.position.lerp(targetPosition, this.cameraFollowSpeed);
        
        // Calculate camera look target
        const lookTarget = new THREE.Vector3().copy(this.player.mesh.position).add(this.cameraLookOffset);
        this.camera.lookAt(lookTarget);
    }
    
    pauseGame() {
        if (!this.isRunning) return;
        
        this.isPaused = true;
    }
    
    resumeGame() {
        if (!this.isRunning) return;
        
        this.isPaused = false;
        this.lastFrameTime = performance.now();
    }
    
    restartLevel() {
        // Reset level state
        this.isGameOver = false;
        this.isLevelComplete = false;
        
        // Reload current level
        const currentLevelIndex = this.levelManager.getCurrentLevelIndex();
        const playerStartPosition = this.levelManager.loadLevel(currentLevelIndex);
        
        // Reset player
        if (this.player) {
            this.player.setSpawnPoint(playerStartPosition);
            this.player.respawn();
        }
        
        // Reset score for this level
        this.score = 0;
        this.uiManager.updateScore(this.score);
        this.uiManager.updateCoins(0, this.collectiblesManager.getCoinCount());
        
        // Resume game
        this.isRunning = true;
        this.isPaused = false;
    }
    
    nextLevel() {
        // Check if there is a next level
        const nextLevelIndex = this.levelManager.getNextLevelIndex();
        if (nextLevelIndex === -1) {
            // No more levels, return to menu
            this.quitToMenu();
            return;
        }
        
        // Load next level
        const playerStartPosition = this.levelManager.loadLevel(nextLevelIndex);
        
        // Reset player for new level
        if (this.player) {
            this.player.setSpawnPoint(playerStartPosition);
            this.player.respawn();
        }
        
        // Reset level state
        this.isGameOver = false;
        this.isLevelComplete = false;
        
        // Keep overall score but reset coins for this level
        this.uiManager.updateCoins(0, this.collectiblesManager.getCoinCount());
        this.uiManager.updateLevel(nextLevelIndex + 1);
        
        // Resume game
        this.isRunning = true;
        this.isPaused = false;
    }
    
    quitToMenu() {
        // Stop the game and clean up
        this.isRunning = false;
        this.isPaused = false;
        
        // Stop active physics and animations
        if (this.physics) {
            // Cleanup doesn't remove all bodies - we'll do that when loading a new level
        }
    }
    
    onPlayerDeath() {
        // Handle player death
        if (this.isGameOver) return; // Already handled
        
        this.isGameOver = true;
        
        // Update UI
        setTimeout(() => {
            this.uiManager.showGameOverScreen();
        }, 1000); // Small delay for death animation
        
        // Play death sound
        if (this.audioManager) {
            this.audioManager.playFallSound();
        }
    }
    
    onLevelComplete() {
        if (this.isLevelComplete) return; // Already handled
        
        this.isLevelComplete = true;
        
        // Calculate final score
        const time = this.levelManager.getCompletionTime();
        const coins = this.collectiblesManager.getCollectedCoins();
        const totalCoins = this.collectiblesManager.getCoinCount();
        
        // Time bonus: faster is better
        const timeBonus = Math.max(0, 1000 - Math.floor(time) * 10);
        
        // Coin bonus: 100 points per coin
        const coinBonus = coins * 100;
        
        // Total level score
        const levelScore = this.score + timeBonus + coinBonus;
        
        // Update UI with level completion data
        setTimeout(() => {
            this.uiManager.showLevelCompleteScreen({
                time: time,
                coins: coins,
                totalCoins: totalCoins,
                score: levelScore,
                hasNextLevel: this.levelManager.hasNextLevel()
            });
        }, 500); // Small delay for completion animation
        
        // Play completion sound
        if (this.audioManager) {
            this.audioManager.playLevelCompleteSound();
        }
    }
    
    onCollectibleCollected(collectible) {
        // Handle generic collectible collection
        if (collectible.type === 'coin') {
            // Coin handling is done in onCoinCollected
        } else if (collectible.type === 'jumpPower') {
            // Play powerup sound
            if (this.audioManager) {
                this.audioManager.playPowerupSound();
            }
        } else if (collectible.type === 'speedBoost') {
            // Play powerup sound
            if (this.audioManager) {
                this.audioManager.playPowerupSound();
            }
        }
    }
    
    onCoinCollected(value) {
        // Increment score
        this.score += value;
        
        // Update UI
        this.uiManager.updateScore(this.score);
        this.uiManager.updateCoins(
            this.collectiblesManager.getCollectedCoins(),
            this.collectiblesManager.getCoinCount()
        );
        
        // Play coin sound
        if (this.audioManager) {
            this.audioManager.playCoinSound();
        }
    }
    
    onCheckpointActivated(checkpoint) {
        // Update UI (if needed)
        
        // Play checkpoint sound
        if (this.audioManager) {
            this.audioManager.playCheckpointSound();
        }
    }
    
    update() {
        // Calculate delta time
        const now = performance.now();
        this.deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        
        // Limit delta time to avoid "jumps" after pause or slow frames
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // Update FPS counter
        this.frameCount++;
        if (now - this.lastFpsUpdateTime > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdateTime));
            this.frameCount = 0;
            this.lastFpsUpdateTime = now;
        }
        
        // Skip updates if paused or not running
        if (!this.isRunning || this.isPaused) return;
        
        // Update physics
        this.physics.update(this.deltaTime);
        
        // Update player
        if (this.player) {
            this.player.update(this.deltaTime, this.inputState);
        }
        
        // Check for level completion
        if (this.player && this.levelManager && !this.isLevelComplete) {
            if (this.levelManager.checkFinish(this.player.mesh.position)) {
                this.onLevelComplete();
            }
        }
        
        // Update level elements
        if (this.levelManager) {
            this.levelManager.update(this.deltaTime, this.player);
        }
        
        // Update collectibles
        if (this.collectiblesManager && this.player) {
            this.collectiblesManager.update(this.deltaTime, this.player);
        }
        
        // Update obstacles
        if (this.obstaclesManager) {
            this.obstaclesManager.update(this.deltaTime);
            
            // Apply obstacle forces to player
            if (this.player) {
                this.obstaclesManager.applyObstacleForces(this.player, this.deltaTime);
            }
        }
        
        // Update camera position to follow player
        this.updateCamera();
    }
    
    render() {
        // Render the 3D scene
        this.renderer.render(this.scene, this.camera);
    }
    
    animate() {
        // Main game loop
        requestAnimationFrame(() => this.animate());
        
        // Update game state
        this.update();
        
        // Render graphics
        this.render();
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    cleanup() {
        // Stop all systems
        if (this.audioManager) {
            this.audioManager.cleanup();
        }
        
        if (this.physics) {
            this.physics.cleanup();
        }
        
        if (this.player) {
            this.player.cleanup();
        }
        
        if (this.levelManager) {
            this.levelManager.cleanup();
        }
        
        if (this.collectiblesManager) {
            this.collectiblesManager.cleanup();
        }
        
        if (this.obstaclesManager) {
            this.obstaclesManager.cleanup();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});