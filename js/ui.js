// UI Manager for the 3D Ball Adventure game
class UIManager {
    constructor(audio) {
        // Store audio manager for UI sounds
        this.audio = audio;
        
        // Get DOM elements
        this.initializeElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Game state
        this.currentScreen = 'menu';
        this.isGamePaused = false;
        
        // HUD elements
        this.score = 0;
        this.coins = 0;
        this.totalCoins = 0;
        this.level = 1;
        this.time = 0;
        
        // Timer
        this.timer = null;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        // Callbacks
        this.onStart = null;
        this.onResume = null;
        this.onPause = null;
        this.onRestart = null;
        this.onQuit = null;
        this.onNextLevel = null;
    }
    
    initializeElements() {
        // Get all UI containers
        this.menuContainer = document.getElementById('menu-container');
        this.instructionsContainer = document.getElementById('instructions-container');
        this.pauseContainer = document.getElementById('pause-container');
        this.levelCompleteContainer = document.getElementById('level-complete-container');
        this.gameOverContainer = document.getElementById('game-over-container');
        this.loadingContainer = document.getElementById('loading-container');
        
        // Score elements
        this.scoreDisplay = document.getElementById('score');
        this.coinsDisplay = document.getElementById('coins');
        this.totalCoinsDisplay = document.getElementById('total-coins');
        this.levelDisplay = document.getElementById('level');
        this.timerDisplay = document.getElementById('timer');
        
        // Level complete elements
        this.completionTimeDisplay = document.getElementById('completion-time');
        this.collectedCoinsDisplay = document.getElementById('collected-coins');
        this.levelTotalCoinsDisplay = document.getElementById('level-total-coins');
        this.levelScoreDisplay = document.getElementById('level-score');
        
        // Game over elements
        this.finalScoreDisplay = document.getElementById('final-score');
        
        // Loading elements
        this.loadingBar = document.getElementById('loading-bar');
        this.loadingText = document.getElementById('loading-text');
        
        // Buttons
        this.startButton = document.getElementById('start-button');
        this.instructionsButton = document.getElementById('instructions-button');
        this.backButton = document.getElementById('back-button');
        this.resumeButton = document.getElementById('resume-button');
        this.restartButton = document.getElementById('restart-button');
        this.quitButton = document.getElementById('quit-button');
        this.nextLevelButton = document.getElementById('next-level-button');
        this.levelMenuButton = document.getElementById('level-menu-button');
        this.retryButton = document.getElementById('retry-button');
        this.gameOverMenuButton = document.getElementById('game-over-menu-button');
    }
    
    setupEventListeners() {
        // Add click listeners to all buttons
        if (this.startButton) {
            this.startButton.addEventListener('click', () => {
                this.playButtonSound();
                this.showLoadingScreen();
                setTimeout(() => {
                    this.startGame();
                }, 500);
            });
        }
        
        if (this.instructionsButton) {
            this.instructionsButton.addEventListener('click', () => {
                this.playButtonSound();
                this.showInstructions();
            });
        }
        
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.playButtonSound();
                this.showMainMenu();
            });
        }
        
        if (this.resumeButton) {
            this.resumeButton.addEventListener('click', () => {
                this.playButtonSound();
                this.resumeGame();
            });
        }
        
        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => {
                this.playButtonSound();
                this.restartLevel();
            });
        }
        
        if (this.quitButton) {
            this.quitButton.addEventListener('click', () => {
                this.playButtonSound();
                this.quitToMenu();
            });
        }
        
        if (this.nextLevelButton) {
            this.nextLevelButton.addEventListener('click', () => {
                this.playButtonSound();
                this.goToNextLevel();
            });
        }
        
        if (this.levelMenuButton) {
            this.levelMenuButton.addEventListener('click', () => {
                this.playButtonSound();
                this.quitToMenu();
            });
        }
        
        if (this.retryButton) {
            this.retryButton.addEventListener('click', () => {
                this.playButtonSound();
                this.restartLevel();
            });
        }
        
        if (this.gameOverMenuButton) {
            this.gameOverMenuButton.addEventListener('click', () => {
                this.playButtonSound();
                this.quitToMenu();
            });
        }
        
        // Add keyboard listeners
        document.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                if (this.currentScreen === 'game') {
                    this.togglePause();
                }
            } else if (event.key === 'Escape') {
                if (this.currentScreen === 'pause') {
                    this.resumeGame();
                }
            }
        });
    }
    
    // UI navigation methods
    showMainMenu() {
        this.hideAllScreens();
        this.menuContainer.classList.remove('hidden');
        this.currentScreen = 'menu';
        
        // Play menu music if audio is available
        if (this.audio) {
            this.audio.playMenuMusic();
        }
    }
    
    showInstructions() {
        this.hideAllScreens();
        this.instructionsContainer.classList.remove('hidden');
        this.currentScreen = 'instructions';
    }
    
    showGameUI() {
        this.hideAllScreens();
        this.currentScreen = 'game';
        
        // Start the timer
        this.startTimer();
        
        // Play gameplay music if audio is available
        if (this.audio) {
            this.audio.playGameplayMusic();
        }
    }
    
    showPauseScreen() {
        this.pauseContainer.classList.remove('hidden');
        this.currentScreen = 'pause';
        
        // Pause the timer
        this.pauseTimer();
        
        // Pause audio if available
        if (this.audio) {
            this.audio.pauseAll();
        }
    }
    
    showLevelCompleteScreen(data) {
        this.hideAllScreens();
        
        // Update level complete stats
        if (data) {
            this.completionTimeDisplay.textContent = this.formatTime(data.time);
            this.collectedCoinsDisplay.textContent = data.coins;
            this.levelTotalCoinsDisplay.textContent = data.totalCoins;
            this.levelScoreDisplay.textContent = data.score;
            
            // Show/hide next level button based on whether there is a next level
            if (data.hasNextLevel) {
                this.nextLevelButton.classList.remove('hidden');
            } else {
                this.nextLevelButton.classList.add('hidden');
            }
        }
        
        this.levelCompleteContainer.classList.remove('hidden');
        this.currentScreen = 'levelComplete';
        
        // Stop the timer
        this.stopTimer();
        
        // Play level complete sound if audio is available
        if (this.audio) {
            this.audio.playLevelCompleteSound();
        }
    }
    
    showGameOverScreen() {
        this.hideAllScreens();
        
        // Update final score
        this.finalScoreDisplay.textContent = this.score;
        
        this.gameOverContainer.classList.remove('hidden');
        this.currentScreen = 'gameOver';
        
        // Stop the timer
        this.stopTimer();
        
        // Play game over sound if audio is available
        if (this.audio) {
            this.audio.playGameOverSound();
        }
    }
    
    showLoadingScreen(progress = 0) {
        this.hideAllScreens();
        
        // Update loading bar
        this.loadingBar.style.width = `${progress * 100}%`;
        
        this.loadingContainer.classList.remove('hidden');
        this.currentScreen = 'loading';
    }
    
    updateLoadingProgress(progress, message = null) {
        // Update loading bar
        this.loadingBar.style.width = `${progress * 100}%`;
        
        // Update message if provided
        if (message) {
            this.loadingText.textContent = message;
        }
    }
    
    hideAllScreens() {
        // Hide all screen containers
        this.menuContainer.classList.add('hidden');
        this.instructionsContainer.classList.add('hidden');
        this.pauseContainer.classList.add('hidden');
        this.levelCompleteContainer.classList.add('hidden');
        this.gameOverContainer.classList.add('hidden');
        this.loadingContainer.classList.add('hidden');
    }
    
    // Game flow methods
    startGame() {
        this.hideAllScreens();
        
        // Reset game state
        this.resetGameState();
        
        // Show game UI
        this.showGameUI();
        
        // Call the start callback if set
        if (this.onStart) {
            this.onStart();
        }
    }
    
    togglePause() {
        if (this.currentScreen === 'game') {
            this.pauseGame();
        } else if (this.currentScreen === 'pause') {
            this.resumeGame();
        }
    }
    
    pauseGame() {
        this.showPauseScreen();
        this.isGamePaused = true;
        
        // Call the pause callback if set
        if (this.onPause) {
            this.onPause();
        }
    }
    
    resumeGame() {
        this.hideAllScreens();
        this.currentScreen = 'game';
        this.isGamePaused = false;
        
        // Resume timer
        this.resumeTimer();
        
        // Resume audio if available
        if (this.audio) {
            this.audio.resumeAll();
        }
        
        // Call the resume callback if set
        if (this.onResume) {
            this.onResume();
        }
    }
    
    restartLevel() {
        this.hideAllScreens();
        
        // Reset game state for current level
        this.resetGameState(false); // Don't reset level number
        
        // Show game UI
        this.showGameUI();
        
        // Call the restart callback if set
        if (this.onRestart) {
            this.onRestart();
        }
    }
    
    quitToMenu() {
        this.hideAllScreens();
        this.showMainMenu();
        
        // Call the quit callback if set
        if (this.onQuit) {
            this.onQuit();
        }
    }
    
    goToNextLevel() {
        this.hideAllScreens();
        
        // Prepare for next level
        this.level++;
        this.resetGameState(false); // Don't reset level number
        
        // Show game UI
        this.showGameUI();
        
        // Call the next level callback if set
        if (this.onNextLevel) {
            this.onNextLevel();
        }
    }
    
    // Game state methods
    resetGameState(resetLevel = true) {
        // Reset score and timer
        this.score = 0;
        this.coins = 0;
        
        // Reset UI displays
        this.updateScore(0);
        this.updateCoins(0, this.totalCoins);
        
        if (resetLevel) {
            this.level = 1;
        }
        
        this.updateLevel(this.level);
        
        // Reset the timer
        this.elapsedTime = 0;
        this.updateTimer(0);
    }
    
    updateScore(newScore) {
        this.score = newScore;
        this.scoreDisplay.textContent = newScore;
    }
    
    updateCoins(collected, total) {
        this.coins = collected;
        this.totalCoins = total;
        this.coinsDisplay.textContent = collected;
        this.totalCoinsDisplay.textContent = total;
    }
    
    updateLevel(level) {
        this.level = level;
        this.levelDisplay.textContent = level;
    }
    
    // Timer methods
    startTimer() {
        // Reset timer state
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        // Update the timer display
        this.updateTimer(0);
        
        // Start the timer interval
        this.stopTimer(); // Clear any existing timer
        this.timer = setInterval(() => {
            const now = Date.now();
            this.elapsedTime = (now - this.startTime) / 1000;
            this.updateTimer(this.elapsedTime);
        }, 100); // Update about 10 times per second for smooth display
    }
    
    pauseTimer() {
        // Stop the timer interval
        clearInterval(this.timer);
        this.timer = null;
    }
    
    resumeTimer() {
        // Resume the timer from where it left off
        if (!this.timer) {
            this.startTime = Date.now() - (this.elapsedTime * 1000);
            this.timer = setInterval(() => {
                const now = Date.now();
                this.elapsedTime = (now - this.startTime) / 1000;
                this.updateTimer(this.elapsedTime);
            }, 100);
        }
    }
    
    stopTimer() {
        // Stop the timer interval
        clearInterval(this.timer);
        this.timer = null;
    }
    
    updateTimer(seconds) {
        this.timerDisplay.textContent = this.formatTime(seconds);
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Helper methods
    setCallbacks(callbacks) {
        // Set up callback functions
        this.onStart = callbacks.onStart;
        this.onResume = callbacks.onResume;
        this.onPause = callbacks.onPause;
        this.onRestart = callbacks.onRestart;
        this.onQuit = callbacks.onQuit;
        this.onNextLevel = callbacks.onNextLevel;
    }
    
    playButtonSound() {
        // Play button click sound if audio is available
        if (this.audio) {
            this.audio.playClickSound();
        }
    }
}