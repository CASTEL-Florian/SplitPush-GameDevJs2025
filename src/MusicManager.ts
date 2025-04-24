// MusicManager.ts
import Phaser from 'phaser';

export type BeatCallback = () => void;

export class MusicManager {
    private scene: Phaser.Scene;
    private musicKey: string;
    private mainMusic?: Phaser.Sound.BaseSound;
    private beatInterval: number;
    private isLastBeatOdd: boolean = false;
    private lastBeat: number = 0;
    private onBeatCallback?: BeatCallback;

    constructor(scene: Phaser.Scene, musicKey: string, bpm: number = 117.91) {
        this.scene = scene;
        this.musicKey = musicKey;
        this.beatInterval = 1 / (bpm / 60);
    }

    preload() {
        this.scene.load.audio(this.musicKey, `assets/Brain-Teaser-3.mp3`);
    }

    create(onBeatCallback?: BeatCallback) {
        this.onBeatCallback = onBeatCallback;
        if (!this.mainMusic) {
            this.mainMusic = this.scene.sound.add(this.musicKey, { loop: true, volume: 0.5 });
            this.mainMusic.play();
        } else if (!this.mainMusic.isPlaying) {
            this.mainMusic.play();
        }
        this.lastBeat = 0;
    }

    update() {
        if (!this.mainMusic || !this.mainMusic.isPlaying) return;
        const currentTime = (this.mainMusic as Phaser.Sound.HTML5AudioSound).seek;
        if (currentTime - this.lastBeat >= this.beatInterval) {
            this.lastBeat += this.beatInterval;
            this.isLastBeatOdd = !this.isLastBeatOdd;
            if (this.onBeatCallback && this.isLastBeatOdd) this.onBeatCallback();
        }
        if (currentTime < this.lastBeat) {
            this.lastBeat = 0;
        }
    }
}
