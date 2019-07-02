class Clempire {
  constructor() {
    this.load = new Promise(function (resolve, reject) {
      let now = new Date();
      console.log("Loading data...");
      this.loadData().then(function () {
        this.resources = {};
        for (let resource in this.resourcesData) {
          this.resources[resource] = 0;
        }
        console.log(`... done in ${(new Date()).getMilliseconds() - now.getMilliseconds()}ms`);
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
    [this.resourcesData, this.buildingsData] = await Promise.all([loadingResources, loadingBuildings]);
    this.sourcesData = {
      wood: {
        img: "/assets/images/Tree.png",
        sound: "/assets/sounds/axe-sound.ogg",
        id: "wood"
      }
    }
    for (let source in this.sourcesData) {
      this.sourcesData[source].audio = new Audio(this.sourcesData[source].sound);
      this.sourcesData[source].audio.load();
    }
  }

  fieldClick() {
    // called for a click on a resource field.
    // this is binded to the clicked resource object
    session.game.resources[this.id] ++;
    this.audio.currentTime = 0;
    this.audio.play();
  }
}