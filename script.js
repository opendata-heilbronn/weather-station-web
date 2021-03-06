var temperatureAveragingFactor = 50;

function temperatureStatistics() {

    var margin = {top: 20, right: 80, bottom: 30, left: 50},
        totalWidth = 960,
        totalHeight = 500,
        width = totalWidth - margin.left - margin.right,
        height = totalHeight - margin.top - margin.bottom;

//var parseDate = d3.time.format.utc().parse;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.temperature);
        });

    var svg = d3.select("#stats").append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("style", "max-width:100%")
        .attr("viewBox", "0,0," + totalWidth + "," + totalHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("http://api.grundid.de/sensor?sensorName=cowo.raum2.temperature,cowo.raum5.temperature,cowo.raum12.temperature,cowo.raum14.temperature&size=99999999&from=" + moment().subtract(7, 'days').format('x'), function (error, data) {
        if (error) throw error;

        var sensors = {};

        data.content.forEach(function (element) {
            sensors[element.sensorName] = true;
            element.date = new Date(element.date);
        });

        color.domain(d3.keys(sensors));

        var tempSensors = color.domain().map(function (name) {
            var values = [];

            data.content.forEach(function (element) {
                if (name == element.sensorName) {
                    values.push({date: element.date, temperature: element.value});
                }
            });

            //generate rolling average
            var valuesMean = [];
            for (var i = 0; i < values.length; i++) { //loop through all values
                var avgCount = 1;
                var mean = values[i].temperature;

                for (var j = 1; j <= temperatureAveragingFactor / 2; j++) {
                    if (i + j < values.length) {
                        mean += values[i + j].temperature;
                        avgCount++;
                    }
                    if (i - j >= 0) {
                        mean += values[i - j].temperature;
                        avgCount++;
                    }
                }

                mean /= avgCount;
                valuesMean[i] = values[i];
                valuesMean[i].temperature = mean;
            }

            return {
                name: name,
                values: valuesMean
            };
        });

        x.domain(d3.extent(data.content, function (d) {
            return d.date;
        }));

        y.domain([
            d3.min(tempSensors, function (c) {
                return d3.min(c.values, function (v) {
                    return v.temperature;
                });
            }),
            d3.max(tempSensors, function (c) {
                return d3.max(c.values, function (v) {
                    return v.temperature;
                });
            })
        ]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Temperatur (ºC)");

        var city = svg.selectAll(".city")
            .data(tempSensors)
            .enter().append("g")
            .attr("class", "city");

        city.append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                return line(d.values);
            })
            .style("stroke", function (d) {
                return color(d.name);
            });

        var sensorMapping = {
            "cowo.raum2.temperature": "Raum 2",
            "cowo.raum5.temperature": "Raum 5",
            "cowo.raum12.temperature": "Raum 12",
            "cowo.raum14.temperature": "Raum 14"
        };

        city.append("text")
            .datum(function (d) {
                return {name: d.name, value: d.values[0]};
            })
            .attr("transform", function (d) {
                return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")";
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function (d) {
                return sensorMapping[d.name];
            });

    });

}
temperatureStatistics();