function bargraph(dataset) {

console.log(document.getElementById('bar').innerHTML);
var w = 3*(window.innerWidth)/4;
var h = 180;
var labels = ['green', 'red', 'grey'];
var sum = (dataset[0]+dataset[1]+dataset[2]);
var svg = d3.select("#bar")
            .append("svg")
            .attr("height", (3*h)/4)
            .attr("width", w)
            .style("padding-top", 30);

var bars = svg.selectAll("rect")
                .data(dataset)
                .enter()
                .append('rect')
                .attr("x",0)
                .attr("y", function(d, i){
                                return i *30;
                            })
                .attr("width", function(d){
                                    //return (d/sum)*w;
                                    return 3;
                                })
                .attr("height", function(d){
                                    return 20;
                                })
                .attr("fill", function (d, i) {
                      return labels[i];
                });

    d3.select('#bar').select('svg')
        .selectAll('rect')
        .transition()
        .duration(1000)
        .delay(100)
        .attr("width", function(d) {
            return (d/sum)*w;
        });
    // var i =0;
    // d3.select('#bar').select('svg')
    //     .selectAll('rect')
    //     .selectAll('text')
    //     .data(labels)
    //     .enter()
    //     .append('text')
    //     .attr('x', 0)
    //     .attr('y', function(d, i){
    //         return i*30;
    //     })
    //     .text(function(d, i){
    //         return '(0'+','+i*30+')';
    //     });
        

}

function analyze() {
    var fetch_id = document.getElementById("se").value;
        document.getElementById('bar').innerHTML='<div></div>';
    $.ajax({
        url: '/classify',
        type: 'POST',
        data: {
            "se": fetch_id
        },
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {

            dts = []
            for (var x in result) {
                console.log(result[x])
                dts = result[x];
            }
            console.log(k = dts);
            var data = [];
            var sum = dts[0] + dts[1] + dts[2];
            data[0] = ((dts[0] * 1.0) / sum) * 100.0;
            data[1] = ((dts[1] * 1.0) / sum) * 100.0;
            data[2] = ((dts[2] * 1.0) / sum) * 100.0;

            bargraph(data);
        },
        error: function(result) {
            console.log(result);
        }
    });
}

function search() {
    var fetch_id = document.getElementById("se").value;
    document.getElementById("wordCloud").innerHTML = "<div></div>";
       document.getElementById('bar').innerHTML='<div></div>';

    $.ajax({
        url : '/search',
        type: 'POST',
        data: {
            "se": fetch_id
        },
        contentType: 'application/json;charset=UTF-8',
        success: function(result) {
            var frequency_list = result['data'];
            var max = frequency_list[0]['count'];
            var min = frequency_list[frequency_list.length - 1]['count'];
            var factor = 50 / (max - min);
            var factor1 = 75 / (max - min);
            console.log(max, min);
            var color = d3.scale.category20();
            d3.layout.cloud().size([1000, 300])
                .words(frequency_list)
                .padding(1)
                .rotate(function() {
                    return (Math.random()) * 120 - 60;
                })
                .text(function(d) {
                    return d.word;
                })
                .font("Impact")
                .fontSize(function(d) {
                    return 15 + (d.count) * factor1;
                })
                .on("end", draw)
                .start();

            function draw(words) {
                d3.select("#wordCloud").append("svg")
                    .attr("width", 1000)
                    .attr("height", 500)
                    .attr("class", "wordcloud")
                    .append("g")
                    .attr("transform", "translate(320,200)")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function(d) {
                        return d.size + "px";
                    })
                    .style("fill", function(d, i) {
                        return color(i);
                    })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "translate(" + [200 + d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) {
                        return d.word;
                    });

            }

        },
        error: function(result) {
            console.log(result);
        }
    });
}