/**
 * Music Controller for Sukuna's Malevolent Kitchen
 * Version 3: Initializing Audio objects inside user interaction for maximum compatibility.
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
        console.log("🎵 MusicController: Ready to initialize on interaction.");
        this.currentAudio = null;
        this.mainAudio = null;
        this.gameAudio = null;
        this.initialized = false;
        this.pendingGameTrack = null;

        // Multiple triggers for initialization
        const initTriggers = ['click', 'keydown', 'touchstart', 'mousedown'];
        initTriggers.forEach(trigger => {
            document.addEventListener(trigger, () => this.init(), { once: true });
        });
    }

    init() {
        if (this.initialized) return;
        
        console.log("🎵 MusicController: Initializing Audio objects after user interaction...");
        
        try {
            this.mainAudio = new Audio(musicConfig.main);
            this.mainAudio.loop = true;
            this.mainAudio.volume = 0;
            
            this.gameAudio = new Audio();
            this.gameAudio.loop = true;
            this.gameAudio.volume = 0;

            this.mainAudio.onerror = (e) => console.error("❌ Error loading main music:", musicConfig.main, e);
            this.gameAudio.onerror = (e) => console.error("❌ Error loading game music:", this.gameAudio.src, e);

            this.initialized = true;
            
            // Start main music
            this.playMain();

            // If there was a pending game track, play it
            if (this.pendingGameTrack) {
                this.playGame(this.pendingGameTrack);
                this.pendingGameTrack = null;
            }
        } catch (error) {
            console.error("❌ Error during music initialization:", error);
        }
    }

    playMain() {
        if (!this.initialized) {
            console.log("⏳ Waiting for interaction to play main theme.");
            return;
        }

        if (this.currentAudio === this.mainAudio && !this.mainAudio.paused) return;
        
        console.log("🎵 MusicController: Fading into main theme...");
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
        if (!this.initialized) {
            console.log(`⏳ Interaction pending, saving game track: ${gameKey}`);
            this.pendingGameTrack = gameKey;
            return;
        }

        const track = musicConfig[gameKey];
        if (!track) return;

        console.log(`🎵 MusicController: Switching to ${gameKey}...`);
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
        if (!audio) return;
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
