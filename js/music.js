/**
 * Music Controller for Sukuna's Malevolent Kitchen
 * Version 7: Persistent playback + Aggressive Autoplay triggers.
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
        console.log("🎵 MusicController: Persistent & Autoplay mode.");
        this.currentAudio = null;
        this.mainAudio = null;
        this.gameAudio = null;
        this.initialized = false;
        this.pendingGameTrack = null;
        
        // Load saved state
        const savedState = localStorage.getItem('sukuna_music_state');
        this.state = savedState ? JSON.parse(savedState) : {
            trackKey: 'main',
            currentTime: 0,
            isMuted: false,
            isPlaying: true
        };

        this.isMuted = this.state.isMuted;

        // Multiple triggers for initialization
        const initTriggers = ['click', 'keydown', 'touchstart', 'mousedown', 'mousemove', 'scroll'];
        initTriggers.forEach(trigger => {
            document.addEventListener(trigger, () => this.init(), { once: true });
        });

        // Inject control button
        this.injectButton();

        // Save state periodically and on unload
        setInterval(() => this.saveState(), 1000);
        window.addEventListener('beforeunload', () => this.saveState());

        // Attempt early play
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!this.initialized) this.init();
            }, 500);
        });
    }

    injectButton() {
        if (document.getElementById('music-toggle')) return;
        const btn = document.createElement('div');
        btn.id = 'music-toggle';
        btn.className = 'music-control';
        btn.innerHTML = this.isMuted ? '🔇' : '🔊';
        btn.title = 'Activar/Desactivar música';
        document.body.appendChild(btn);

        btn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMusic();
        };
    }

    saveState() {
        if (!this.initialized || !this.currentAudio) return;
        
        this.state = {
            trackKey: this.currentAudio === this.mainAudio ? 'main' : this.getGameKeyBySrc(this.currentAudio.src),
            currentTime: this.currentAudio.currentTime,
            isMuted: this.isMuted,
            isPlaying: !this.currentAudio.paused
        };
        localStorage.setItem('sukuna_music_state', JSON.stringify(this.state));
    }

    getGameKeyBySrc(src) {
        for (let key in musicConfig) {
            if (src.includes(musicConfig[key])) return key;
        }
        return 'main';
    }

    init() {
        if (this.initialized) return;
        
        console.log("🎵 MusicController: Initializing audio context...");
        
        try {
            this.mainAudio = new Audio(musicConfig.main);
            this.mainAudio.loop = true;
            
            this.gameAudio = new Audio();
            this.gameAudio.loop = true;

            this.initialized = true;

            // Restore track and time
            if (this.state.trackKey === 'main') {
                this.currentAudio = this.mainAudio;
            } else {
                this.gameAudio.src = musicConfig[this.state.trackKey] || musicConfig.main;
                this.currentAudio = this.gameAudio;
            }

            this.currentAudio.currentTime = this.state.currentTime || 0;
            this.currentAudio.muted = this.isMuted;

            // Update button
            const btn = document.getElementById('music-toggle');
            if (btn) btn.innerHTML = this.isMuted ? '🔇' : '🔊';

            this.currentAudio.play()
                .then(() => {
                    console.log(`✅ Music resumed at ${this.currentAudio.currentTime}s`);
                    this.fadeIn(this.currentAudio, this.currentAudio === this.mainAudio ? 0.4 : 0.8);
                })
                .catch(e => {
                    console.warn("🔇 Autoplay blocked. Waiting for interaction.");
                });

            if (this.pendingGameTrack) {
                this.playGame(this.pendingGameTrack);
                this.pendingGameTrack = null;
            }
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
        this.saveState();
    }

    playMain() {
        if (!this.initialized) {
            this.state.trackKey = 'main';
            return;
        }

        if (this.currentAudio === this.mainAudio && !this.mainAudio.paused) return;
        
        this.fadeOut(this.gameAudio, () => {
            this.currentAudio = this.mainAudio;
            this.mainAudio.play().catch(() => {});
            this.fadeIn(this.mainAudio, 0.4);
        });
    }

    playGame(gameKey) {
        if (!this.initialized) {
            this.pendingGameTrack = gameKey;
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
