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
    this.checkRequirementsIntervall = 1000; // autosave every minute
    this.load = new Promise(function (resolve, reject) {
      let now = (new Date).getTime();
      console.log("Loading data ...");
      this.loadData().catch(e => reject(e)).then(function () {
        this.prepare()
        this.autoSaveId = setInterval(this.autoSave.bind(this), this.autoSaveIntervall);
        this.checkRequirementsId = setInterval(this.checkRequirements.bind(this), this.checkRequirementsIntervall);
        console.log(`... done in ${((new Date()).getTime() - now)}ms`);
        resolve()
      }.bind(this));
    }.bind(this));
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
    console.log("active upgrades: " + this.activeUpgrades.join(","))
    for (let upgrade in this.upgradeData) {
      if (this.activeUpgrades.includes(parseInt(upgrade))) continue;
      this.openUpgrades.push(upgrade);
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
      this.buildingsData[building].production = new Production(this, this.buildingsData[building]);
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
      this.audio.addSound(this.sourcesData[source].id, this.sourcesData[source].sound);
    }
    let loadingIcons = [];
    for (let resource in this.resourcesData) {
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
    for(let upgradeId in this.upgradeData) {
      this.upgradeData[upgradeId].id = upgradeId;
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
    let count = 1;
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
      this.session.game.activateUpgrade(this.upgrade)
    }
  }

  activateUpgrade(upgrade) {
    if(this.shownUpgrades.includes(upgrade.id)) {
      this.shownUpgrades = this.shownUpgrades.filter(id => id !== upgrade.id);
      this.upgradeChanges = true;
    } else if (this.openUpgrades.includes(upgrade.id)) {
      this.openUpgrades = this.openUpgrades.filter(id => id !== upgrade.id);
    }
    for (let effect in upgrade.effect) {
      switch(effect.toLowerCase()) {
        case "build":
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
      }
    }
    this.activeUpgrades.push(upgrade.id);
  }

  canPay(cost) {
    for(let resource in cost) {
      if (cost[resource] > this.resources.current[resource]) return false;
    }
    return true;
  }

  pay(cost) {
    for(let resource in cost) {
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
    return true;
  }
}

class Production {
  constructor(game, building) {
    this.baseProduction = building.production;
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
