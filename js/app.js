import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
import { CollectiveMap } from "./collective_map.js"

window.Stimulus = Application.start()

Stimulus.register("map", class extends Controller {
  static targets = [ "mapContainer", "nodes" ]

  initialize() {
  }

  connect() {
    this.map = new CollectiveMap(this.mapContainerTarget);
    this.map.fetchData();
  }

  filterMap() {
    var filter = event.target.value;
    this.map.filterAndScale(filter);
  }
})
