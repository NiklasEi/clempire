import CookieUtility from "./cookies.js"
import Alert from "./alert.js"
import Particles from "./particles.js"
import AudioPlayer from "./audio.js"

class Clempire {
  constructor() {
    this.audio = new AudioPlayer();
    let particlesCanvas = document.getElementById("particles");
    this.particles = new Particles(particlesCanvas)
    this.load = new Promise(function (resolve, reject) {
      let now = (new Date).getTime();
      console.log("Loading data ...");
      this.loadData().catch(e => reject(e)).then(function () {
        this.prepare()
        console.log(`... done in ${((new Date()).getTime() - now)}ms`);
        resolve()
      }.bind(this));
    }.bind(this));
    this.autoSaveIntervall = 120000;
    this.autoSaveId = setInterval(this.autoSave.bind(this), this.autoSaveIntervall);
  }

  autoSave() {
    for (let type in this.resources) {
      for (let resource in this.resources[type]) {
        CookieUtility.saveCookie("resources." + type + "." + resource, this.resources[type][resource])
      }
    }
    Alert.autoSave();
  }

  prepare() {
    this.prepareResources();
    this.prepareBuildings();
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
      this.buildings[this.buildingsData[building].id] = 0;
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

  buildingClick() {
    // called for a click on a resource field.
    // this is bound to {session: session, building: clickedBuilding}
    this.session.game.buildings[this.building.id] ++;
  }

  isReqMet(req) {
    for (let category in req.resources) {
      for (let resource in this.resourcesData) {
        if (!req.resources[category][resource] || req.resources[category][resource] > this.resources[category][resource]) {
          return false;
        }
      }
    }
    return true;
  }
}

class Requirement {
  constructor() {
    this.resources = {
      produced: {},
      gathered: {},
      total: {}
    }
  }
}

export {Clempire, Requirement};
