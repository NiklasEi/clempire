import CookieUtility from './cookies.js';
import Alert from './alert.js';
import Particles from './particles.js';
import AudioPlayer from './audio.js';
import NumbersUtility from './numbers.js';

class Clempire {
  constructor(session) {
    this.session = session;
    this.audio = new AudioPlayer();
    const particlesCanvas = document.getElementById('particles');
    this.particles = new Particles(particlesCanvas);
    this.shownUpgrades = [];
    this.resourcesData = {};
    this.goldProbability = 0.005;
    this.autoSaveIntervall = 60 * 1000; // autosave every minute
    this.gameIntervall = 1000; // autosave every minute
    this.load = new Promise(
      function (resolve, reject) {
        this.loadData()
          .catch((e) => reject(e))
          .then(
            function () {
              this.prepare();
              this.autoSaveId = setInterval(this.autoSave.bind(this), this.autoSaveIntervall);
              this.gameIntervallId = setInterval(this.gameTick.bind(this), this.gameIntervall);
              this.loadQueryStringResources(); // Allow resource cheating via query string
              this.audio.addSound('background', 'assets/sounds/background.mp3', this.startBackgroundMusic.bind(this));
              resolve();
            }.bind(this)
          );
      }.bind(this)
    );
  }

  startBackgroundMusic() {
    this.audio.playSound('background', true);
  }

  gameTick() {
    this.checkRequirements();
    this.produce();
  }

  produce() {
    for (const building in this.buildingsData) {
      if (this.buildingsData[building].production === undefined) continue;
      const produceCount = this.buildingsData[building].production.calc();
      const productionKey = this.buildingsData[building].production.key; // e.g. "wood"
      const img = this.session.game.resourcesData[productionKey].img;
      if (!isNaN(produceCount) && produceCount > 0) {
        this.particles.spawn(
          img,
          this.buildingsData[building].x,
          this.buildingsData[building].y,
          '+ ' + NumbersUtility.beautify(produceCount),
          4000
        );
        this.session.game.resources.current[productionKey] += produceCount;
        this.session.game.resources.produced[productionKey] += produceCount;
      }
    }
  }

  checkRequirements() {
    const newUpgrades = this.openUpgrades.filter(
      (id) => this.upgradeData[id].requirement && this.isReqMet(this.upgradeData[id].requirement)
    );
    if (newUpgrades.length > 0) {
      this.showUpgrades(newUpgrades);
    }
  }

  showUpgrades(upgrades) {
    this.shownUpgrades = this.shownUpgrades.concat(upgrades);
    this.shownUpgrades.sort((a, b) => this.upgradeData[a].weight - this.upgradeData[b].weight);
    this.openUpgrades = this.openUpgrades.filter((id) => !upgrades.includes(id));
    this.upgradeChanges = true; // set flag to render upgrades new
  }

  autoSave() {
    for (const type in this.resources) {
      for (const resource in this.resources[type]) {
        CookieUtility.saveCookie('resources.' + type + '.' + resource, this.resources[type][resource]);
      }
    }
    // upgrades and buildings are saved directly
    Alert.autoSave();
  }

  prepare() {
    this.prepareResources();
    this.prepareBuildings();
    this.prepareUpgrades();
    this.checkRequirements();
  }

  prepareUpgrades() {
    this.openUpgrades = [];
    const fromSave = CookieUtility.getCookie('upgrades');
    this.activeUpgrades =
      fromSave && !isNaN(parseInt(fromSave, 10)) ? fromSave.split(',').map((id) => parseInt(id, 10)) : [];
    for (const upgrade in this.upgradeData) {
      if (this.activeUpgrades.includes(parseInt(upgrade, 10))) {
        this.activateUpgrade(this.upgradeData[upgrade]);
        continue;
      }
      this.openUpgrades.push(parseInt(upgrade, 10));
    }
  }

  prepareResources() {
    this.resources = {
      produced: {},
      gathered: {},
      current: {}
    };
    for (const type in this.resources) {
      for (const resource in this.resourcesData) {
        const fromSave = CookieUtility.getCookie('resources.' + type + '.' + resource);
        this.resources[type][resource] = fromSave && fromSave > 0 ? parseInt(fromSave, 10) : 0;
      }
    }
  }

  prepareBuildings() {
    this.buildings = {};
    for (const building in this.buildingsData) {
      this.buildingsData[building].id = building;
      const fromSave = CookieUtility.getCookie('buildings.' + building);
      this.buildings[building] = fromSave && fromSave > 0 ? parseInt(fromSave, 10) : 0;
      if (this.buildingsData[building].production) {
        this.buildingsData[building].production = new Production(this, this.buildingsData[building]);
        this.buildingsData[building].production.updateNextCost();
      }
    }
  }

  async loadData() {
    const loadingResources = fetch('assets/data/resources.json')
      // eslint-disable-next-line no-console
      .catch((e) => console.error(e))
      .then((response) => response.json());
    const loadingBuildings = fetch('assets/data/buildings.json')
      // eslint-disable-next-line no-console
      .catch((e) => console.error(e))
      .then((response) => response.json());
    const loadingSources = fetch('assets/data/sources.json')
      // eslint-disable-next-line no-console
      .catch((e) => console.error(e))
      .then((response) => response.json());
    const loadingUpgrades = fetch('assets/data/upgrades.json')
      // eslint-disable-next-line no-console
      .catch((e) => console.error(e))
      .then((response) => response.json());
    let loadingAudio = fetch('assets/data/audio.json')
      // eslint-disable-next-line no-console
      .catch((e) => console.error(e))
      .then((response) => response.json());
    [this.resourcesData, this.buildingsData, this.sourcesData, this.upgradeData, loadingAudio] = await Promise.all([
      loadingResources,
      loadingBuildings,
      loadingSources,
      loadingUpgrades,
      loadingAudio
    ]);
    for (const audioId in loadingAudio) {
      this.audio.addSound(audioId, loadingAudio[audioId]);
    }
    for (const source in this.sourcesData) {
      this.sourcesData[source].id = source;
      this.sourcesData[source].multiplier = 1;
      this.audio.addSound(this.sourcesData[source].id, this.sourcesData[source].sound);
    }
    let loadingIcons = [];
    for (const resource in this.resourcesData) {
      this.resourcesData[resource].id = resource;
      this.resourcesData[resource].img = this.loadImage(this.resourcesData[resource].icon).then((response) => response);
      loadingIcons.push(this.resourcesData[resource].img);
    }
    /* // The inteface icons will be set in style as div background...
    for (let building in this.buildingsData) {
      if(!this.buildingsData[building].interface) continue;
      this.buildingsData[building].interface.img = this.loadImage(this.buildingsData[building].interface.icon).then(response => response)
      loadingIcons.push(this.buildingsData[building].interface.img);
    }*/
    loadingIcons = await Promise.all(loadingIcons);
    let i = 0;
    for (const resource in this.resourcesData) {
      this.resourcesData[resource].img = loadingIcons[i];
      i++;
    }
    // put IDs also into the upgrade obj
    for (const upgradeId in this.upgradeData) {
      this.upgradeData[upgradeId].id = parseInt(upgradeId, 10);
      if (!this.upgradeData[upgradeId].weight) {
        this.upgradeData[upgradeId].weight = Object.keys(this.upgradeData[upgradeId].cost).reduce(
          (sum, current) => sum + this.upgradeData[upgradeId].cost[current],
          0
        );
      }
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', () => {
        reject(new Error(`Failed to load image's URL: ${url}`));
      });
      img.src = url;
    });
  }

  resourceFieldClick() {
    // called for a click on a resource field.
    // this is bound to {session: session, source: clickedSource}
    let source = this.source.id;
    let count = this.session.game.sourcesData[this.source.id].multiplier;
    if (this.source.id === 'stone') {
      if (Math.random() < this.session.game.goldProbability) {
        count = 1;
        source = 'coins';
      }
    }
    this.session.game.resources.current[source] += count;
    this.session.game.resources.gathered[source] += count;
    this.session.game.audio.playSound(source);
    const img = this.session.game.resourcesData[source].img;
    this.session.game.particles.spawn(img, this.coordinates[0], this.coordinates[1], '+ ' + count, 4000);
  }

  upgradeClick(upgrade) {
    if (this.canPay(upgrade.cost)) {
      this.audio.playSound('yes');
      this.pay(upgrade.cost);
      document.querySelector('.tooltip').remove(); // remove open tooltips
      // flag loaded=false in order to also gain buildings from upgrades and other stuff that is additionally saved/loaded
      this.activateUpgrade(upgrade, false);
      CookieUtility.saveCookie('upgrades', this.activeUpgrades.join(','));
      for (const resource in this.resources.current) {
        CookieUtility.saveCookie('resources.current.' + resource, this.resources.current[resource]);
      }
    } else {
      this.audio.playSound('no');
    }
  }

  buildingClick(building) {
    if (this.canPay(building.cost)) {
      this.audio.playSound('yes');
      this.pay(building.cost);
      this.buildings[building.id]++;
      CookieUtility.saveCookie('buildings.' + building.id, this.buildings[building.id]);
      for (const resource in this.resources.current) {
        CookieUtility.saveCookie('resources.current.' + resource, this.resources.current[resource]);
      }
      building.production.updateNextCost();
    } else {
      this.audio.playSound('no');
    }
  }

  activateUpgrade(upgrade, loaded = true) {
    if (this.shownUpgrades.includes(upgrade.id)) {
      this.shownUpgrades = this.shownUpgrades.filter((id) => id !== upgrade.id);
      this.upgradeChanges = true;
    } else if (this.openUpgrades.includes(upgrade.id)) {
      this.openUpgrades = this.openUpgrades.filter((id) => id !== upgrade.id);
    }
    for (const effect in upgrade.effect) {
      switch (effect.toLowerCase()) {
        case 'build':
          if (loaded) break; // the additional buildings are saved seperately below
          for (const build in upgrade.effect.build) {
            if (this.buildings[build] === undefined) {
              throw new Error("Unknown building '" + build + "' in effect of upgrade nr " + upgrade.id);
            }
            if (this.buildings[build] === 0 && upgrade.effect.build[build] > 0) {
              this.buildings[build] += upgrade.effect.build[build];
              this.session.world.drawWorld(this);
            } else {
              this.buildings[build] += upgrade.effect.build[build];
            }
            CookieUtility.saveCookie('buildings.' + build, this.buildings[build]);
          }
          break;

        case 'multiplier':
          for (const what in upgrade.effect.multiplier) {
            if (this.buildings[what] !== undefined) {
              // multiply building production
              this.buildingsData[what].production.multiply(upgrade.effect.multiplier[what]);
            } else if (this.sourcesData[what] !== undefined) {
              // It's a source, hence multiply clicking gains
              this.sourcesData[what].multiplier *= upgrade.effect.multiplier[what];
            } else {
              throw new Error("Failed to multiply '" + what + "'   ... what do you mean?");
            }
          }
          break;

        case 'game':
          for (const variable in upgrade.effect.game) {
            this[variable] = upgrade.effect.game[variable];
          }
          break;
      }
    }
    this.activeUpgrades.push(upgrade.id);
  }

  canPay(cost) {
    for (const resource in cost) {
      if (cost[resource] > this.resources.current[resource]) return false;
    }
    return true;
  }

  pay(cost) {
    for (const resource in cost) {
      this.resources.current[resource] -= cost[resource];
    }
  }

  isReqMet(req) {
    for (const category in req.resources) {
      for (const resource in req.resources[category]) {
        if (
          !req.resources[category][resource] ||
          req.resources[category][resource] > this.resources[category][resource]
        ) {
          return false;
        }
      }
    }
    for (const update in req.updates) {
      if (!this.activeUpgrades.includes(req.updates[update])) return false;
    }
    for (const building in req.buildings) {
      if (this.buildings[building] < req.buildings[building]) return false;
    }
    return true;
  }

  loadQueryStringResources() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('wood')) {
      const count = parseInt(urlParams.get('wood'), 10);
      this.resources.current.wood += count;
      this.resources.gathered.wood += count;
      this.resources.produced.wood += count;
    }
    if (urlParams.has('coins')) {
      const count = parseInt(urlParams.get('coins'), 10);
      this.resources.current.coins += count;
      this.resources.gathered.coins += count;
      this.resources.produced.coins += count;
    }
    if (urlParams.has('stone')) {
      const count = parseInt(urlParams.get('stone'), 10);
      this.resources.current.stone += count;
      this.resources.gathered.stone += count;
      this.resources.produced.stone += count;
    }
  }
}

class Production {
  constructor(game, building) {
    this.game = game;
    this.building = building;
    this.key = Object.keys(building.production)[0];
    this.baseProduction = building.production[this.key];
    this.id = building.id;
    this.multiplier = 1;
  }

  updateNextCost() {
    const cost = {};
    for (const resource in this.building.baseCost) {
      cost[resource] = Math.floor(Math.pow(1.1, this.game.buildings[this.id]) * this.building.baseCost[resource]);
    }
    this.building.cost = cost;
  }

  multiply(multiplier) {
    this.multiplier *= multiplier;
  }

  calc() {
    return this.baseProduction * this.game.buildings[this.id] * this.multiplier;
  }

  calcSingle() {
    return this.baseProduction * this.multiplier;
  }
}

export default Clempire;
