import Clempire from './game.js';
import World from './world.js';
import NumbersUtility from './numbers.js';
import CookieUtility from './cookies.js';

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
    if (!CookieUtility.hasCookie('lastTimePlayed')) {
      // eslint-disable-next-line no-undef
      showOverlay();
    }
    CookieUtility.saveCookie('lastTimePlayed', new Date().getTime());
    this.game = new Clempire(this);
    this.game.load.then(
      function () {
        window.addEventListener('resize', this.resizeHandler(), true);
        this.drawGame();
      }.bind(this)
    );
  }

  resizeHandler() {
    const context = {
      session: this,
      // wait 100ms for further resizing
      delta: 150,
      timeout: false
    };
    return function () {
      context.resizeTime = new Date();
      if (!context.timeout) {
        context.timeout = true;
        setTimeout(context.session.resizeEnd.bind(context), context.delta);
      }
    };
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
    this.canvas = document.getElementById('mainCanvas');
    const particlesCanvas = document.getElementById('particles');
    const leftSide = document.getElementById('left-side');
    this.canvas.width = leftSide.offsetWidth;
    this.canvas.height = leftSide.offsetHeight;
    particlesCanvas.width = leftSide.offsetWidth;
    particlesCanvas.height = leftSide.offsetHeight;

    this.world = new World(this);
    this.world.drawWorld().then(
      function () {
        this.displaySources();
        this.displayUpgrades();
        this.displayResources();
        this.startGame();
      }.bind(this)
    );
  }

  createBuildingInterfaces() {
    const parentAnchor = document.getElementById('interface-anchors');
    // clear anchors
    while (parentAnchor.firstChild) {
      parentAnchor.removeChild(parentAnchor.firstChild);
    }
    for (const buildingId in this.game.buildingsData) {
      if (!this.game.buildingsData[buildingId].interface) continue;
      if (this.game.buildings[buildingId] === 0 && this.game.buildingsData[buildingId].production) continue;
      const anchor = document.createElement('div');
      const building = this.game.buildingsData[buildingId];
      anchor.classList.add('interface-anchor');
      anchor.style.left = `${building.x + building.interface.offsetX}px`;
      anchor.style.top = `${building.y + building.interface.offsetY}px`;
      const imgField = document.createElement('div');
      imgField.classList.add('interface-image-field');
      imgField.style.backgroundImage = `url(${building.interface.img})`;
      anchor.appendChild(imgField);
      const field = document.createElement('div');
      field.classList.add('interface-field');
      field.setAttribute('draggable', false);
      field.setAttribute('oncontextmenu', 'return false;');
      if (building.production) {
        field.onclick = function (building, field) {
          this.game.buildingClick.apply(this.game, [building]);
          const current = document.querySelector('.tooltip');
          if (current) {
            current.remove();
            this.displayBuildingToolTip(field, building);
          }
        }.bind(this, building, field);
        field.style.cursor = `pointer`;
      }
      field.addEventListener(
        'mouseover',
        function (field, building) {
          this.displayBuildingToolTip(field, building);
        }.bind(this, field, building)
      );
      field.addEventListener('mouseout', () => {
        if (document.querySelector('.tooltip')) document.querySelector('.tooltip').remove();
      });
      anchor.appendChild(field);
      parentAnchor.appendChild(anchor);
    }
  }

  displayBuildingToolTip(field, building) {
    const tooltipWrap = this.createTooltipWrap(field);
    tooltipWrap.innerHTML = `
    <h1>${building.title}</h1>
    ${building.description
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('')}
    ${
      building.production
        ? `<br>
    <div class='production-description'>
      <p>Each ${building.title.toLowerCase()} currently produces <strong>${NumbersUtility.beautify(
            building.production.calcSingle()
          )}</strong> ${building.production.key} per second.</p>
      <p>You have <strong>${
        this.game.buildings[building.id]
      }</strong> ${building.title.toLowerCase()}(s) with a total production of <strong>${NumbersUtility.beautify(
            building.production.calc()
          )}</strong> ${building.production.key} per second.</p>
      <hr>
      <p>${building.upgrade}</p>
      <div class='cost'>
        <p>Cost:</p>
        <ul>
          ${Object.keys(building.cost)
            .map((resource) => `<li>${resource}: ${building.cost[resource]}</li>`)
            .join('')}
        </ul>
    </div>`
        : ''
    }`;
  }

  startGame() {
    this.globalTimer = setInterval(this.tick.bind(this), Math.floor(1000 / this.gameTicks));
  }

  tick() {
    this.updateResources();
    if (this.game.upgradeChanges) this.displayUpgrades();
    if (new Date().getTime() % this.titleRotationTime <= Math.floor(1000 / this.gameTicks)) this.rotateTitleDisplay();
  }

  displaySources() {
    this.placeResourceAnchors();
    const resourceFields = document.getElementsByClassName('resource-field');
    let counter = 0;

    for (const source in this.game.sourcesData) {
      if (!this.game.sourcesData[source].img) continue;
      if (counter === resourceFields.length) {
        throw new Error('Not enogh resource fields!');
      }
      const field = resourceFields[counter];
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
    const length = Object.keys(this.game.sourcesData).filter((key) => this.game.sourcesData[key].img).length;
    const anchors = document.getElementById('resource-anchors');
    while (anchors.firstChild) {
      anchors.removeChild(anchors.firstChild);
    }
    for (const source in this.game.sourcesData) {
      if (!this.game.sourcesData[source].img) continue;
      const anchor = document.createElement('div');
      anchor.classList.add('resource-field-anchor');
      anchor.style.left = `${15 + (70 / (length - 1)) * count}%`;
      anchor.style.top = this.canvas.width > 1000 ? this.canvas.height * 0.45 + 'px' : '170px';
      const imgField = document.createElement('div');
      imgField.classList.add('resource-image-field');
      imgField.style.backgroundImage = `url(${this.game.sourcesData[source].img})`;
      anchor.appendChild(imgField);
      const field = document.createElement('div');
      field.classList.add('resource-field');
      field.setAttribute('draggable', false);
      field.setAttribute('oncontextmenu', 'return false;');
      field.style.cursor = `url(${this.game.sourcesData[source].cursor}) 10 10, pointer`;
      anchor.appendChild(field);
      anchors.appendChild(anchor);
      count++;
    }
  }

  displayResources() {
    this.resourcesDisplay = document.querySelector('#resources');
    // clear list in case of a redraw due to window resize or new resources
    while (this.resourcesDisplay.firstChild) {
      this.resourcesDisplay.removeChild(this.resourcesDisplay.firstChild);
    }
    for (const resource in this.game.resourcesData) {
      if (Object.hasOwnProperty(this.game.resourcesData)) {
        continue;
      }
      const display = document.createElement('li');
      const label = document.createElement('div');
      label.style.background = `url(${this.game.resourcesData[resource].icon})  no-repeat`;
      display.appendChild(label);
      const count = document.createElement('span');
      count.classList.add('resource-count');
      display.appendChild(count);
      display.setAttribute('data-resource', resource);
      display.addEventListener(
        'mouseover',
        function (display, resource) {
          this.displayResourceToolTip(display, resource);
        }.bind(this, display, resource)
      );
      display.addEventListener('mouseout', () => {
        if (document.querySelector('.tooltip')) document.querySelector('.tooltip').remove();
      });
      this.resourcesDisplay.appendChild(display);
    }
  }

  displayResourceToolTip(display, resource) {
    const tooltipWrap = this.createTooltipWrap(display);
    const currentCount = Math.floor(this.game.resources.current[resource]).toString();
    const resourceData = this.game.resourcesData[resource];
    tooltipWrap.innerHTML = `
    <lable>${resourceData.lable}: </lable><span data-resource="${resource}" no-beautify>${currentCount}</span>`;
  }

  displayUpgrades() {
    this.game.upgradeChanges = false;
    this.ugradeDisplay = document.getElementById('upgrades');
    // clear list in case of a redraw due to window resize or new resources
    while (this.ugradeDisplay.firstChild) {
      this.ugradeDisplay.removeChild(this.ugradeDisplay.firstChild);
    }
    // remove possibly open tooltip
    const openToolTip = document.querySelector('.tooltip');
    if (openToolTip) openToolTip.remove();
    for (const upgradeIndex in this.game.shownUpgrades) {
      if (Object.hasOwnProperty(this.game.shownUpgrades)) {
        continue;
      }
      const display = document.createElement('div');
      const upgrade = this.game.upgradeData[this.game.shownUpgrades[upgradeIndex]];
      display.style.backgroundImage = `url(${upgrade.icon})`;
      // display.setAttribute("title", `${upgrade.title}\n\n${upgrade.description}\n\ncost:${Object.keys(upgrade.cost).map(key => "\n   " + key + ": " + upgrade.cost[key]).join("")}`)
      display.onclick = this.game.upgradeClick.bind(this.game, upgrade);
      display.addEventListener(
        'mouseover',
        function (display, upgrade) {
          this.displayUpgradeTooltip(display, upgrade);
        }.bind(this, display, upgrade)
      );
      display.addEventListener('mouseout', () => {
        if (document.querySelector('.tooltip')) document.querySelector('.tooltip').remove();
      });
      this.ugradeDisplay.appendChild(display);
    }
  }

  displayUpgradeTooltip(display, upgrade) {
    const tooltipWrap = this.createTooltipWrap(display);
    tooltipWrap.innerHTML = `<h1>${upgrade.title}</h1>
    ${upgrade.description
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('')}
    ${
      upgrade.quote
        ? `<div class="quote"><p class='text'>“${upgrade.quote.text}”</p><p class='originator'>- ${upgrade.quote.originator}</p></div>`
        : ''
    }
    <hr>
    ${
      upgrade.effectDescription
        ? upgrade.effectDescription
            .replace('doubles', '<strong>doubles</strong>')
            .split('\n')
            .map((line) => `<p class='effectDescription'>${line}</p>`)
            .join('')
        : this.getEffectDescription(upgrade.effect)
    }
    <div class='cost'>
      <p>Cost:</p>
      <ul>
        ${Object.keys(upgrade.cost)
          .map((resource) => `<li>${resource}: ${upgrade.cost[resource]}</li>`)
          .join('')}
      </ul>
    </div>`;
  }

  getEffectDescription(effect) {
    if (!effect.multiplier)
      throw new Error('Tell Niklas to implement automatic effect descriptions for ' + JSON.stringify(effect));
    const keys = Object.keys(effect.multiplier);
    if (keys.length > 1) throw new Error('Tell Niklas to implement better automatic effect descriptions :P');
    // only works for one multipier atm...
    if (Object.prototype.hasOwnProperty.call(this.game.buildings, keys[0])) {
      // it's a building
      return `This ${
        keys.map((key) =>
          effect.multiplier[key] === 2 ? `<strong>doubles</strong> your ${key}'s production` : 'Error :P'
        )[0]
      }`;
    } else {
      // by clicking
      return `This ${
        keys.map((key) =>
          effect.multiplier[key] === 2 ? `<strong>doubles</strong> your ${key} production by clicking` : 'Error :P'
        )[0]
      }`;
    }
  }

  createTooltipWrap(anchor) {
    const tooltipWrap = document.createElement('div');
    tooltipWrap.classList.add('tooltip');
    const firstChild = document.body.firstChild;
    firstChild.parentNode.insertBefore(tooltipWrap, firstChild);
    const padding = 15;
    const anchorProps = anchor.getBoundingClientRect();
    const topPos = anchorProps.top + padding + anchorProps.height;
    const leftPos = anchorProps.left + anchorProps.width / 2 - padding;
    tooltipWrap.setAttribute('style', 'top:' + topPos + 'px;' + 'left:' + leftPos + 'px;');
    return tooltipWrap;
  }

  updateResources() {
    for (let i = 0; i < this.resourcesDisplay.children.length; i++) {
      const resourceDisplay = this.resourcesDisplay.children[i];
      const resource = resourceDisplay.dataset.resource;
      const currentCount = NumbersUtility.beautify(this.game.resources.current[resource]);
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) {
        const resourceCount = tooltip.querySelector(`[data-resource="${resource}"]`);
        if (resourceCount && resourceCount.hasAttribute('no-beautify')) {
          resourceCount.innerText = Math.floor(this.game.resources.current[resource]);
        } else if (resourceCount) {
          resourceCount.innerText = currentCount;
        }
      }
      resourceDisplay.getElementsByTagName('span')[0].innerText = currentCount;
      if (i === this.titleRotation) {
        document.querySelector('head title').innerText = currentCount + ' | Clempire';
      }
    }
  }

  rotateTitleDisplay() {
    this.titleRotation++;
    const keys = Object.keys(this.game.resourcesData);
    if (this.titleRotation % keys.length === 0) this.titleRotation = 0;
    document
      .querySelector('head link[rel="icon"]')
      .setAttribute('href', this.game.resourcesData[keys[this.titleRotation]].icon);
  }
}

const session = new Session();
window.addEventListener('load', session.initialize.bind(session), true);
