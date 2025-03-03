// Audio manager for the 3D Ball Adventure game
class AudioManager {
    constructor() {
        // Main audio context
        this.audioContext = null;
        
        // Sound effects
        this.sounds = {};
        
        // Background music
        this.bgMusic = null;
        this.bgMusicNode = null;
        this.isMusicPlaying = false;
        
        // Settings
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        
        // Master volume node
        this.masterGain = null;
        
        // Audio buffer loading status
        this.isLoaded = false;
        this.loadPromise = null;
        
        // List of sound effects to load
        this.sfxToLoad = [
            { name: "coin", url: "sounds/coin.mp3" },
            { name: "jump", url: "sounds/jump.mp3" },
            { name: "powerup", url: "sounds/powerup.mp3" },
            { name: "checkpoint", url: "sounds/checkpoint.mp3" },
            { name: "fall", url: "sounds/fall.mp3" },
            { name: "levelComplete", url: "sounds/level_complete.mp3" },
            { name: "gameOver", url: "sounds/game_over.mp3" },
            { name: "click", url: "sounds/click.mp3" },
            { name: "bounce", url: "sounds/bounce.mp3" }
        ];
        
        // Music tracks
        this.musicToLoad = [
            { name: "menu", url: "sounds/menu_music.mp3" },
            { name: "gameplay", url: "sounds/gameplay_music.mp3" }
        ];
        
        // Initialize
        this.init();
    }
    
    init() {
        // Create audio context
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Setup sounds object
            this.sounds = {};
            
            // Load sound dummy buffers until real sounds can be loaded
            this.loadDummySounds();
            
            console.log("Audio system initialized");
        } catch (e) {
            console.warn("Web Audio API not supported in this browser");
            // Provide fallback methods that do nothing
            this.playSound = () => {};
            this.playMusic = () => {};
            this.stopMusic = () => {};
            this.setMasterVolume = () => {};
        }
    }
    
    // Create dummy sounds until real ones can be loaded
    loadDummySounds() {
        // Create a short silent buffer
        const buffer = this.audioContext.createBuffer(2, 22050, 44100);
        
        // Create dummy entries for all sounds
        this.sfxToLoad.forEach(sound => {
            this.sounds[sound.name] = {
                buffer: buffer,
                isLoaded: false
            };
        });
        
        // Create dummy entries for music
        this.musicToLoad.forEach(track => {
            this.sounds[track.name] = {
                buffer: buffer,
                isLoaded: false,
                isMusic: true
            };
        });
    }
    
    // Starts loading all sound assets
    loadSounds() {
        // Only load once
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        // Create a promise for the loading process
        this.loadPromise = new Promise((resolve, reject) => {
            // Load all sound effects
            const soundPromises = this.sfxToLoad.map(sound => 
                this.loadSound(sound.name, sound.url)
            );
            
            // Load all music tracks
            const musicPromises = this.musicToLoad.map(track => 
                this.loadSound(track.name, track.url, true)
            );
            
            // Wait for all to complete
            Promise.all([...soundPromises, ...musicPromises])
                .then(() => {
                    this.isLoaded = true;
                    console.log("All audio assets loaded successfully");
                    resolve();
                })
                .catch(error => {
                    console.error("Error loading audio assets:", error);
                    reject(error);
                });
        });
        
        return this.loadPromise;
    }
    
    // Load a single sound
    loadSound(name, url, isMusic = false) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.sounds[name] = {
                        buffer: audioBuffer,
                        isLoaded: true,
                        isMusic: isMusic
                    };
                    console.log(`Loaded sound: ${name}`);
                    resolve();
                })
                .catch(error => {
                    console.warn(`Failed to load sound ${name} from ${url}:`, error);
                    // Create a silent buffer instead
                    const silentBuffer = this.audioContext.createBuffer(2, 22050, 44100);
                    this.sounds[name] = {
                        buffer: silentBuffer,
                        isLoaded: false,
                        isMusic: isMusic
                    };
                    // Still resolve to not break the whole sound loading
                    resolve();
                });
        });
    }
    
    // Play a sound effect by name
    playSound(name, options = {}) {
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Check if sound exists
        if (!this.sounds[name]) {
            console.warn(`Sound not found: ${name}`);
            return null;
        }
        
        // Skip if muted
        if (this.isMuted) {
            return null;
        }
        
        // Set default options
        const defaults = {
            volume: 1.0,
            loop: false,
            playbackRate: 1.0
        };
        
        const settings = { ...defaults, ...options };
        
        // Create sound source
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name].buffer;
        source.loop = settings.loop;
        source.playbackRate.value = settings.playbackRate;
        
        // Create gain node for this sound
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = settings.volume * this.sfxVolume;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Start playback
        source.start(0);
        
        // Return control object
        return {
            source: source,
            gainNode: gainNode,
            stop: () => source.stop(0),
            setVolume: (volume) => {
                gainNode.gain.value = volume * this.sfxVolume;
            },
            setPlaybackRate: (rate) => {
                source.playbackRate.value = rate;
            }
        };
    }
    
    // Play background music
    playMusic(name, fadeIn = 1.0) {
        // Check if music exists
        if (!this.sounds[name] || !this.sounds[name].isMusic) {
            console.warn(`Music track not found: ${name}`);
            return;
        }
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Stop current music if playing
        if (this.bgMusicNode) {
            this.stopMusic(fadeIn > 0 ? fadeIn / 2 : 0);
        }
        
        // Create source and gain for music
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name].buffer;
        source.loop = true;
        
        const gainNode = this.audioContext.createGain();
        
        // Start with 0 volume if fading in
        if (fadeIn > 0) {
            gainNode.gain.value = 0;
        } else {
            gainNode.gain.value = this.musicVolume;
        }
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Start playback
        source.start(0);
        
        // Store references
        this.bgMusic = source;
        this.bgMusicNode = gainNode;
        this.currentMusicName = name;
        this.isMusicPlaying = true;
        
        // Fade in if needed
        if (fadeIn > 0) {
            const now = this.audioContext.currentTime;
            gainNode.gain.linearRampToValueAtTime(this.musicVolume, now + fadeIn);
        }
    }
    
    // Stop background music
    stopMusic(fadeOut = 0.5) {
        if (!this.bgMusic || !this.bgMusicNode) return;
        
        if (fadeOut > 0) {
            // Fade out then stop
            const now = this.audioContext.currentTime;
            this.bgMusicNode.gain.linearRampToValueAtTime(0, now + fadeOut);
            
            // Schedule stop after fade out
            setTimeout(() => {
                if (this.bgMusic) {
                    this.bgMusic.stop(0);
                    this.bgMusic = null;
                    this.bgMusicNode = null;
                    this.isMusicPlaying = false;
                }
            }, fadeOut * 1000);
        } else {
            // Stop immediately
            this.bgMusic.stop(0);
            this.bgMusic = null;
            this.bgMusicNode = null;
            this.isMusicPlaying = false;
        }
    }
    
    // Set master volume (affects all sounds)
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    // Set music volume
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.bgMusicNode) {
            this.bgMusicNode.gain.value = this.musicVolume;
        }
    }
    
    // Set sound effects volume
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Mute/unmute all audio
    setMuted(muted) {
        this.isMuted = muted;
        
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : this.masterVolume;
        }
    }
    
    // Pause all sounds (e.g., when game is paused)
    pauseAll() {
        if (this.audioContext) {
            this.audioContext.suspend();
        }
    }
    
    // Resume all sounds
    resumeAll() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Create a 3D sound that changes volume based on player's position
    playPositionalSound(name, position, maxDistance, options = {}) {
        // Only proceed if we have a valid audio context and sound
        if (!this.audioContext || !this.sounds[name]) {
            return null;
        }
        
        const sound = this.playSound(name, options);
        if (!sound) return null;
        
        // Add position information to the sound
        sound.position = position;
        sound.maxDistance = maxDistance || 20;
        
        // Add a method to update position
        sound.updatePosition = (listenerPosition) => {
            // Calculate distance
            const dx = position.x - listenerPosition.x;
            const dy = position.y - listenerPosition.y;
            const dz = position.z - listenerPosition.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Calculate volume based on distance
            let volume = 1.0;
            if (distance > 0) {
                volume = Math.max(0, 1 - distance / sound.maxDistance);
            }
            
            // Apply volume
            sound.setVolume(volume * (options.volume || 1.0));
        };
        
        return sound;
    }
    
    // Convenience methods for common sound effects
    playCoinSound() {
        this.playSound('coin', { volume: 0.6 });
    }
    
    playJumpSound() {
        this.playSound('jump', { volume: 0.5 });
    }
    
    playPowerupSound() {
        this.playSound('powerup', { volume: 0.7 });
    }
    
    playCheckpointSound() {
        this.playSound('checkpoint', { volume: 0.7 });
    }
    
    playFallSound() {
        this.playSound('fall', { volume: 0.6 });
    }
    
    playLevelCompleteSound() {
        this.playSound('levelComplete', { volume: 0.8 });
    }
    
    playGameOverSound() {
        this.playSound('gameOver', { volume: 0.7 });
    }
    
    playClickSound() {
        this.playSound('click', { volume: 0.4 });
    }
    
    playBounceSound(intensity = 1.0) {
        this.playSound('bounce', { 
            volume: 0.3 * intensity, 
            playbackRate: 0.8 + (intensity * 0.4)
        });
    }
    
    // Switch the music for different game states
    playMenuMusic() {
        this.playMusic('menu', 2.0);
    }
    
    playGameplayMusic() {
        this.playMusic('gameplay', 2.0);
    }
    
    cleanup() {
        // Stop all sounds and music
        this.stopMusic(0);
        
        // Close audio context if supported
        if (this.audioContext && this.audioContext.close) {
            this.audioContext.close();
        }
    }
}