/**
 * Music Controller for Sukuna's Malevolent Kitchen
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
        this.currentAudio = null;
        this.mainAudio = new Audio(musicConfig.main);
        this.mainAudio.loop = true;
        this.mainAudio.volume = 0.4; // Soft background music
        
        this.gameAudio = new Audio();
        this.gameAudio.loop = true;
        this.gameAudio.volume = 0.5;

        this.initialized = false;

        // Start music on first interaction
        document.addEventListener('click', () => this.init(), { once: true });
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.playMain();
    }

    playMain() {
        if (this.currentAudio === this.mainAudio && !this.mainAudio.paused) return;
        
        this.fadeOut(this.gameAudio, () => {
            this.currentAudio = this.mainAudio;
            this.mainAudio.play().catch(e => console.warn("Autoplay blocked or error:", e));
            this.fadeIn(this.mainAudio);
        });
    }

    playGame(gameKey) {
        const track = musicConfig[gameKey];
        if (!track) return;

        this.fadeOut(this.mainAudio, () => {
            this.gameAudio.src = track;
            this.currentAudio = this.gameAudio;
            this.gameAudio.play().catch(e => console.warn("Error playing game music:", e));
            this.fadeIn(this.gameAudio);
        });
    }

    fadeOut(audio, callback) {
        if (!audio || audio.paused) {
            if (callback) callback();
            return;
        }

        let vol = audio.volume;
        const interval = setInterval(() => {
            vol -= 0.05;
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

    fadeIn(audio) {
        const targetVol = audio === this.mainAudio ? 0.4 : 0.5;
        audio.volume = 0;
        let vol = 0;
        const interval = setInterval(() => {
            vol += 0.05;
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
