define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/_base/array',
	'dojo/dom-style',
	'dojo/on',
	'dojo/dom-class',

  'https://d3js.org/d3.v3.min.js',

	'dojo/Evented'
], function (declare, lang, dom, domConstruct, arrayUtils, domStyle, on, domClass, d3, Evented) {
	return declare([], {
		constructor: function() {
			console.log(arguments);
			var options = arguments[0];
			console.log(options);
			this.map = options.map;
			this.layer = options.layer;
			this.dateField = options.dateField;
			this.valueField = options.valueField;
			this.dateLabel = options.dateLabel;
			this.valueLabel = options.valueLabel;
			this.timeExtent = options.timeExtent; // esri/TimeExtent
			this.divId = arguments[1];

			this.data = [];
			this.graph = {};

			this.tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
			this.margin = {top: 20, right: 40, bottom: 60, left: 50};
			this.width = window.innerWidth - margin.left - margin.right;
			this.height = 300 - margin.top - margin.bottom;
			this.x = d3.time.scale().range([0, width]);
			this.y = d3.scale.linear().range([height, 0]);
			this.color = d3.scale.category10();
			this.xAxis = d3.svg.axis().scale(this.x).orient('bottom');
			this.yAxis = d3.svg.axis().scale(this.y).orient('left');

			this.nextStartId = 0;
		},

		startup: function() {
			this._getInitialData(0);
		},

		destroy: function() {
			domConstruct.destroy(this.divId);
		},

		update: function(newValue) {

		},

		_getInitialData: function(startId) {
			var data = this.data;

			var query = new Query();
			query.outFields = ['*'];
      query.returnGeometry = false;
			if(this.layer.getDefinitionExpression()) {
				query.where = this.layer.getDefinitionExpression();
			};
			else {
				query.where = '1=1';
			}
			this.queryTask.execute(query, function(e) {
				arrayUtils.forEach(e.features, function(f) {
            if(f.attributes[this.dateField] != null || f.attributes[this.dateField] != undefined) {
                data.push(f.attributes);
            }
        });

        if(e.exceededTransferLimit === true) {
            this.nextStartId += 1000;
            this._getInitialData(this.nextStartId);
        }
        else {
            console.log("finish: successGetEQAllData", eq_allData);
            initChart(eq_allData);
        }
			}, function(err) {console.log(err);});
		}

			this.data = data;
			this._displayGraph(this.data);
		},

		_displayGraph: function(data) {
      var layer = this.layer;

      var graph = d3.select('#' + this.divId).append('svg')
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

      arrayUtils.forEach(data, function(d) {
          d[this.valueField] = +d[this.valueField];
          d[this.dateField] = +d[this.dateField];
      });

      this.x.domain(d3.extent(data, function(d) { return d[this.dateField]; })).nice();
      this.y.domain(d3.extent(data, function(d) { return d[this.valueField]; })).nice();

      // X軸
      graph.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + this.height + ')')
          .style('fill', '#9d9d9d')
          .call(this.xAxis)
          .append('text')
          .attr('class', 'label')
          .attr('x', width)
          .attr('y', -6)
          .style('text-anchor', 'end')
          .style('fill', '#9d9d9d')
          .text(this.dateLabel);

      // Y軸
      graph.append('g')
          .attr('class', 'y axis')
          .style('fill', '#9d9d9d')
          .call(this.yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .style('fill', '#9d9d9d')
          .text(this.valueLabel);

      // プロット（ドット）
      graph.selectAll('.dot')
          .data(data)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('r', function(d) { return d[this.valueField]; })
          .attr('cx', function(d) { return this.x(d[this.dateField]); })
          .attr('cy', function(d) { return this.y(d[this.valueField]); })
          .on('mouseover', lang.hitch(function(d) {
              // ツールチップ
              var xoffset;
              if((window.innerWidth - d3.event.pageX) > 240) {
                  xoffset = 15;
              }
              else {
                  xoffset = -165;
              }
              tooltip.transition()
                  .duration(200)
                  .style('opacity', .9);
              tooltip.html(new Date(d[this.dateField]).getFullYear() + '/' + (new Date(d[this.dateField]).getMonth() + 1) + '/' + new Date(d[this.dateField]).getDate() + '<br/>' +
                          this.valueLabel + d[this.valueField])
                  .style('left', (d3.event.pageX + xoffset) + 'px')
                  .style('top', (d3.event.pageY - 40) + 'px');

              // マップ連動（ハイライト）
              arrayUtils.forEach(layer.graphics, function(g) {
                  if(d[layer.objectIdField] === g.attributes[layer.objectIdField]) {
                      //console.log(g);
                      //console.log(g.getNode());
                      d3.select(g.getNode()).attr('class', 'active-feature');
                  }
              });
          }))
          .on('mouseout', function() {
              // ツールチップ消去
              tooltip.transition()
                  .duration(400)
                  .style('opacity', 0);
              // マップ連動（ハイライト消去）
              d3.selectAll('.active-feature').attr('class', '');
          });

      this.graph = graph;
		},

		// レンジハイライト
    setTimeExtent: function(timeExtent) {
			var start = timeExtent.startTime;
			var end = timeExtent.endTime;
      this.graph.selectAll(".active-dot")
          .attr("class", "dot");

      this.graph.selectAll(".dot")
          .attr("class", function(d) {
              //console.log(new Date(d.UTC_DATETIME));
              var date = new Date(d[this.dateField]);
              //console.log(d);
              if(start <= date && end > date) {
                  return "active-dot";
              }
              else {
                  return "dot";
              }
          });
    }
	});
});
