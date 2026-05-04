/**
 * Music Controller for Sukuna's Malevolent Kitchen
 * Version 6: Aggressive Autoplay attempt.
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
        console.log("🎵 MusicController: Autoplay mode attempt.");
        this.currentAudio = null;
        this.mainAudio = null;
        this.gameAudio = null;
        this.initialized = false;
        
        // No persistence if user wants to start from 0
        this.state = {
            trackKey: 'main',
            currentTime: 0,
            isMuted: false,
            isPlaying: true
        };

        this.isMuted = false;

        // Multiple triggers for fallback
        const initTriggers = ['click', 'keydown', 'touchstart', 'mousedown', 'mousemove', 'scroll'];
        initTriggers.forEach(trigger => {
            document.addEventListener(trigger, () => this.init(), { once: true });
        });

        this.injectButton();
        
        // Try to play immediately on load
        window.addEventListener('load', () => {
            this.init();
            // Attempt immediate play (most browsers will block this, but we try)
            setTimeout(() => {
                if (this.currentAudio) {
                    this.currentAudio.play().catch(() => {
                        console.log("🔇 Autoplay blocked by browser. Waiting for interaction...");
                    });
                }
            }, 500);
        });
    }

    injectButton() {
        if (document.getElementById('music-toggle')) return;
        const btn = document.createElement('div');
        btn.id = 'music-toggle';
        btn.className = 'music-control';
        btn.innerHTML = '🔊';
        btn.title = 'Activar/Desactivar música';
        document.body.appendChild(btn);

        btn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMusic();
        };
    }

    init() {
        if (this.initialized) return;
        
        console.log("🎵 MusicController: Initializing...");
        
        try {
            this.mainAudio = new Audio(musicConfig.main);
            this.mainAudio.loop = true;
            this.mainAudio.volume = 0.7;
            
            this.gameAudio = new Audio();
            this.gameAudio.loop = true;
            this.gameAudio.volume = 0.8;

            this.currentAudio = this.mainAudio;
            this.initialized = true;

            this.currentAudio.play()
                .then(() => console.log("✅ Music started!"))
                .catch(e => {
                    // If blocked, we stay silent until next trigger
                });

        } catch (error) {
            console.error("❌ Error during music init:", error);
        }
    }

    toggleMusic() {
        if (!this.initialized) {
            this.init();
            return;
        }

        this.isMuted = !this.isMuted;
        const btn = document.getElementById('music-toggle');

        if (this.isMuted) {
            if (this.currentAudio) this.currentAudio.muted = true;
            btn.innerHTML = '🔇';
            btn.classList.add('muted');
        } else {
            if (this.currentAudio) {
                this.currentAudio.muted = false;
                this.currentAudio.play().catch(() => {});
            }
            btn.innerHTML = '🔊';
            btn.classList.remove('muted');
        }
    }

    playMain() {
        if (!this.initialized) return;
        if (this.currentAudio === this.mainAudio && !this.mainAudio.paused) return;
        
        this.fadeOut(this.gameAudio, () => {
            this.currentAudio = this.mainAudio;
            this.mainAudio.play().catch(() => {});
            this.fadeIn(this.mainAudio, 0.7);
        });
    }

    playGame(gameKey) {
        if (!this.initialized) {
            this.init();
            // We might need a small delay for the src to load
            setTimeout(() => this.playGame(gameKey), 100);
            return;
        }

        const track = musicConfig[gameKey];
        if (!track) return;

        this.fadeOut(this.mainAudio, () => {
            this.gameAudio.src = track;
            this.gameAudio.currentTime = 0;
            this.currentAudio = this.gameAudio;
            this.gameAudio.play().catch(() => {});
            this.fadeIn(this.gameAudio, 0.8);
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
