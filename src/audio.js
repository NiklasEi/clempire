import CookieUtility from './cookies.js';

class AudioPlayer {
  constructor() {
    this.sounds = {};
    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      if (!this.audioContext.createGain) this.audioContext.createGain = this.audioContext.createGainNode;
      this.backgroundGain = this.audioContext.createGain();
      this.soundsGain = this.audioContext.createGain();
      this.backgroundGain.connect(this.audioContext.destination);
      this.soundsGain.connect(this.audioContext.destination);
      if (window.Worker) {
        this.worker = new Worker('soundWorker.js');
        this.worker.onmessage = function (e) {
          this.audioContext.decodeAudioData(
            e.data.response,
            function (buffer) {
              this.sounds[e.data.id].buffer = buffer;
              if (this.sounds[e.data.id].callback) this.sounds[e.data.id].callback();
            }.bind(this),
            this.onError
          );
        }.bind(this);
      } else {
        // eslint-disable-next-line no-console
        console.log("Your browser doesn't support web workers.");
      }
    } catch (e) {
      alert('Web Audio API is not supported in this browser\n\nThis game will not have any sounds :(');
      this.audioContext = undefined;
    }
    document.querySelector('header .sound').addEventListener('click', this.toggleSound.bind(this));
    document.querySelector('header .music').addEventListener('click', this.toggleMusic.bind(this));
    if (CookieUtility.getCookie('soundoff') === 'true') this.toggleSound();
    if (CookieUtility.getCookie('musicoff') === 'true') this.toggleMusic();
  }

  toggleSound() {
    const current = document.querySelector('header .sound').classList.contains('off');
    this.soundsGain.gain.value = current ? 1 : 0;
    document.querySelector('header .sound').classList.toggle('off');
    CookieUtility.saveCookie('soundoff', !current);
  }

  toggleMusic() {
    const current = document.querySelector('header .music').classList.contains('off');
    this.backgroundGain.gain.value = document.querySelector('header .music').classList.contains('off') ? 1 : 0;
    document.querySelector('header .music').classList.toggle('off');
    CookieUtility.saveCookie('musicoff', !current);
  }

  addSound(id, url, callback = undefined) {
    if (!this.audioContext) return;
    this.sounds[id] = new Sound(url, id);
    this.sounds[id].prepare(this.worker);
    this.sounds[id].callback = callback;
  }

  playSound(id, background = false) {
    if (!this.audioContext) return;
    const sound = this.sounds[id];
    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;
    if (background) {
      source.connect(this.backgroundGain);
      source.loop = true;
    } else {
      source.connect(this.soundsGain);
    }
    source.start(0);
  }

  onError(error) {
    // eslint-disable-next-line no-console
    console.log('Error while loading a sound');
    // eslint-disable-next-line no-console
    console.log(error);
  }
}

class Sound {
  constructor(url, id) {
    this.sourceURL = url;
    this.id = id;
    this.buffer = undefined;
  }

  prepare(worker) {
    if (!worker) return;
    worker.postMessage({
      id: this.id,
      url: this.sourceURL
    });
  }
}

export default AudioPlayer;
