define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/_base/array',
	'dojo/dom-style',
	'dojo/on',
	'dojo/dom-class',
    
    'esri/tasks/query',
    'esri/tasks/QueryTask',

  'https://d3js.org/d3.v3.min.js',

	'dojo/Evented'
], function (declare, lang, dom, domConstruct, arrayUtils, domStyle, on, domClass, Query, QueryTask, d3, Evented) {
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
			this.width = window.innerWidth - this.margin.left - this.margin.right;
			this.height = 300 - this.margin.top - this.margin.bottom;
			this.x = d3.time.scale().range([0, this.width]);
			this.y = d3.scale.linear().range([this.height, 0]);
			this.color = d3.scale.category10();
			this.xAxis = d3.svg.axis().scale(this.x).orient('bottom');
			this.yAxis = d3.svg.axis().scale(this.y).orient('left');

			this.nextStartId = 0;
            this.queryTask = new QueryTask(this.layer.url);
		},

		startup: function() {
			this._getInitialData();
		},

		destroy: function() {
			domConstruct.destroy(this.divId);
		},

		update: function(newValue) {

		},
        
        _getNextData: function(startId) {
			var data = this.data;
            var me = this;

			var query = new Query();
			query.outFields = ['*'];
            query.timeExtent = this.timeExtent;
            query.returnGeometry = false;
			if(this.layer.getDefinitionExpression()) {
				query.where = this.layer.getDefinitionExpression();
			}
			else {
				query.where = 'OBJECTID > ' + startId;;
			}
			this.queryTask.execute(query, function(e) {
				arrayUtils.forEach(e.features, function(f) {
            if(f.attributes[me.dateField] != null || f.attributes[me.dateField] != undefined) {
                data.push(f.attributes);
            }
        });

        if(e.exceededTransferLimit === true) {
            me.nextStartId += 1000;
            me._getNextData(me.nextStartId);
            me.data = data;
        }
        else {
            console.log("finish: successGetAllData");
            me.data = data;
			me._displayGraph(me.data);
        }
			}, function(err) {console.log(err);});
        },

		_getInitialData: function() {
			var data = this.data;
            var me = this;

			var query = new Query();
			query.outFields = ['*'];
            query.timeExtent = this.timeExtent;
            query.returnGeometry = false;
			if(this.layer.getDefinitionExpression()) {
				query.where = this.layer.getDefinitionExpression();
			}
			else {
				query.where = '1=1';
			}
			this.queryTask.execute(query, function(e) {
				arrayUtils.forEach(e.features, function(f) {
            if(f.attributes[me.dateField] != null || f.attributes[me.dateField] != undefined) {
                data.push(f.attributes);
            }
        });

        if(e.exceededTransferLimit === true) {
            me.nextStartId += 1000;
            me._getNextData(me.nextStartId);
            me.data = data;
        }
        else {
            console.log("finish: successGetAllData");
            me.data = data;
			me._displayGraph(me.data);
        }
			}, function(err) {console.log(err);});
		},

		_displayGraph: function(data) {
      var layer = this.layer;
      var me = this;

      var graph = d3.select('#' + me.divId).append('svg')
          .attr('width', me.width + me.margin.left + me.margin.right)
          .attr('height', me.height + me.margin.top + me.margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + me.margin.left + ',' + me.margin.top + ')');

      arrayUtils.forEach(data, function(d) {
          d[me.valueField] = +d[me.valueField];
          d[me.dateField] = +d[me.dateField];
      });

      me.x.domain(d3.extent(data, function(d) { return d[me.dateField]; })).nice();
      me.y.domain(d3.extent(data, function(d) { return d[me.valueField]; })).nice();

      // X軸
      graph.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + me.height + ')')
          .style('fill', '#9d9d9d')
          .call(me.xAxis)
          .append('text')
          .attr('class', 'label')
          .attr('x', me.width)
          .attr('y', -6)
          .style('text-anchor', 'end')
          .style('fill', '#9d9d9d')
          .text(me.dateLabel);

      // Y軸
      graph.append('g')
          .attr('class', 'y axis')
          .style('fill', '#9d9d9d')
          .call(me.yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .style('fill', '#9d9d9d')
          .text(me.valueLabel);

      // プロット（ドット）
      graph.selectAll('.dot')
          .data(data)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('r', '3')
          //.attr('r', function(d) { return d[me.valueField]; })
          .attr('cx', function(d) { return me.x(d[me.dateField]); })
          .attr('cy', function(d) { return me.y(d[me.valueField]); })
          .on('mouseover', lang.hitch(function(d) {
              // ツールチップ
              var xoffset;
              if((window.innerWidth - d3.event.pageX) > 240) {
                  xoffset = 15;
              }
              else {
                  xoffset = -165;
              }
              me.tooltip.transition()
                  .duration(200)
                  .style('opacity', .9);
              me.tooltip.html(new Date(d[me.dateField]).getFullYear() + '/' + (new Date(d[me.dateField]).getMonth() + 1) + '/' + new Date(d[me.dateField]).getDate() + '<br/>' +
                          me.valueLabel + d[me.valueField])
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
              me.tooltip.transition()
                  .duration(400)
                  .style('opacity', 0);
              // マップ連動（ハイライト消去）
              d3.selectAll('.active-feature').attr('class', '');
          });

      this.graph = graph;
		},

		// レンジハイライト
    setHightlightRange: function(timeExtent) {
        console.log(timeExtent);
			var start = timeExtent.startTime;
			var end = timeExtent.endTime;
            var me = this;
            
      this.graph.selectAll(".active-dot")
          .attr("class", "dot");

      this.graph.selectAll(".dot")
          .attr("class", function(d) {
              //console.log(new Date(d.UTC_DATETIME));
              var date = new Date(d[me.dateField]);
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
