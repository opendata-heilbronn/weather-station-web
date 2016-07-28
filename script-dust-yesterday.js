function dustStatistics() {
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
            return y(d.value);
        });

    var svg = d3.select("#duststatstoday").append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("style", "max-width:100%")
        .attr("viewBox", "0,0," + totalWidth + "," + totalHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var daysMap = {};

    for (var day = 0; day < 7; day++) {
        var fromtime = moment().subtract(day, "days").startOf('day');
        var totime = moment().subtract(day, "days").endOf('day');
        daysMap[day] = {from: fromtime, to: totime, name: fromtime.format('dddd'), values: []};
    }


    d3.json("http://api.grundid.de/sensor?sensorName=cowo.inside.dust&size=99999999&from=" + moment().subtract(6, "days").startOf('day').format('x'), function (error, data) {
        if (error) throw error;

        data.content.forEach(function (element) {
            element.date = new Date(element.date);

            var myMoment = moment(element.date);
            for (var day in daysMap) {
                var currentDay = daysMap[day];
                if (myMoment.isBefore(currentDay.to) && myMoment.isAfter(currentDay.from)) {
                    currentDay.values.push(element);
                }
            }
            myMoment = myMoment.date(1).month(1);
            element.date = myMoment.toDate();

        });

        color.domain(d3.keys(daysMap));

        var tempSensors = color.domain().map(function (dayNo) {
            var values = daysMap[dayNo].values;

            return {
                name: daysMap[dayNo].name,
                values: values
            };
        });

        x.domain(d3.extent(data.content, function (d) {
            return d.date;
        })).tickFormat("%I:%M");

        y.domain([
            d3.min(tempSensors, function (c) {
                return d3.min(c.values, function (v) {
                    return v.value;
                });
            }),
            d3.max(tempSensors, function (c) {
                return d3.max(c.values, function (v) {
                    return v.value;
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
            .text("particles per 0.01 cubic feet");

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

        /*
         city.append("text")
         .datum(function (d) {
         return {name: d.name, value: d.values[0]};
         })
         .attr("transform", function (d) {
         return "translate(" + x(d.date) + "," + y(d.value) + ")";
         })
         .attr("x", 3)
         .attr("dy", ".35em")
         .text(function (d) {
         return sensorMapping[d.name];
         });
         */

    });
}
dustStatistics();
