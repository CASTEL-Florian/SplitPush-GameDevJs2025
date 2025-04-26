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
    private transitionSound?: Phaser.Sound.BaseSound;
    private transitionSound2?: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, musicKey: string, bpm: number = 117.91) {
        this.scene = scene;
        this.musicKey = musicKey;
        this.beatInterval = 1 / (bpm / 60);
    }

    preload() {
        this.scene.load.audio(this.musicKey, `assets/Brain-Teaser-3.mp3`);
        this.scene.load.audio('transition', 'assets/tactactac.mp3');
        this.scene.load.audio('transition2', 'assets/tactactacReversed.mp3');
        this.scene.load.audio('move_sfx', 'assets/click.wav');
        this.scene.load.audio('pop_sfx', 'assets/pop.mp3');
    }

    create(onBeatCallback?: BeatCallback) {
        this.onBeatCallback = onBeatCallback;
        if (!this.mainMusic) {
            this.mainMusic = this.scene.sound.add(this.musicKey, { loop: true, volume: 0.5 });
            this.mainMusic.play();
        } else if (!this.mainMusic.isPlaying) {
            this.mainMusic.play();
        }
        if (!this.transitionSound) {
            this.transitionSound = this.scene.sound.add('transition', { loop: false, volume: 1 });
        }
        if (!this.transitionSound2) {
            this.transitionSound2 = this.scene.sound.add('transition2', { loop: false, volume: 1 });
        }
        this.lastBeat = 0;
    }

    update() {
        if (!this.mainMusic || !this.mainMusic.isPlaying) return;
        const currentTime = (this.mainMusic as Phaser.Sound.HTML5AudioSound).seek;
        if (currentTime - this.lastBeat >= this.beatInterval) {
            this.lastBeat += this.beatInterval;
            this.isLastBeatOdd = !this.isLastBeatOdd;
            if (this.onBeatCallback) this.onBeatCallback();
        }
        if (currentTime < this.lastBeat) {
            this.lastBeat = 0;
        }
    }

    public playTransition() {
        if (this.transitionSound) {
            this.transitionSound.play();
        }
    }

    public playTransition2() {
        if (this.transitionSound2) {
            this.transitionSound2.play();
        }
    }

    public playMoveSFX() {
        const moveSFX = this.scene.sound.add('move_sfx', { loop: false, volume: 1 });
        moveSFX.play();
    }

    public playPopSFX() {
        const popSFX = this.scene.sound.add('pop_sfx', { loop: false, volume: 0.6 });
        popSFX.play();
    }
}
