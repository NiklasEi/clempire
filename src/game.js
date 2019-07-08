import CookieUtility from "./cookies.js"
import Alert from "./alert.js"
import AudioPlayer from "./audio.js"

class Clempire {
  constructor() {
    this.audio = new AudioPlayer();
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
        this.resources[type][resource] = (fromSave && fromSave > 0) ? fromSave : 0;
      }
    }
  }

  prepareBuildings() {
    this.buildings = {};
    for (let building in this.buildingsData) {
      this.buildings[this.buildingsData[building]]
    }
  }

  async loadData() {
    let loadingResources = fetch("/assets/data/resources.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    let loadingBuildings = fetch("/assets/data/buildings.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    let loadingSources = fetch("/assets/data/sources.json")
      .catch(e => console.log(e))
      .then(response => response.json());
    let loadingUpgrades = fetch("/assets/data/upgrades.json")
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
  }

  resourceFieldClick() {
    // called for a click on a resource field.
    // this is bound to {session: session, source: clickedSource}
    this.session.game.resources.current[this.source.id]++;
    this.session.game.resources.gathered[this.source.id]++;
    this.session.game.audio.playSound(this.source.id);
  }

  buildingClick() {
    // called for a click on a resource field.
    // this is bound to {session: session, building: clickedBuilding}
    this.session.game.resources.current[this.source.id]++;
    this.session.game.resources.gathered[this.source.id]++;
    this.session.game.audio.playSound(this.source.id);
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
