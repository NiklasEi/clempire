class Session {
  constructor() {
    this.game;
    this.canvas;
    this.globalTimer;
    this.resourcesDisplay;
  }

  initialize() {
    this.game = new Clempire();
    this.game.load.then(function () {
      this.drawGame.apply(this);
    }.bind(this));
  }

  drawGame() {
    this.canvas = document.getElementById("mainCanvas");
    let leftSide = document.getElementById("left-side");
    this.canvas.width = leftSide.offsetWidth;
    this.canvas.height = leftSide.offsetHeight;

    this.displayResources();
    this.displaySources();
    this.startGame();
  }

  startGame() {
    this.globalTimer = setInterval(this.tick.bind(this), 200);
  }

  tick() {
    this.updateResources();
  }

  displaySources() {
    let context = this.canvas.getContext("2d");
    let resourceFields = document.getElementsByClassName("resource-field");
    let counter = 0;
    for (let source in this.game.sourcesData) {
      if (counter === resourceFields.length) {
        throw new Error("Not enogh resource fields!")
      }
      let image = new Image();
      image.onload = function () {
        context.drawImage(image, 0, 0, image.width, image.height, this.canvas.width * 0.5 - 85, this.canvas.height * 0.4 - 85, 170, 170);
      }.bind(this)
      image.src = this.game.sourcesData[source].img;
      let field = resourceFields[counter];
      field.onclick = this.game.fieldClick.bind(this.game.sourcesData[source]);
      counter ++;
    }
  }

  displayResources() {
    this.resourcesDisplay = document.querySelector("#resources ul");
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

  updateResources() {
    for (let i = 0; i < this.resourcesDisplay.children.length; i++) {
      let resourceDisplay = this.resourcesDisplay.children[i];
      resourceDisplay.getElementsByTagName("span")[0].innerText = this.game.resources[resourceDisplay.dataset.resource];
    }
  }
}

let session = new Session();
window.onload = session.initialize.bind(session);