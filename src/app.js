import Clempire from "./game.js"
import World from "./world.js"
import NumbersUtility from "./numbers.js"

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
    this.game = new Clempire(this);
    this.game.load.then(function () {
      window.addEventListener('resize', this.resizeHandler(), true);
      this.drawGame();
    }.bind(this));
  }

  resizeHandler() {
    let context = {
      session: this,
      // wait 100ms for further resizing 
      delta: 150,
      timeout: false
    }
    return function () {
      context.resizeTime = new Date();
      if (!context.timeout) {
        context.timeout = true;
        setTimeout(context.session.resizeEnd.bind(context), context.delta);
      }
    }
  }

  resizeEnd() {
    if (new Date() - this.resizeTime < this.delta) {
      setTimeout(this.session.resizeEnd.bind(this), this.delta - new Date() + this.resizeTime);
    } else {
      this.timeout = false;
      this.session.drawGame.apply(this.session);
    }
  }

  drawGame() {
    this.canvas = document.getElementById("mainCanvas");
    let particlesCanvas = document.getElementById("particles");
    let leftSide = document.getElementById("left-side");
    this.canvas.width = leftSide.offsetWidth;
    this.canvas.height = leftSide.offsetHeight;
    particlesCanvas.width = leftSide.offsetWidth;
    particlesCanvas.height = leftSide.offsetHeight;

    this.world = new World(this.canvas);
    this.world.drawWorld(this.game).then(function () {
      this.displaySources();
      this.displayUpgrades();
      this.displayResources();
      this.startGame();
    }.bind(this));
  }

  startGame() {
    this.globalTimer = setInterval(this.tick.bind(this), Math.floor(1000 / this.gameTicks));
  }

  tick() {
    this.updateResources();
    if(this.game.upgradeChanges) this.displayUpgrades();
    if (((new Date()).getTime() % this.titleRotationTime) <= Math.floor(1000 / this.gameTicks)) this.rotateTitleDisplay();
  }

  displaySources() {
    this.placeResourceAnchors();
    let resourceFields = document.getElementsByClassName("resource-field");
    let counter = 0;

    for (let source in this.game.sourcesData) {
      if (counter === resourceFields.length) {
        throw new Error("Not enogh resource fields!")
      }
      let field = resourceFields[counter];
      field.onclick = function (e) {
        this.game.resourceFieldClick.apply({
          source: this.game.sourcesData[source],
          session: this,
          coordinates: [e.clientX, e.clientY - 50] // remove header offset
        });
      }.bind(this);
      counter++;
    }
  }

  placeResourceAnchors() {
    let count = 0;
    let length = Object.keys(this.game.sourcesData).length;
    let anchors = document.getElementById("anchors");
    while (anchors.firstChild) {
      anchors.removeChild(anchors.firstChild);
    }
    for (let source in this.game.sourcesData) {
      let anchor = document.createElement("div");
      anchor.classList.add("resource-field-anchor");
      anchor.setAttribute("data-source-field", `${count + 1}`);
      anchor.style.left = `${15 + (70 / (length - 1)) * count}%`;
      anchor.style.top = this.canvas.width > 1000 ? (this.canvas.height * 0.45) + "px" : "170px";
      let imgField = document.createElement("div");
      imgField.classList.add("resource-image-field");
      anchor.appendChild(imgField);
      let field = document.createElement("div");
      field.classList.add("resource-field");
      field.setAttribute("draggable", false);
      field.setAttribute("oncontextmenu", "return false;");
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

  displayUpgrades() {
    this.game.upgradeChanges = false;
    this.ugradeDisplay = document.getElementById("upgrades");
    // clear list in case of a redraw due to window resize or new resources
    while (this.ugradeDisplay.firstChild) {
      this.ugradeDisplay.removeChild(this.ugradeDisplay.firstChild);
    }
    for (let upgradeIndex in this.game.shownUpgrades) {
      let display = document.createElement("div");
      let upgrade = this.game.upgradeData[this.game.shownUpgrades[upgradeIndex]];
      display.style.background = `url(${upgrade.icon})  no-repeat`;
      display.setAttribute("title", `${upgrade.title}\n\n${upgrade.description}\n\ncost:${Object.keys(upgrade.cost).map(key => "\n   " + key + ": " + upgrade.cost[key]).join("")}`)
      display.onclick = this.game.upgradeClick.bind({
        upgrade: upgrade,
        session: this
      });
      this.ugradeDisplay.appendChild(display);
    }
  }

  updateResources() {
    for (let i = 0; i < this.resourcesDisplay.children.length; i++) {
      let resourceDisplay = this.resourcesDisplay.children[i];
      let currentCount = NumbersUtility.beautify(this.game.resources.current[resourceDisplay.dataset.resource]);
      resourceDisplay.getElementsByTagName("span")[0].innerText = currentCount;
      if (i === this.titleRotation) {
        document.querySelector("head title").innerText = currentCount + " | Clempire";
      }
    }
  }

  rotateTitleDisplay() {
    this.titleRotation++;
    let keys = Object.keys(this.game.resourcesData);
    if (this.titleRotation % keys.length === 0) this.titleRotation = 0;
    document.querySelector('head link[rel="icon"]').setAttribute("href", this.game.resourcesData[keys[this.titleRotation]].icon)
  }
}

let session = new Session();
window.addEventListener("load", session.initialize.bind(session), true);
