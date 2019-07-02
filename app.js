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
    this.placeResourceAnchors();
    let resourceFields = document.getElementsByClassName("resource-field");
    let counter = 0;
    let topGridSize = this.canvas.height / (resourceFields.length + 1)
    for (let source in this.game.sourcesData) {
      if (counter === resourceFields.length) {
        throw new Error("Not enogh resource fields!")
      }
      let image = new Image();
      console.log(topGridSize*(counter+1) - 85);
      image.onload = function () {
        console.log(topGridSize*(counter+1) - 85);
        console.log(image);
        context.drawImage(image, 0, 0, image.width, image.height, this.canvas.width * 0.5 - 85, topGridSize*(this.counter+1) - 85, 170, 170);
      }.bind({canvas: this.canvas, counter: counter})
      image.src = this.game.sourcesData[source].img;
      let field = resourceFields[counter];
      field.onclick = this.game.fieldClick.bind(this.game.sourcesData[source]);
      counter++;
    }
  }

  placeResourceAnchors() {
    let count = 1;
    let length = this.game.sourcesData.length;
    let field = document.createElement("div");
    field.classList.add("resource-field");
    let leftSide = document.getElementById("left-side");
    for (let source in this.game.sourcesData) {
      let anchor = document.createElement("div");
      anchor.classList.add("resource-field-anchor");
      anchor.setAttribute("data-source-field", count.toString());
      anchor.style.top = `${(100 / (length + 1)) * count}%`;
      anchor.style.left = "50%";
      anchor.appendChild(field.cloneNode());
      leftSide.appendChild(anchor);
      count ++;
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