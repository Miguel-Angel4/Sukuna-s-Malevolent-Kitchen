/**
 * Music Controller for Sukuna's Malevolent Kitchen
 * Improved version with better initialization and logging
 */

const musicConfig = {
    main: 'musica/SukunaMusica.mp3',
    kokusen: 'musica/ItadoriMusica.mp3',
    todo: 'musica/TodoMusica.mp3',
    gojo: 'musica/GojoMusica.mp3',
    hakari: 'musica/HakariMusica.mp3'
};

class MusicController {
    constructor() {
        console.log("🎵 MusicController: Initializing...");
        this.currentAudio = null;
        this.mainAudio = new Audio(musicConfig.main);
        this.mainAudio.loop = true;
        this.mainAudio.volume = 0; // Start at 0 for fade in
        
        this.gameAudio = new Audio();
        this.gameAudio.loop = true;
        this.gameAudio.volume = 0;

        this.initialized = false;
        this.pendingGameTrack = null;

        // Try multiple triggers for initialization
        const initTriggers = ['click', 'keydown', 'touchstart', 'mousedown'];
        initTriggers.forEach(trigger => {
            document.addEventListener(trigger, () => this.init(), { once: true });
        });

        // Debug: log audio errors
        this.mainAudio.onerror = (e) => console.error("❌ Error loading main music:", musicConfig.main, e);
        this.gameAudio.onerror = (e) => console.error("❌ Error loading game music:", this.gameAudio.src, e);
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log("🎵 MusicController: User interaction detected, starting music.");
        
        // Start main music
        this.playMain();

        // If there was a pending game track, play it
        if (this.pendingGameTrack) {
            this.playGame(this.pendingGameTrack);
            this.pendingGameTrack = null;
        }
    }

    playMain() {
        console.log("🎵 MusicController: Playing main theme...");
        if (!this.initialized) return;

        if (this.currentAudio === this.mainAudio && !this.mainAudio.paused) return;
        
        this.fadeOut(this.gameAudio, () => {
            this.currentAudio = this.mainAudio;
            this.mainAudio.play()
                .then(() => {
                    console.log("✅ Main theme playing");
                    this.fadeIn(this.mainAudio, 0.7);
                })
                .catch(e => console.warn("⚠️ Main theme play blocked:", e));
        });
    }

    playGame(gameKey) {
        console.log(`🎵 MusicController: Switching to game music: ${gameKey}`);
        if (!this.initialized) {
            console.log("⏳ Interaction pending, saving game track for later.");
            this.pendingGameTrack = gameKey;
            return;
        }

        const track = musicConfig[gameKey];
        if (!track) {
            console.error(`❌ Track not found for game: ${gameKey}`);
            return;
        }

        this.fadeOut(this.mainAudio, () => {
            this.gameAudio.src = track;
            this.currentAudio = this.gameAudio;
            this.gameAudio.play()
                .then(() => {
                    console.log(`✅ Game theme playing: ${track}`);
                    this.fadeIn(this.gameAudio, 0.8);
                })
                .catch(e => console.warn(`⚠️ Game theme play blocked (${gameKey}):`, e));
        });
    }

    fadeOut(audio, callback) {
        if (!audio || audio.paused || audio.volume <= 0) {
            if (callback) callback();
            return;
        }

        let vol = audio.volume;
        const interval = setInterval(() => {
            vol -= 0.1;
            if (vol <= 0) {
                audio.volume = 0;
                audio.pause();
                clearInterval(interval);
                if (callback) callback();
            } else {
                audio.volume = vol;
            }
        }, 50);
    }

    fadeIn(audio, targetVol) {
        audio.volume = 0;
        let vol = 0;
        const interval = setInterval(() => {
            vol += 0.1;
            if (vol >= targetVol) {
                audio.volume = targetVol;
                clearInterval(interval);
            } else {
                audio.volume = vol;
            }
        }, 50);
    }
}

// Global instance
window.musicController = new MusicController();
