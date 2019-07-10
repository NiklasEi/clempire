import CookieUtility from "./cookies.js"
import Alert from "./alert.js"
import Particles from "./particles.js"
import AudioPlayer from "./audio.js"

class Clempire {
  constructor(session) {
    this.session = session;
    this.audio = new AudioPlayer();
    let particlesCanvas = document.getElementById("particles");
    this.particles = new Particles(particlesCanvas)
    this.shownUpgrades = [];
    this.autoSaveIntervall = 1 * 60 * 1000; // autosave every minute
    this.gameIntervall = 1000; // autosave every minute
    this.load = new Promise(function (resolve, reject) {
      let now = (new Date).getTime();
      console.log("Loading data ...");
      this.loadData().catch(e => reject(e)).then(function () {
        this.prepare()
        this.autoSaveId = setInterval(this.autoSave.bind(this), this.autoSaveIntervall);
        this.gameIntervallId = setInterval(this.gameTick.bind(this), this.gameIntervall);
        this.testingStuff(); // ToDo: remove!! it's dev stuff
        console.log(`... done in ${((new Date()).getTime() - now)}ms`);
        resolve()
      }.bind(this));
    }.bind(this));
  }

  gameTick() {
    this.checkRequirements();
    this.produce();
  }

  produce() {
    for (let building in this.buildingsData) {
      if (this.buildingsData[building].production === undefined) continue;
      let produceCount = this.buildingsData[building].production.calc();
      let productionKey = this.buildingsData[building].production.key; // e.g. "wood"
      let img = this.session.game.resourcesData[productionKey].img;
      if (!isNaN(produceCount) && produceCount > 0) {
        this.particles.spawn(img, this.buildingsData[building].x, this.buildingsData[building].y, "+ " + produceCount, 4000);
        this.session.game.resources.current[productionKey] += produceCount;
        this.session.game.resources.produced[productionKey] += produceCount;
      }
    }
  }

  checkRequirements() {
    let newUpgrades = this.openUpgrades.filter(id => this.isReqMet(this.upgradeData[id].requirement));
    if (newUpgrades.length > 0) {
      this.shownUpgrades = this.shownUpgrades.concat(newUpgrades);
      // ToDo sort shownUpgrades. By total price?
      this.openUpgrades = this.openUpgrades.filter(id => !newUpgrades.includes(id))
      this.upgradeChanges = true; // set flag to render upgrades new
    }
  }

  autoSave() {
    for (let type in this.resources) {
      for (let resource in this.resources[type]) {
        CookieUtility.saveCookie("resources." + type + "." + resource, this.resources[type][resource])
      }
    }
    for (let building in this.buildings) {
      CookieUtility.saveCookie("buildings." + building, this.buildings[building])
    }
    CookieUtility.saveCookie("upgrades", this.activeUpgrades.join(","))
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
    let fromSave = CookieUtility.getCookie("upgrades");
    this.activeUpgrades = (fromSave && !isNaN(parseInt(fromSave))) ? fromSave.split(",").map(id => parseInt(id)) : [];
    for (let upgrade in this.upgradeData) {
      if (this.activeUpgrades.includes(parseInt(upgrade))) {
        this.activateUpgrade(this.upgradeData[upgrade]);
        continue;
      }
      this.openUpgrades.push(parseInt(upgrade));
    }
  }

  prepareResources() {
    this.resources = {
      produced: {},
      gathered: {},
      current: {}
    };
    for (let type in this.resources) {
      for (let resource in this.resourcesData) {
        let fromSave = CookieUtility.getCookie("resources." + type + "." + resource)
        this.resources[type][resource] = (fromSave && fromSave > 0) ? parseInt(fromSave) : 0;
      }
    }
  }

  prepareBuildings() {
    this.buildings = {};
    for (let building in this.buildingsData) {
      this.buildingsData[building].id = building;
      let fromSave = CookieUtility.getCookie("buildings." + building)
      this.buildings[building] = (fromSave && fromSave > 0) ? parseInt(fromSave) : 0;
      if (this.buildingsData[building].production) this.buildingsData[building].production = new Production(this, this.buildingsData[building]);
    }
  }

  async loadData() {
    let loadingResources = fetch("assets/data/resources.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    let loadingBuildings = fetch("assets/data/buildings.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    let loadingSources = fetch("assets/data/sources.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    let loadingUpgrades = fetch("assets/data/upgrades.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    [
      this.resourcesData,
      this.buildingsData,
      this.sourcesData,
      this.upgradeData
    ] = await Promise.all([
      loadingResources,
      loadingBuildings,
      loadingSources,
      loadingUpgrades
    ]);
    for (let source in this.sourcesData) {
      this.sourcesData[source].id = source;
      this.sourcesData[source].multiplier = 1;
      this.audio.addSound(this.sourcesData[source].id, this.sourcesData[source].sound);
    }
    let loadingIcons = [];
    for (let resource in this.resourcesData) {
      this.resourcesData[resource].id = resource;
      this.resourcesData[resource].img = this.loadImage(this.resourcesData[resource].icon).then(response => response)
      loadingIcons.push(this.resourcesData[resource].img);
    }
    loadingIcons = await Promise.all(loadingIcons);
    let i = 0;
    for (let resource in this.resourcesData) {
      this.resourcesData[resource].img = loadingIcons[i];
      i++;
    }
    // put IDs also into the upgrade obj
    for (let upgradeId in this.upgradeData) {
      this.upgradeData[upgradeId].id = parseInt(upgradeId);
    }
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

  resourceFieldClick() {
    // called for a click on a resource field.
    // this is bound to {session: session, source: clickedSource}
    let count = this.session.game.sourcesData[this.source.id].multiplier;
    this.session.game.resources.current[this.source.id] += count;
    this.session.game.resources.gathered[this.source.id] += count;
    this.session.game.audio.playSound(this.source.id);
    let img = this.session.game.resourcesData[this.source.id].img;
    this.session.game.particles.spawn(img, this.coordinates[0], this.coordinates[1], "+ " + count, 4000);
  }

  upgradeClick() {
    // called for a click on an upgrade
    // this is bound to {session: session, upgrade: upgrade}
    if (this.session.game.canPay(this.upgrade.cost)) {
      this.session.game.pay(this.upgrade.cost)
      // flag loaded=false in order to also gain buildings from upgrades and other stuff that is additionally saved/loaded
      this.session.game.activateUpgrade(this.upgrade, false);
    }
  }

  activateUpgrade(upgrade, loaded = true) {
    if (this.shownUpgrades.includes(upgrade.id)) {
      this.shownUpgrades = this.shownUpgrades.filter(id => id !== upgrade.id);
      this.upgradeChanges = true;
    } else if (this.openUpgrades.includes(upgrade.id)) {
      this.openUpgrades = this.openUpgrades.filter(id => id !== upgrade.id);
    }
    for (let effect in upgrade.effect) {
      switch (effect.toLowerCase()) {
        case "build":
          if (loaded) break;
          for (let build in upgrade.effect.build) {
            if (this.buildings[build] === undefined) {
              throw new Error("Unknown building '" + build + "' in effect of upgrade nr " + upgrade.id)
            }
            if (this.buildings[build] === 0 && upgrade.effect.build[build] > 0) {
              this.buildings[build] += upgrade.effect.build[build];
              this.session.world.drawWorld(this);
            } else {
              this.buildings[build] += upgrade.effect.build[build];
            }
          }
          break;

        case "multiplier":
          for (let what in upgrade.effect.multiplier) {
            if (this.buildings[what] !== undefined) {
              // multiply building production
              this.buildingsData[what].production.multiply(upgrade.effect.multiplier[what]);
            } else if (this.sourcesData[what] !== undefined) {
              // It's a source, hence multiply clicking gains
              this.sourcesData[what].multiplier *= upgrade.effect.multiplier[what];
            } else {
              throw new Error("Failed to multiply '" + what + "'   ... what do you mean?")
            }
          }
          break;
      }
    }
    this.activeUpgrades.push(upgrade.id);
  }

  canPay(cost) {
    for (let resource in cost) {
      if (cost[resource] > this.resources.current[resource]) return false;
    }
    return true;
  }

  pay(cost) {
    for (let resource in cost) {
      this.resources.current[resource] -= cost[resource];
    }
  }

  isReqMet(req) {
    for (let category in req.resources) {
      for (let resource in req.resources[category]) {
        if (!req.resources[category][resource] || req.resources[category][resource] > this.resources[category][resource]) {
          return false;
        }
      }
    }
    for (let update in req.updates) {
      if (!this.activeUpgrades.includes(req.updates[update])) return false;
    }
    return true;
  }

  testingStuff() {
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("wood")) {
      let count = parseInt(urlParams.get("wood"));
      this.resources.current.wood += count;
      this.resources.gathered.wood += count;
      this.resources.produced.wood += count;
    }
    if (urlParams.has("coins")) {
      let count = parseInt(urlParams.get("coins"));
      this.resources.current.coins += count;
      this.resources.gathered.coins += count;
      this.resources.produced.coins += count;
    }
    if (urlParams.has("stone")) {
      let count = parseInt(urlParams.get("stone"));
      this.resources.current.stone += count;
      this.resources.gathered.stone += count;
      this.resources.produced.stone += count;
    }
  }
}

class Production {
  constructor(game, building) {
    this.key = Object.keys(building.production)[0];
    this.baseProduction = building.production[this.key];
    this.id = building.id;
    this.multiplier = 1;
    this.game = game;
  }

  multiply(multiplier) {
    this.multiplier *= multiplier;
  }

  calc() {
    return this.baseProduction * this.game.buildings[this.id] * this.multiplier;
  }
}

export default Clempire;