class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.limit = 50;
    this.particles = [];
    this.delta = 100;
    this.intervallId = setInterval(this.tick.bind(this), this.delta);
  }

  spawn(img, x, y, text, liveTime) {
    if (this.particles.length >= this.limit) {
      this.particles.shift();
    }
    this.particles.push(new Particle(img, x, y, text, liveTime));
  }

  tick() {
    let delta = this.delta;
    this.particles = this.particles.map(particle => particle.age(delta).linger()).filter(particle => (particle.liveTime > 0 && particle.y > 0)).sort((a, b) => a.liveTime - b.liveTime);
    let ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = "20px Arial";
    this.particles.forEach(function(element) {
      ctx.save();
      if(element.liveTime < 2000) ctx.globalAlpha = element.liveTime / 2000;
      ctx.drawImage(element.img, element.x - element.img.width / 2, element.y - element.img.height / 2);
      ctx.fillText(element.text, element.x + element.img.width / 2 + 2, element.y);
      ctx.restore();
    }.bind(this));
  }
}

class Particle {
  constructor(img, x, y, text, liveTime) {
    this.liveTime = liveTime;
    this.x = x;
    this.y = y;
    this.text = text;
    this.img = img;
  }

  age(delta) {
    this.liveTime -= delta;
    return this;
  }

  linger() {
    this.x += Math.random() * 8 - 4;
    this.y -= 4;
    return this;
  }
}

export default Particles;
