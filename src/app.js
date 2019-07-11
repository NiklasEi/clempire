import Clempire from "./game.js"
import World from "./world.js"
import NumbersUtility from "./numbers.js"
import CookieUtility from "./cookies.js";

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
    // if this is the first time the player is playing, open the info
    if (!CookieUtility.hasCookie("playedbefore")) {
      showOverlay();
      let overlay = document.querySelector(".overlay-content");
      let firstChild = overlay.firstChild;
      let firstTimeInfo = document.createElement("p");
      firstTimeInfo.innerText = "Welcome to your first Clempire! You can reopen this info anytime by clicking on 'info' in the top-right. Have fun clicking for no reason at all ;)"
      overlay.insertBefore(firstTimeInfo, firstChild);
      CookieUtility.saveCookie("playedbefore", (new Date()).getTime());
    }
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

    this.world = new World(this);
    this.world.drawWorld().then(function () {
      this.displaySources();
      this.displayUpgrades();
      this.displayResources();
      this.startGame();
    }.bind(this));
  }

  createBuildingInterfaces() {
    let parentAnchor = document.getElementById("interface-anchors");
    // clear anchors
    while (parentAnchor.firstChild) {
      parentAnchor.removeChild(parentAnchor.firstChild);
    }
    for (let buildingId in this.game.buildingsData) {
      if (!this.game.buildingsData[buildingId].interface) continue;
      if (this.game.buildings[buildingId] === 0 && this.game.buildingsData[buildingId].production) continue;
      let anchor = document.createElement("div");
      let building = this.game.buildingsData[buildingId];
      anchor.classList.add("interface-anchor");
      anchor.style.left = `${building.x + building.interface.offsetX}px`
      anchor.style.top = `${building.y + building.interface.offsetY}px`
      let imgField = document.createElement("div");
      imgField.classList.add("interface-image-field");
      imgField.style.backgroundImage = `url(${building.interface.img})`
      anchor.appendChild(imgField);
      let field = document.createElement("div");
      field.classList.add("interface-field");
      field.setAttribute("draggable", false);
      field.setAttribute("oncontextmenu", "return false;");
      if (building.production) {
        field.onclick = function (building, field) {
          this.game.buildingClick.apply(this.game, [building]);
          let current = document.querySelector(".tooltip");
          if(current) {
            current.remove();
            this.displayBuildingToolTip(field, building)
          }
        }.bind(this, building, field);
        field.style.cursor = `pointer`
      }
      field.addEventListener("mouseover", function (field, building) {
        this.displayBuildingToolTip(field, building)
      }.bind(this, field, building))
      field.addEventListener("mouseout", () => {
        if (document.querySelector(".tooltip")) document.querySelector(".tooltip").remove()
      });
      anchor.appendChild(field);
      parentAnchor.appendChild(anchor);
    }
  }

  displayBuildingToolTip(field, building) {
    let tooltipWrap = this.createTooltipWrap(field);
    tooltipWrap.innerHTML = `
    <h1>${building.title}</h1>
    ${building.description.split("\n").map(line => `<p>${line}</p>`).join("")}
    ${building.production ? `<br>
    <div class='production-description'>
      <p>You own <strong>${this.game.buildings[building.id]}</strong> ${building.title.toLowerCase()}(s) with a total production of <strong>${NumbersUtility.beautify(building.production.calc())}</strong> ${building.production.key} per second.</p>
      <p>Each ${building.title.toLowerCase()} currently produces <strong>${NumbersUtility.beautify(building.production.calcSingle())}</strong> ${building.production.key} per second.</p>
      <hr>
      <p>${building.upgrade}</p>
      <div class='cost'>
        <p>Cost:</p>
        <ul>
          ${Object.keys(building.cost).map(resource => `<li>${resource}: ${building.cost[resource]}</li>`).join("")}
        </ul>
    </div>`
    : ""}`
  }

  startGame() {
    this.globalTimer = setInterval(this.tick.bind(this), Math.floor(1000 / this.gameTicks));
  }

  tick() {
    this.updateResources();
    if (this.game.upgradeChanges) this.displayUpgrades();
    if (((new Date()).getTime() % this.titleRotationTime) <= Math.floor(1000 / this.gameTicks)) this.rotateTitleDisplay();
  }

  displaySources() {
    this.placeResourceAnchors();
    let resourceFields = document.getElementsByClassName("resource-field");
    let counter = 0;

    for (let source in this.game.sourcesData) {
      if (!this.game.sourcesData[source].img) continue;
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
    let length = Object.keys(this.game.sourcesData).filter(key => this.game.sourcesData[key].img).length;
    let anchors = document.getElementById("resource-anchors");
    while (anchors.firstChild) {
      anchors.removeChild(anchors.firstChild);
    }
    for (let source in this.game.sourcesData) {
      if (!this.game.sourcesData[source].img) continue;
      let anchor = document.createElement("div");
      anchor.classList.add("resource-field-anchor");
      anchor.style.left = `${15 + (70 / (length - 1)) * count}%`;
      anchor.style.top = this.canvas.width > 1000 ? (this.canvas.height * 0.45) + "px" : "170px";
      let imgField = document.createElement("div");
      imgField.classList.add("resource-image-field");
      imgField.style.backgroundImage = `url(${this.game.sourcesData[source].img})`
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
      display.addEventListener("mouseover", function (display, resource) {
        this.displayResourceToolTip(display, resource)
      }.bind(this, display, resource))
      display.addEventListener("mouseout", () => {
        if (document.querySelector(".tooltip")) document.querySelector(".tooltip").remove()
      });
      this.resourcesDisplay.appendChild(display);
    }
  }

  displayResourceToolTip(display, resource) {
    let tooltipWrap = this.createTooltipWrap(display);
    let currentCount = Math.floor(this.game.resources.current[resource]).toString();
    let resourceData = this.game.resourcesData[resource]
    tooltipWrap.innerHTML = `
    <lable>${resourceData.lable}: </lable><span data-resource="${resource}">${currentCount}</span>`
  }

  displayUpgrades() {
    this.game.upgradeChanges = false;
    this.ugradeDisplay = document.getElementById("upgrades");
    // clear list in case of a redraw due to window resize or new resources
    while (this.ugradeDisplay.firstChild) {
      this.ugradeDisplay.removeChild(this.ugradeDisplay.firstChild);
    }
    // remove possibly open tooltip
    let openToolTip = document.querySelector(".tooltip");
    if (openToolTip) openToolTip.remove();
    for (let upgradeIndex in this.game.shownUpgrades) {
      let display = document.createElement("div");
      let upgrade = this.game.upgradeData[this.game.shownUpgrades[upgradeIndex]];
      display.style.backgroundImage = `url(${upgrade.icon})`;
      //display.setAttribute("title", `${upgrade.title}\n\n${upgrade.description}\n\ncost:${Object.keys(upgrade.cost).map(key => "\n   " + key + ": " + upgrade.cost[key]).join("")}`)
      display.onclick = this.game.upgradeClick.bind(this.game, upgrade);
      display.addEventListener("mouseover", function (display, upgrade) {
        this.displayUpgradeTooltip(display, upgrade)
      }.bind(this, display, upgrade))
      display.addEventListener("mouseout", () => {
        if (document.querySelector(".tooltip")) document.querySelector(".tooltip").remove()
      });
      this.ugradeDisplay.appendChild(display);
    }
  }

  displayUpgradeTooltip(display, upgrade) {
    let tooltipWrap = this.createTooltipWrap(display);
    tooltipWrap.innerHTML = `<h1>${upgrade.title}</h1>
    ${upgrade.description.split("\n").map(line => `<p>${line}</p>`).join("")}
    ${upgrade.quote ? `<div class="quote"><p class='text'>“${upgrade.quote.text}”</p><p class='originator'>- ${upgrade.quote.originator}</p></div>` : ""}
    ${upgrade.effectDescription ? `<p class='effectDescription'>${upgrade.effectDescription}</p>` : JSON.stringify(upgrade.effect)}
    <div class='cost'>
      <p>Cost:</p>
      <ul>
        ${Object.keys(upgrade.cost).map(resource => `<li>${resource}: ${upgrade.cost[resource]}</li>`).join("")}
      </ul>
    </div>`
  }

  createTooltipWrap(anchor) {
    let tooltipWrap = document.createElement("div");
    tooltipWrap.classList.add('tooltip');
    var firstChild = document.body.firstChild;
    firstChild.parentNode.insertBefore(tooltipWrap, firstChild);
    var padding = 15;
    var anchorProps = anchor.getBoundingClientRect();
    var topPos = anchorProps.top + padding + anchorProps.height;
    var leftPos = anchorProps.left + anchorProps.width / 2 - padding;
    tooltipWrap.setAttribute('style', 'top:' + topPos + 'px;' + 'left:' + leftPos + 'px;')
    return tooltipWrap;
  }

  updateResources() {
    for (let i = 0; i < this.resourcesDisplay.children.length; i++) {
      let resourceDisplay = this.resourcesDisplay.children[i];
      let resource = resourceDisplay.dataset.resource;
      let currentCount = NumbersUtility.beautify(this.game.resources.current[resource]);
      let tooltip = document.querySelector(".tooltip");
      if (tooltip) {
        let resourceCount = tooltip.querySelector(`[data-resource="${resource}"]`);
        if (resourceCount) {
          resourceCount.innerText = currentCount.toString();
        }
      }
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