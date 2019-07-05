import ('./app.js')
console.log("loading game")

class Clempire {
  constructor(session) {
    this.audio = new AudioPlayer();
    this.load = new Promise(function (resolve, reject) {
      let now = (new Date).getTime();
      console.log("Loading data ...");
      this.loadData().then(function () {
        this.resources = {
          produced: {},
          gathered: {},
          current: {}
        };
        for (let type in this.resources) {
          for (let resource in this.resourcesData) {
            this.resources[type][resource] = 0;
          }
        }
        console.log(`... done in ${((new Date()).getTime() - now)}ms`);
        resolve()
      }.bind(this));
    }.bind(this));
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
    [this.resourcesData, this.buildingsData, this.sourcesData] = await Promise.all([loadingResources, loadingBuildings, loadingSources]);
    for (let source in this.sourcesData) {
      this.audio.addSound(this.sourcesData[source].id, this.sourcesData[source].sound);
    }
  }

  fieldClick() {
    // called for a click on a resource field.
    // this is binded to the clicked resource object
    session.game.resources.current[this.id]++;
    session.game.resources.gathered[this.id]++;
    session.game.audio.playSound(this.id);
  }

  isReqMet(req) {
    for (let category in req.resources) {
      for (let resource in this.resourcesData) {
        if(!req.resources[category][resource] || req.resources[category][resource] > this.resources[category][resource]) {
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

module.exports = {
  Clempire,
  Requirement
};