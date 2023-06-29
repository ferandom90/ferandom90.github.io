// intialize global maps  to storage the individual data and individual samples

let individuals = new Map(), individuals_samples = new Map();


// obtain individual data from url

const get_individuals_data = () =>{
    return new Promise((resolve,reject)=>{

        const request = new XMLHttpRequest();
        request.onreadystatechange = function(){
    
         if(this.readyState){
    
            const data = JSON.parse(request.responseText);
            for(let i=0; i<10; i++){
                individuals.set(data.metadata[i].id,data.metadata[i]);
                individuals_samples.set(data.samples[i].id,data.samples[i]);
            }
          //console.log(individuals)
          //console.log(individuals_samples);
            resolve(individuals);
         }
         reject(individuals)
        };
        request.open("GET","https://2u-data-curriculum-team.s3.amazonaws.com/dataviz-classroom/v1.1/14-Interactive-Web-Visualizations/02-Homework/samples.json",true)
        request.send()
    });
}

// prepopulate select element options on load

window.addEventListener("load", async()=>{

    const dropdown = document.getElementById("selDataset");
    individuals  = await get_individuals_data();

    for(let key of individuals.keys()){
        const option = document.createElement("option");
        option.value= key
        option.text = key
        dropdown.appendChild(option)
    }
    optionChanged(dropdown.value)

})


// perform the update of plots and demographic info

const optionChanged = (value) => {
   
  const id = parseInt(value,10);

  // show the demographic_information
  show_demographic_info(id);

  // show the plot bar chart
  plot_bar_chart(id.toString());

  // show the bubble chart
  plot_bubble_chart(id.toString());

}


// show demographic info

function show_demographic_info(id){

  // clean the div panel_body elements
  document.getElementById("sample-metadata").innerHTML ="";

    // reference the panel_body to append the data
    const panel_body = document.getElementById("sample-metadata");

    // place the data from the individual
    panel_body.innerHTML = `<b><p class="panel_title">id: ${individuals.get(id).id}</p>`+
    `<p class="panel_title">ethnicity: ${individuals.get(id).ethnicity}</p>`+
    `<p class="panel_title">gender: ${individuals.get(id).gender}</p>`+
    `<p class="panel_title">age: ${individuals.get(id).age}</p>`+
    `<p class="panel_title">location: ${individuals.get(id).location}</p>`+
    `<p class="panel_title">bbtype: ${individuals.get(id).bbtype}</p>`+
    `<p class="panel_title">wfreq: ${individuals.get(id).wfreq}</p></b>`;
}


// plot bar chart
function plot_bar_chart(id){

    // clean bar chart svg
    document.getElementById("bar-chart").innerHTML="";

    // plot samples from the individual based on the id

    // Set up chart dimensions
    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 150 };

    // Create SVG container
    const svg = d3.select("#bar-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

    svg.style("cursor", "default");


    // get the top 10 sample values, otu ids and otu labels
    const sample_values = individuals_samples.get(id)["sample_values"].slice(0,10);
    const otu_ids = individuals_samples.get(id)["otu_ids"].slice(0,10).map(value=> "OTU "+value);
    const otu_labels =  individuals_samples.get(id)["otu_labels"].slice(0,10);

    // Create scales

    const xScale = d3.scaleLinear()
    .domain([0, d3.max(sample_values)])
    .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
    .domain(otu_ids)
    .range([margin.top, height-margin.bottom])
    .padding(0.2);


    // Create bars

    svg.selectAll("rect")
    .data(sample_values)
    .join("rect")
    .attr("x", xScale(0))
    .attr("y", (d, i) => yScale(otu_ids[i]))
    .attr("width", (d) => xScale(d) - xScale(0))
    .attr("height", yScale.bandwidth())
    .attr("fill", "steelblue");

    // Add axes
    const xAxis = d3.axisBottom(xScale).tickValues
    (d3.range(0,d3.max(sample_values), 50));

    const yAxis = d3.axisLeft(yScale);

    // place axis from x and y in their corresponding places 
    
    svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

    
    svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
     .call(yAxis);

    // Add X-axis gray grid lines
    svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale)
    .tickValues(d3.range(0, d3.max(sample_values), 50))
    .tickSizeInner(-(height - (margin.top + margin.bottom +8)))
    .tickFormat("")
    ) .selectAll(".tick line")
    .attr("stroke", "gray")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.5)
    .attr("shape-rendering", "crispEdges")
    .attr("pointer-events", "none");

    // Add otus labels when hover inside plot bars 

    const hoverlabel = svg.append("text")
    .attr("class","hover-label")
    .style("display","none");

    document.querySelectorAll("rect").forEach((rect,i)=>{
        rect.id = i;
    })

    svg.selectAll("rect")
    .on("mouseover",(rect)=>{
        const [x, y] = [rect.clientX - svg.node().getBoundingClientRect().left,rect.clientY -  svg.node().getBoundingClientRect().top];
        hoverlabel.attr("x", x)
        .attr("y", y)
        .text(otu_labels[rect.target.id]);
        hoverlabel.style("display","block");
    });

    document.getElementById("bar-chart").addEventListener("mouseleave",()=>{
        hoverlabel.style("display","none");
      });

}

// plot bubble chart
function plot_bubble_chart(id){

     // clean bar chart svg
    document.getElementById("bubble").innerHTML="";

    const margin = { top: 100, right: 200, bottom: 0, left: 10 };
    const width = 1300  - margin.left - margin.right;
    const height = 1000 - margin.top - margin.bottom;

    const svg = d3.select("#bubble")
    .append("svg")
    .attr("id","bubble-chart")
    .attr("width",width + margin.left + margin.right)
    .attr("height",height+margin.top + margin.bottom)
    .attr("transform","translate("+margin.left+","+margin.top+")")
    .append("g");


    svg.style("cursor", "default");

    // process each of the otu id and its position to construct an object having the otu_id
    // corresponding sample value and otu_label

    const data = individuals_samples.get(id)["otu_ids"].map((d,i)=>({
        otu_id: d,
        sample_value: individuals_samples.get(id)["sample_values"][i],
        otu_label: individuals_samples.get(id)["otu_labels"][i]
    }));

    const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.otu_id))
    .range([200, width]);

    const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.sample_value)])
    .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickValues
    (d3.range(0,d3.max(individuals_samples.get(id)["otu_ids"]), 500));

    const yAxis = d3.axisLeft(yScale).tickValues
    (d3.range(0,d3.max(individuals_samples.get(id)["sample_values"]), 50));

    svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + (margin.right-2) + ",0)")
    .call(yAxis);


   // Add otus labels when hover inside bubble chart

   var tooltip = d3.select("#bubble")
   .append("div")
     .style("opacity", 0)
     .attr("class", "tooltip")
     .style("background-color", "black")
     .style("border-radius", "5px")
     .style("padding", "10px")
     .style("color", "white")


  // add bubbles
  svg.selectAll(".bubble")
  .data(data)
  .enter()
  .append("circle")
  .attr("class", "bubble")
  .attr("cx", d => xScale(d.otu_id))
  .attr("cy", d => yScale(d.sample_value))
  .attr("r", d => d.sample_value)
  .attr("fill", d => "#"+d.otu_id)
  .attr("opacity", 0.8)
  .attr("data-value",d => d.otu_label)

  // show tooltip when circle is hovered

  svg.selectAll("circle").on("mouseover",(event)=>{
  const circle = d3.select(event.target);
  const circleX = +circle.attr("cx");
  const circleY = +circle.attr("cy");
  const tooltipWidth = +tooltip.style("width").replace("px", "");
  const tooltipHeight = +tooltip.style("height").replace("px", "");

  const tooltipX = (circleX - tooltipWidth / 2);
  const tooltipY = circleY - tooltipHeight / 2;

  tooltip
    .transition()
    .duration(200)
    .style("left", tooltipX + "px")
    .style("top", tooltipY + "px")
    .style("opacity", 1)
    .text(event.target.getAttribute("data-value"));
  }).on("mousemove",(event)=>{
    const circle = d3.select(event.target);
    const circleX = +circle.attr("cx");
    const circleY = +circle.attr("cy");
    const tooltipWidth = +tooltip.style("width").replace("px", "");
    const tooltipHeight = +tooltip.style("height").replace("px", "");
    const tooltipX = (circleX - tooltipWidth / 2) + 35;
    const tooltipY = circleY - tooltipHeight / 2;

  tooltip
    .transition()
    .duration(200)
    .style("left", tooltipX + "px")
    .style("top", tooltipY + "px")
    .style("opacity", 1)
    .text(event.target.getAttribute("data-value"));
  });

  document.getElementById("bubble").addEventListener("mouseleave",()=>{
    tooltip.style("opacity","0");
  });


}





