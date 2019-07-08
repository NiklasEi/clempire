class AudioPlayer {
  constructor() {
    this.sounds = {};
    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      if (window.Worker) {
        this.worker = new Worker("src/soundWorker.js")
        this.worker.onmessage = function (e) {
          this.audioContext.decodeAudioData(e.data.response, function (buffer) {
            this.sounds[e.data.id].buffer = buffer;
          }.bind(this), this.onError);
        }.bind(this);
      } else {
        console.log('Your browser doesn\'t support web workers.')
      }
    } catch (e) {
      alert('Web Audio API is not supported in this browser\n\nThis game will not have any sounds :(');
      this.audioContext = undefined;
    }
  }

  addSound(id, url) {
    if (!this.audioContext) return;
    this.sounds[id] = new Sound(url, id);
    this.sounds[id].prepare(this.worker, this.audioContext);
  }

  playSound(id) {
    if (!this.audioContext) return;
    let sound = this.sounds[id];
    let source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  onError(error) {
    console.log("Error while loading a sound")
    console.log(error)
  }
}

class Sound {
  constructor(url, id) {
    this.sourceURL = url;
    this.id = id;
    this.buffer = undefined;
  }

  prepare(worker, audioContext) {
    if (!worker) return;
    worker.postMessage({
      id: this.id,
      url: this.sourceURL
    })
  }
}

export default AudioPlayer
