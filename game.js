class Clempire {
  constructor() {
    this.load = new Promise(function (resolve, reject) {
      let now = (new Date).getTime();
      this.loadData().then(function () {
        this.resources = {};
        for (let resource in this.resourcesData) {
          this.resources[resource] = 0;
        }
        console.log(this.now)
        console.log(new Date())
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
      this.sourcesData[source].audio = new Audio(this.sourcesData[source].sound);
      this.sourcesData[source].audio.load();
    }
  }

  fieldClick() {
    // called for a click on a resource field.
    // this is binded to the clicked resource object
    session.game.resources[this.id]++;
    this.audio.load();
    this.audio.play();
  }
}