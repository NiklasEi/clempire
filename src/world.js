import CookieUtility from "./cookies.js"

class World {
  constructor(canvas) {
    this.loading = [];
    this.canvas = canvas;
    this.treesImgCount = 4;
    this.treesCount = 400;
    this.stonesImgCount = 11;
    this.stonesCount = 300;
    this.worldSeed = CookieUtility.getCookie("world.seed");
    if (!this.worldSeed || this.worldSeed.length <= 0) {
      this.worldSeed = (Math.random() + 1).toString(36).substring(7);
      CookieUtility.saveCookie("world.seed", this.worldSeed);
    }
    console.log("Current world seed: " + this.worldSeed);
    this.center = [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)];
    this.townRadius = 200;
    this.loading.push(this.loadTrees());
    this.loading.push(this.loadStones());
    this.loading.push(this.loadTown());
    this.toDraw = [];
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', () => {
        reject(new Error(`Failed to load image's URL: ${url}`));
      });
      img.src = url;
    });
  }

  drawWorld(game) {
    return new Promise(function (resolve) {
      Promise.all(this.loading).then(function () {
        Math.seedrandom(this.worldSeed);
        this.placeTrees();
        this.placeStones();
        this.placeTown(game);
        let context = this.canvas.getContext("2d")
        context.filter = "brightness(1)"
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.toDraw.sort((a, b) => a.y + a.img.height - (b.y + b.img.height)).forEach(function (tree) {
          context.drawImage(tree.img, 0, 0, tree.img.width, tree.img.height, tree.x, tree.y, tree.img.width, tree.img.height)
        })
        this.toDraw = [];
        resolve();
      }.bind(this))
    }.bind(this))
  }

  placeTrees() {
    let count = 0;
    let tries = 0;
    while (count < this.treesCount && tries < this.treesCount * 2) {
      tries++;
      let x = Math.random() * Math.floor(this.canvas.width / 2);
      let y = Math.random() * Math.floor(this.canvas.height) - 20;
      if (Math.pow(this.canvas.width / 2 - x, 2) + Math.pow(this.canvas.height / 2 - y, 2) < Math.pow(this.townRadius, 2)) continue;
      count++;
      let img = Math.random() < 0.05 ? this.stones[Math.floor(Math.random() * 4) + 6] : this.trees[Math.floor(Math.random() * this.treesImgCount)];
      this.toDraw.push({
        x: x,
        y: y,
        img: img
      })
    }
  }

  placeStones() {
    let count = 0;
    let tries = 0;
    while (count < this.stonesCount && tries < this.stonesCount * 2) {
      tries++;
      let x = Math.random() * Math.floor(this.canvas.width / 2);
      let y = Math.random() * Math.floor(this.canvas.height);
      if (Math.pow(this.canvas.width / 2 - x, 2) + Math.pow(this.canvas.height / 2 - y, 2) < Math.pow(this.townRadius, 2)) continue;
      count++;
      let img = Math.random() < 0.7 ? this.trees[Math.floor(Math.random() * this.treesImgCount)] : this.stones[Math.floor(Math.random() * this.stonesImgCount)];
      this.toDraw.push({
        x: Math.abs(x - this.canvas.width),
        y: y,
        img: img
      })
    }
  }

  placeTown(game) {
    this.toDraw.push({
      x: this.center[0] - this.town.tavern.width / 2,
      y: this.center[1] - this.town.tavern.height / 2 - 100,
      img: this.town.tavern
    });
    if (game.buildings.lumberjack > 0) {
      game.buildingsData.lumberjack.x = this.center[0] - 100 / 1.4;
      game.buildingsData.lumberjack.y = this.center[1] + 100 / 1.4;
      this.toDraw.push({
        x: game.buildingsData.lumberjack.x - this.town.tavern.width / 2,
        y: game.buildingsData.lumberjack.y - this.town.tavern.height / 2,
        img: this.town.lumberjack
      });
    }
    if (game.buildings.stonecutter > 0) {
      game.buildingsData.stonecutter.x = this.center[0] + 130 / 1.4;
      game.buildingsData.stonecutter.y = this.center[1] + 70 / 1.4;
      this.toDraw.push({
        x: game.buildingsData.stonecutter.x - this.town.tavern.width / 2,
        y: game.buildingsData.stonecutter.y - this.town.tavern.height / 2,
        img: this.town.stonecutter
      });
    }
  }

  async loadTrees() {
    let loadingTrees = []
    for (let i = 0; i < this.treesImgCount; i++) {
      loadingTrees.push(this.loadImage(`assets/images/trees/${i}.png`).then(response => response))
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
      loadingStones.push(this.loadImage(`assets/images/stones/${i}.png`).then(response => response))
    }
    loadingStones = await Promise.all(loadingStones);
    this.stones = {};
    for (let i = 0; i < this.stonesImgCount; i++) {
      this.stones[i] = loadingStones[i];
    }
  }

  async loadTown() {
    let loadingTown = []
    loadingTown.push(this.loadImage(`assets/images/town/tavern.png`).then(response => {
      return {
        id: "tavern",
        img: response
      }
    }))
    loadingTown.push(this.loadImage(`assets/images/town/lumberjack.png`).then(response => {
      return {
        id: "lumberjack",
        img: response
      }
    }))
    loadingTown.push(this.loadImage(`assets/images/town/stonecutter.png`).then(response => {
      return {
        id: "stonecutter",
        img: response
      }
    }))
    loadingTown = await Promise.all(loadingTown);
    this.town = {}
    for (let i = 0; i < loadingTown.length; i++) {
      this.town[loadingTown[i].id] = loadingTown[i].img;
    }
  }
}

export default World;