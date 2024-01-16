import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
import { CollectiveMap } from "./collective_map.js"

window.Stimulus = Application.start()

Stimulus.register("map", class extends Controller {
  static targets = [ "mapContainer", "nodes" ]

  connect() {
    this.map = new CollectiveMap(this.mapContainerTarget);
    this.map.fetchData();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  disconnect() {
    window.removeEventListener('resize', this.onResize);
  }

  filterMap() {
    var filter = event.target.value;
    this.map.redraw(filter === "everything" ? undefined : filter);
  }

  onResize() {
    this.map.setCanvasSize();
  }
})
