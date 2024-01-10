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
        this.updateMap(data);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }

  updateMap(data) {
    var nodes = [];

    data.forEach(function(item, index) {
      nodes.push({ id: item.id, name: item.company, group: "Education", description: item.description, website: item.website,  logo: item.logo });
    });

    let simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("collide", d3.forceCollide(80))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("group", groupForce);

    var node = this.map.append("g")
        .attr("class", "nodes")
        .selectAll("image")
        .data(nodes)
        .enter().append("image")
            .attr("xlink:href", d => d.logo)
            .attr("height", 140)
            .attr("width", 140)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

    let groupBoundingBoxes = {};
    nodes.forEach(d => {
      if (!groupBoundingBoxes[d.group]) {
        groupBoundingBoxes[d.group] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
      }
      groupBoundingBoxes[d.group].minX = Math.min(groupBoundingBoxes[d.group].minX, d.x);
      groupBoundingBoxes[d.group].minY = Math.min(groupBoundingBoxes[d.group].minY, d.y);
      groupBoundingBoxes[d.group].maxX = Math.max(groupBoundingBoxes[d.group].maxX, d.x);
      groupBoundingBoxes[d.group].maxY = Math.max(groupBoundingBoxes[d.group].maxY, d.y);
    });

    simulation.on("tick", () => {
      node
          .attr("x", d => d.x - 170)
          .attr("y", d => d.y - 170);
    });

    var groupCenters = {
      'Education': { x: 500, y: 200 },
      'Community': { x: 400, y: 400 },
      'Funding': { x: 500, y: 500 },
      'Research': { x: 700, y: 200 },
      // ... other groups
    };

    function groupForce(alpha) {
      for (let node of nodes) {
        let center = groupCenters[node.group];
        node.vx += (center.x - node.x) * alpha;
        node.vy += (center.y - node.y) * alpha;
      }
    }

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
  }
}
