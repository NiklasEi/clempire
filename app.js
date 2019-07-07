class Session {
  constructor() {
    this.game;
    this.canvas;
    this.globalTimer;
    this.resourcesDisplay;
    // start with hardcoded coins as icon
    this.titleRotation = 2;
    this.titleRotationTime = 5000;
    // ticks per second
    this.gameTicks = 5;
  }

  initialize() {
    this.game = new Clempire();
    this.game.load.then(function () {
      window.addEventListener('resize', this.resizeHandler(), true);
      this.drawGame();
    }.bind(this));
  }

  resizeHandler() {
    let context = {
      session: this,
      // wait 100ms for further resizing 
      delta: 100,
      timeout: false
    }
    return function () {
      context.rtime = new Date();
      if (!context.timeout) {
        context.timeout = true;
        setTimeout(context.session.resizeEnd.bind(context), context.delta);
      }
    }
  }

  resizeEnd() {
    if (new Date() - this.rtime < this.delta) {
      setTimeout(this.session.resizeEnd.bind(this), this.delta);
    } else {
      this.timeout = false;
      this.session.drawGame.apply(this.session);
    }
  }

  drawGame() {
    this.canvas = document.getElementById("mainCanvas");
    let leftSide = document.getElementById("left-side");
    this.canvas.width = leftSide.offsetWidth;
    this.canvas.height = leftSide.offsetHeight;

    this.world = new World(this.canvas);
    this.world.drawWorld().then(function () {
      this.displaySources();
      this.displayBuildings();
      this.displayResources();
      this.startGame();
    }.bind(this));
  }

  startGame() {
    this.globalTimer = setInterval(this.tick.bind(this), Math.floor(1000 / this.gameTicks));
  }

  tick() {
    this.updateResources();
    if(((new Date()).getTime() % this.titleRotationTime) <= Math.floor(1000 / this.gameTicks)) this.rotateTitleDisplay();
  }

  displaySources() {
    let context = this.canvas.getContext("2d");
    this.placeResourceAnchors();
    let resourceFields = document.getElementsByClassName("resource-field");
    let counter = 0;
    let topGridSize = this.canvas.height / (resourceFields.length + 1)

    for (let source in this.game.sourcesData) {
      if (counter === resourceFields.length) {
        throw new Error("Not enogh resource fields!")
      }
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
      let field = resourceFields[counter];
      field.onclick = this.game.resourceFieldClick.bind({
        source: this.game.sourcesData[source],
        session: this
      });
      counter++;
    }
  }

  placeResourceAnchors() {
    let count = 0;
    let length = this.game.sourcesData.length;
    let anchors = document.getElementById("anchors");
    while (anchors.firstChild) {
      anchors.removeChild(anchors.firstChild);
    }
    for (let source in this.game.sourcesData) {
      let anchor = document.createElement("div");
      anchor.classList.add("resource-field-anchor");
      anchor.setAttribute("data-source-field", `${count + 1}`);
      anchor.style.left = `${15 + (70 / (length - 1)) * count}%`;
      anchor.style.top = "150px";
      let field = document.createElement("div");
      field.classList.add("resource-field");
      field.style.cursor = `url(${this.game.sourcesData[source].cursor}) 10 10, pointer`
      anchor.appendChild(field);
      anchors.appendChild(anchor);
      count++;
    }
  }

  displayResources() {
    this.resourcesDisplay = document.querySelector("#resources");
    // clear list in case of a redraw due to window resize or new resources
    while (this.resourcesDisplay.firstChild) {
      this.resourcesDisplay.removeChild(this.resourcesDisplay.firstChild);
    }
    for (let resource in this.game.resourcesData) {
      let display = document.createElement("li");
      let label = document.createElement("div");
      label.style.background = `url(${this.game.resourcesData[resource].icon})  no-repeat`;
      display.appendChild(label);
      let count = document.createElement("span");
      count.classList.add("resource-count");
      display.appendChild(count);
      display.setAttribute("data-resource", resource);
      this.resourcesDisplay.appendChild(display);
    }
  }

  displayBuildings() {
    this.buildingsDisplay = document.getElementById("buildings");
    // clear list in case of a redraw due to window resize or new resources
    while (this.buildingsDisplay.firstChild) {
      this.buildingsDisplay.removeChild(this.buildingsDisplay.firstChild);
    }
    for (let buildingIndex in this.game.buildingsData) {
      let display = document.createElement("div");
      let building = this.game.buildingsData[buildingIndex];
      display.style.background = `url(${building.icon})  no-repeat`;
      display.setAttribute("title", `${building.title}\n\n${building.description}`)
      this.buildingsDisplay.appendChild(display);
    }
  }

  updateResources() {
    for (let i = 0; i < this.resourcesDisplay.children.length; i++) {
      let resourceDisplay = this.resourcesDisplay.children[i];
      let currentCount = this.beautify(this.game.resources.current[resourceDisplay.dataset.resource]);
      resourceDisplay.getElementsByTagName("span")[0].innerText = currentCount;
      if(i === this.titleRotation) {
        document.querySelector("head title").innerText = currentCount + " | Clempire";
      }
    }
  }

  beautify(number) {
    // ToDo
    return number;
  }

  rotateTitleDisplay() {
      this.titleRotation ++;
      let keys = Object.keys(this.game.resourcesData);
      if(this.titleRotation % keys.length === 0) this.titleRotation = 0;
      document.querySelector('head link[rel="icon"]').setAttribute("href", this.game.resourcesData[keys[this.titleRotation]].icon)
  }
}

let session = new Session();
window.addEventListener("load", session.initialize.bind(session), true);