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
			this.width = options.width;
			this.height = options.height;
			this.interpolation = options.interpolation;
			this.animate = options.animate;
			this.updateDelay = options.updateDelay;
			this.transitionDelay = options.transitionDelay;
			this.minx = options.minx;
			this.maxx = options.maxx;
            this.strokeColor = options.strokeColor;
            this.range = options.range;
			this.divId = arguments[1];
			console.log(this.divId);
			this.x1 = 0;
			this.x0 = 0;
			this.line = function() {};
			this.data = [];
			this.graph = d3.select('#' + this.divId).append('svg:svg').attr('width', '100%').attr('height', '100%');
		},

		startup: function() {
			this._displayGraph(this.divId, this.width, this.height, this.interpolation, this.animate, this.updateDelay, this.transitionDelay);
		},

		destroy: function() {
			domConstruct.destroy(this.divId);
		},

		update: function(newValue) {
			var v = this.data.shift();
		    this.data.push(newValue);
		    this._redrawWithAnimation(this.graph, this.data);
		},

		_displayGraph: function(id, width, height, interpolation, animate, updateDelay, transitionDelay) {
			var data = this.data;
	        for (var i = 0; i < this.range; i++) {
	        	this.data[i] = 0;
	        };
			console.log(data.length);

			var x = d3.scale.linear().domain([0, 48]).range([-5, width]);
			var y = d3.scale.linear().domain([this.maxx, this.minx]).range([0, height]);
			this.x1 = x(1);
			this.x0 = x(0);
			this.line = d3.svg.line()
				.x(function(d,i) {
					return x(i);
				})
				.y(function(d) {
					return y(d);
				})
				.interpolate(interpolation);

			this.graph.append('svg:path').attr({
                'd': this.line(data),
                'stroke': this.strokeColor,
                'stroke-width': 2,
                'fill': 'none'
            });

			var _redrawWithAnimation = this._redrawWithAnimation;
		},

		_redrawWithAnimation: function(graph, data) {
			graph.selectAll('path')
				.data([data])
				.attr('d', this.line)
				.transition()
				.ease('linear')
				.duration(this.transitionDelay);
		}
	});
});
