class World {
  constructor(canvas) {
    this.loading = [];
    this.canvas = canvas;
    this.treesImgCount = 4;
    this.treesCount = 400;
    this.stonesImgCount = 11;
    this.stonesCount = 200;
    this.worldSeed = "dfghj";
    //Math.seedrandom(this.worldSeed);
    console.log(Math.random().toString())
    this.center = [Math.floor(canvas.height / 2), Math.floor(canvas.width / 2)];
    this.townRadius = 250;
    this.loading.push(this.loadTrees());
    this.loading.push(this.loadStones());
    this.toDraw = [];
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.addEventListener('load', e => resolve(img));
      img.addEventListener('error', () => {
        reject(new Error(`Failed to load image's URL: ${url}`));
      });
      img.src = url;
    });
  }

  drawWorld() {
    return new Promise(function (resolve, reject) {
      Promise.all(this.loading).then(function () {
        this.drawTrees();
        this.drawStones();
        let context = this.canvas.getContext("2d")
        this.toDraw.sort((a, b) => a.y + a.img.height - (b.y + b.img.height)).forEach(function (tree) {
          context.drawImage(tree.img, 0, 0, tree.img.width, tree.img.height, tree.x, tree.y, tree.img.width, tree.img.height)
        })
        resolve();
      }.bind(this))
    }.bind(this))
  }

  drawTrees() {
    let count = 0;
    let tries = 0;
    while (count < this.treesCount && tries < this.treesCount * 2) {
      tries++;
      let x = Math.random() * Math.floor(this.canvas.width / 2);
      let y = Math.random() * Math.floor(this.canvas.height) - 20;
      if (Math.pow(this.canvas.width / 2 - x, 2) + Math.pow(this.canvas.height / 2 - y, 2) < Math.pow(this.townRadius, 2)) continue;
      count++;
      let img = Math.random() < 0.05 ? this.stones[Math.floor(Math.random() * (this.stonesImgCount / 2)) + Math.floor(this.stonesImgCount / 2)] : this.trees[Math.floor(Math.random() * this.treesImgCount)];
      this.toDraw.push({
        x: x,
        y: y,
        img: img
      })
    }
  }

  drawStones() {
    let count = 0;
    let tries = 0;
    while (count < this.stonesCount && tries < this.stonesCount * 2) {
      tries++;
      let x = Math.random() * Math.floor(this.canvas.width / 2);
      let y = Math.random() * Math.floor(this.canvas.height);
      if (Math.pow(this.canvas.width / 2 - x, 2) + Math.pow(this.canvas.height / 2 - y, 2) < Math.pow(this.townRadius, 2)) continue;
      count++;
      let img = Math.random() < 0.2 ? this.trees[Math.floor(Math.random() * this.treesImgCount)] : this.stones[Math.floor(Math.random() * this.stonesImgCount)];
      this.toDraw.push({
        x: Math.abs(x - this.canvas.width),
        y: y,
        img: img
      })
    }
  }

  async loadTrees() {
    let loadingTrees = []
    for (let i = 0; i < this.treesImgCount; i++) {
      loadingTrees.push(this.loadImage(`/assets/images/trees/${i}.png`).then(response => response))
    }
    loadingTrees = await Promise.all(loadingTrees);
    this.trees = {};
    for (let i = 0; i < this.treesImgCount; i++) {
      this.trees[i] = loadingTrees[i];
    }
  }

  async loadStones() {
    let loadingStones = []
    for (let i = 0; i < this.stonesImgCount; i++) {
      loadingStones.push(this.loadImage(`/assets/images/stones/${i}.png`).then(response => response))
    }
    loadingStones = await Promise.all(loadingStones);
    this.stones = {};
    for (let i = 0; i < this.stonesImgCount; i++) {
      this.stones[i] = loadingStones[i];
    }
  }

  async loadResources() {
    let loadingResources = [];

    // let image = new Image();
    // // ToDo: cache image... atm this is reloading on every resize
    // image.onload = function () {
    //   context.drawImage(image, 0, 0, image.width, image.height, this.canvas.width * 0.5 - 85, this.topGridSize * (this.counter + 1) - 85, 170, 170);
    // }.bind({
    //   canvas: this.canvas,
    //   counter: counter,
    //   topGridSize: topGridSize
    // })
    // image.src = this.game.sourcesData[source].img;
  }
}