import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()

Stimulus.register("map", class extends Controller {
  static targets = [ "canvas" ]

  initialize() {
  }

  connect() {
    this.loadData();
  }

  loadData() {
    fetch('https://collective.startupdays.ch/wp-json/sud/v1/partner')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.renderMap(data);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }

  renderMap(data) {
    var nodes = [];

    data.forEach(function(item, index) {
      nodes.push({ id: item.id, name: item.company, group: "Education", description: item.description, website: item.website,  logo: item.logo });
    });

    // Links dataset
    const links = [
        { source: 'ElleXX', target: 'Swiss Startup Association' },
        { source: 'ElleXX', target: 'Mampreneurs' },
    ];

    const groupCenters = {
      'Education': { x: 500, y: 200 },
      'Community': { x: 400, y: 400 },
      'Funding': { x: 500, y: 500 },
      'Research': { x: 700, y: 200 },
      // ... other groups
    };

    const width = 800;
    const height = 800;

    let simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("collide", d3.forceCollide(80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("group", groupForce);

    const svg = d3.select("#d3map").append("svg").attr("width", width).attr("height", height);

    // // Create the links
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line");

    // Create the nodes
    const node = svg.append("g")
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

    node.append("title")
    .text(d => d.name + ": " + d.description); // The text displayed in the tooltip

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

    // Define drag behavior
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Update positions each tick
    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node
          .attr("x", d => d.x - 170)
          .attr("y", d => d.y - 170);
    });

    function groupForce(alpha) {
      for (let node of nodes) {
        let center = groupCenters[node.group];
        node.vx += (center.x - node.x) * alpha;
        node.vy += (center.y - node.y) * alpha;
      }
    }

  }

})
