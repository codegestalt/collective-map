import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class CollectiveMap {

  constructor(htmlElement) {
    this.container = htmlElement;
    this.map = d3.select(this.container).append("svg");
    this.setCanvasSize();
  }

  setCanvasSize() {
    var container = d3.select(this.container);
    this.width = container.node().clientWidth;
    this.height = container.node().clientHeight;
    this.map
      .attr("width", this.width)
      .attr("height", this.height)
  }

  fetchData() {
    fetch('https://collective.startupdays.ch/wp-json/sud/v1/partner')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.data = data;
        this.initializeMap(data);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }

  initializeMap(data) {
    var nodes = [];

    data.forEach(function(item, index) {
      let groups = [];
      if (item.terms && item.terms.ressources && item.terms.ressources.length > 0) {
        groups = item.terms.ressources.map(ressource => ressource.slug);
      }
      nodes.push({id: item.id, name: item.company, groups: groups, description: item.description, website: item.website, logo: item.logo});
    });

    // NOTE: Uncomment to list all dataset groups in console
    // this.listDatasetGroups(data);

    let imageWidth = 100;
    let imageHeight = 100;

    let collisionRadius = Math.sqrt(Math.pow(imageWidth / 2, 2) + Math.pow(imageHeight / 2, 2));

    let simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-40))
        .force("collide", d3.forceCollide(collisionRadius)) // Update this line
        .force("center", d3.forceCenter(this.width / 2, this.height / 2));

    simulation.on("tick", () => {
      node
          .attr("x", d => d.x - 170)
          .attr("y", d => d.y - 170);
    });

    var node = this.map.append("g")
        .attr("class", "nodes")
        .selectAll("image")
        .data(nodes)
        .enter().append("image")
            .attr("xlink:href", d => d.logo)
            .attr("height", 150)
            .attr("width", 150)
            .attr("data-target", "map.nodes")
            .on("click", (event, d) => {
              event.stopPropagation();
              var container = this.container;
              var tooltip = container.querySelector('[data-target="tooltip"]')

              tooltip.style.removeProperty("display");
              tooltip.style.left = (event.pageX + 10 + "px")
              tooltip.style.top = (event.pageY + 10 + "px")
              tooltip.querySelector('[data-target="name"]').textContent = d.name
              tooltip.querySelector('[data-target="description"]').textContent = d.description
              tooltip.querySelector('[data-target="link"]').href = d.website
            });

    document.addEventListener('click', () => {
      var tooltip = this.container.querySelector('[data-target="tooltip"]');
      tooltip.style.display = 'none';
    });

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        this.map.selectAll('g').attr('transform', event.transform);
      });
    this.map.call(zoom);
  }

  filterAndRedraw(filter) {
    var filteredData = this.data.filter(item =>
      item.terms &&
      item.terms.ressources &&
      item.terms.ressources.some(ressource => ressource.slug === filter)
    );

    this.map.selectAll('.nodes').remove();

    this.initializeMap(filteredData);
  }

  filterAndScale(filter) {
    // TODO: Implement like filterAndRedraw but resize the nodes instead of removing them
  }

  listDatasetGroups(data) {
    let allGroupsSet = new Set();
    data.forEach(function(item) {
      if (item.terms && item.terms.ressources && item.terms.ressources.length > 0) {
        item.terms.ressources.forEach(ressource => allGroupsSet.add(ressource.slug));
      }
    });
    let allGroups = Array.from(allGroupsSet);
    console.log(allGroups);
  }
}
