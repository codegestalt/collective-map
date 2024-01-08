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
    fetch('https://collective.startupdays.ch/wp-json/wp/v2/partner/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Handle the response data
        this.renderMap(data);
      })
      .catch(error => {
        // Handle any errors
        console.error('There has been a problem with your fetch operation:', error);
      });
  }

  renderMap(data) {
    var nodes = [];
    // PARTNER: https://collective.startupdays.ch/wp-json/wp/v2/partner/
    // CATEGORY FILTER: ?bezeichung+ID : https://collective.startupdays.ch/wp-json/wp/v2/partner/?ressources=7
    // CATEGORY IFNOS: https://collective.startupdays.ch/wp-json/wp/v2/ressources/
    data.forEach(function(item, index) {
      nodes.push({ id: item.id, name: item.acf.company, group: "Education", description: item.acf.description, link: item.link,  logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/elleXX_Logo_210526.png" });
    });

    // nodes = [
    //     { name: 'ElleXX', group: 'Education', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/elleXX_Logo_210526.png", description: "elleXX is a whole new ecosystem for women’s financial lives. We combine the imparting of financial knowledge specifically for women with female-friendly and digital financial products ranging from investment products, insurance products to wealth management services." },
    //     { name: 'Swiss Startup Association', group: 'Community', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/Logo-Swiss-Startup-Association.png", description: "Improving the conditions for Swiss startups on a political and educational level and providing them with the necessary viability. Offering many membership benefits, such as a startup desk, networking and events and more. Promoting female founders with events and by promoting already existing organizations." },
    //     { name: 'Mampreneurs', group: 'Education', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/03/LogoMampreneurs_65x20.jpg", description: "We support women who have made the choice to be entrepreneurs and mothers and we offer them a caring environment for growth. Realizing one's potential is a bold choice that should be within everyone's reach. Sharing this path with our peers allows us to go further. This is the vision that guides the mompreneures" },
    //     { name: 'SWISSFINTECHLADIES', group: 'Funding', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/SFTL_squared.png", description: "No description..." },
    //     { name: 'Sandborn', group: 'Funding', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/SANDBORNLOGOBLACK-03.webp", description: "Hatching ideas into companies by providing guidance, investment and deep operational support. Aiming to address gender bias in venture capital decisions and promoting more diversity in the Swiss start-up scene, by developing solutions & cooperations between (corporate) investors, entrepreneurship experts & facilitators and female founders." },
    //     { name: 'BFH', group: 'Research', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/Logo_BFH@3x.png", description: "Promoting entrepreneurial thinking and acting is a strategic priority. Increasing the diversity of founders helps to achieve a greater impact in society. Bern University of a Applied Sciences (BFH) conducts research on this topic and the Entrepreneurship Office BFH supports initiatives that contribute to this goal." },
    //     { name: 'FE+MALE TTHINK TANK', group: 'Research', logo: "https://collective.startupdays.ch/wp-content/uploads/2023/02/FeMale-Logo-1-1.png", description: "FE+MALE Think Tank is a nonprofit organization sited in Zürich. With a strong data-driven approach, the Think Tank engages stakeholders to explore unexplored angles to propose alternative solutions to leaders and decision-makers for the benefit of female entrepreneurs. We transfer knowledge into tangible solutions in a way that can be understood by a wide audience. Current projects: INNOVA, The Inclusive Way Initiative (TIWI) sponsored by the Bern Economic Development Agency, and The Beat Funding Bias Initiative (BFBI) sponsored by Gebert Rüf Stiftung" }
    // ];

    console.log(nodes);

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
