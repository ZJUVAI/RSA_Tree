'use strict';

import * as d3 from 'd3';
import { generateUUID } from '../utility/utility';

module.exports = BinnedScatterplot;
module.exports.default = BinnedScatterplot;

const COLOR_CIRCLE_DEFAULT = d => 'steelblue';

let timestamp = 0,
	lastRefreshed = -1;

function BinnedScatterplot(parameters) {
	this.parameters = Object.assign({
		container: 'body',
		width: 700,
		height: 700,
		margins: {
			top: 50,
			left: 80,
			right: 30,
			bottom: 60
		},
		binSetting: { binWidth: [1, 1] },
		getValue: (finish) => finish([]),
		onSelect: (filter) => { console.log('BinnedScatterplot::onSelect', filter, '(default)'); },
		onRefresh: () => { },
		refreshOptions: {},
	}, parameters);

	this.svg = null;
	this.boundingClip = null;
	this.g = null;

	// this.init();
}

BinnedScatterplot.prototype = {
	setSize: function ({ width, height, margins }) {
		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom;

		this.svg
			.attr('height', height)
			.attr('width', width);
		this.boundingClip
			.attr('transform', `translate(0,${-margins.top})`)
			.attr('width', innerWidth + margins.right)
			.attr('height', innerHeight + margins.top);
		this.g_b
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.g
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.axesG
			.attr('class', 'axes')
			.attr('transform', `translate(${margins.left},${margins.top})`);

		this.brush.extent([[0, 0], [innerWidth, innerHeight]]);
		this.svg.select('.brush').remove();
		this.g_brush = this.svg.append('g')
			.attr('class', 'brush')
			.attr('transform', `translate(${margins.left},${margins.top})`)
			.call(this.brush);
	},

	init: function () {
		let parameters = this.parameters,
			container = parameters.container;

		let svg = this.svg = d3.select(`#${container}`).append('svg')
			.attr('id', `binnedscatterplot-svg-${generateUUID({ sep: '_' })}`)
			.on('click', () => {
				this.g_brush.call(this.brush.move, null); parameters.onSelect();
			});
		this.defs = svg.append('defs');
		this.boundingClip = this.defs.append('clipPath')
			.attr('id', 'binnedscatterplot-clipPath')
			.append('rect');
		this.g_b = svg.append('g')
			.attr('clip-path', 'url(#binnedscatterplot-clipPath)');
		this.axesG = svg.append('g');
		this.g = svg.append('g')
			.attr('clip-path', 'url(#binnedscatterplot-clipPath)');

		this.brush = d3.brush()
			.on("end", () => this.brushend());

		this.setSize(parameters);

		this.refresh(arguments);
	},

	refresh: function (options_, callback) {
		let parameters = this.parameters,
			container = parameters.container,
			binSetting = parameters.binSetting,
			fitGrid = parameters.fitGrid,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render,
			renderBackground = options.renderBackground;

		// scale alignment
		let targetDomain = [null, null];
		let targetBinWidth = binSetting.binWidth;
		let { domain_origin, domain, binWidth, binNum } = fitGrid(targetDomain, targetBinWidth);

		console.log('BinnedScatterplot::refresh', 'grid', domain, binWidth, binNum);

		getValue({ domain, binWidth, binNum }, (() => {
			let cur = timestamp++;
			return (data) => {
				console.log('BinnedScatterplot', data);
				if (cur > lastRefreshed || callback) {
					// draw
					if (render) {
						this.render(data, domain_origin, binNum, renderBackground);
					}

					// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
					lastRefreshed = cur;

					callback && callback();
				}
			}
		})());
	},

	render: function (data, domain_origin, resolution, renderBackground) {
		let parameters = this.parameters,
			width = parameters.width,
			height = parameters.height,
			margins = parameters.margins,
			binSetting = parameters.binSetting;

		let useLog = parameters.renderOptions.useLog;

		if (domain_origin === undefined) { domain_origin = binSetting.domain_origin; }
		// console.log('render', data, domain_origin);

		let x_interp = d3.scaleLinear().domain([0, 1]).range(domain_origin[0]),
			y_interp = d3.scaleLinear().domain([0, 1]).range(domain_origin[1]);
		let
			xs = Array.from(Array(resolution[0]))
				.map((d, i) => [x_interp(i / resolution[0]), x_interp((i + 1) / resolution[0]), x_interp((i + 0.5) / resolution[0])]),
			ys = Array.from(Array(resolution[1]))
				.map((d, i) => [y_interp(i / resolution[1]), y_interp((i + 1) / resolution[1]), y_interp((i + 0.5) / resolution[1])]);


		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom;

		if (this.backgroundInited && !renderBackground) {
			let { circle } = drawBinnedScatterplot_d3(this.g, this.axesG, data, domain_origin, [xs, ys], innerWidth, innerHeight, {
				xScale: this.xScale, yScale: this.yScale, //rScale: this.rScale,
				drawXAxis: true, drawYAxis: true, useLog,
			});
			this.circle = circle;
		} else {
			// let {
			// 	xScale, yScale, rScale,
			// } = drawBinnedScatterplot_d3(this.g_b, this.axesG, data, domain_origin, [xs, ys], innerWidth, innerHeight, {
			// 	opacity: 0.5, useLog,
			// 	xScale: this.xScale, yScale: this.yScale, //rScale: this.rScale,
			// });
			// if (!this.backgroundInited) {
			// 	this.xScale = xScale;
			// 	this.yScale = yScale;
			// 	this.rScale = rScale;
			// 	this.backgroundInited = true;
			// }
			let { xScale, yScale, rScale, circle } = drawBinnedScatterplot_d3(this.g, this.axesG, data, domain_origin, [xs, ys], innerWidth, innerHeight, {
				xScale: this.xScale, yScale: this.yScale, //rScale: this.rScale,
				drawXAxis: true, drawYAxis: true, useLog,
			})
			this.circle = circle;

			this.xScale = xScale;
			this.yScale = yScale;
			this.rScale = rScale;
		}
	},

	showUncertainty: function () {
		let legendWidth = 200, legendHeight = 20;

		// let color = d3.scaleLinear().domain([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]).range(['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fee0b6', '#fdb863', '#e08214', '#b35806', '#7f3b08']);
		let colors = ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
			colorScale = d3.scaleLinear().domain([0.0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0]).range(colors);
		this.g.selectAll('.circle')
			.style('fill', d => colorScale(Math.min(1, Math.max(0, d.uncertainty.all / d.value))))
			.style('stroke', 'black')
			.style('stroke-width', 1);

		this.g.selectAll('.legend_circle')
			.style('fill', colorScale(0))
			.style('stroke', 'black')
			.style('stroke-width', 1);

		// append gradient bar
		var gradient = this.defs
			.append('linearGradient')
			.attr('id', 'gradient')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '100%')
			.attr('y2', '0%')
			.attr('spreadMethod', 'pad');

		// programatically generate the gradient for the legend
		// this creates an array of [pct, colour] pairs as stop
		// values for legend
		var pct = (function linspace(start, end, n) {
			var out = [];
			var delta = (end - start) / (n - 1);

			var i = 0;
			while (i < (n - 1)) {
				out.push(start + (i * delta));
				i++;
			}

			out.push(end);
			return out;
		})(0, 100, colors.length).map(function (d) {
			return Math.round(d) + '%';
		});

		var colourPct = d3.zip(pct, colors);

		colourPct.forEach(function (d) {
			gradient.append('stop')
				.attr('offset', d[0])
				.attr('stop-color', d[1])
				.attr('stop-opacity', 1);
		});

		let legendBar = this.svg.append('g')
			.attr('transform', `translate(480,10)`);
		legendBar.append('rect')
			.attr('x1', 300)
			.attr('y1', 0)
			.attr('width', legendWidth)
			.attr('height', legendHeight)
			.style('fill', 'url(#gradient)');

		// create a scale and axis for the legend
		var legendScale = d3.scaleLinear()
			.domain([0, 1])
			.range([0, legendWidth]);

		var legendAxis = d3.axisBottom()
			.scale(legendScale)
			.ticks(5)
			.tickFormat(d3.format(",.0%"));

		legendBar.append("g")
			.attr("class", "legend axis")
			.attr("transform", `translate(0, ${legendHeight})`)
			.call(legendAxis);
	},

	brushend: function () {
		if (!d3.event.sourceEvent) { return; }

		let parameters = this.parameters,
			onSelect = parameters.onSelect,
			circle = this.circle,
			xScale = this.xScale,
			type = parameters.type,
			binSetting = parameters.binSetting,
			domain_origin = binSetting.domain_origin;

		let s = d3.event.selection;
		if (s == null) {
			// this.g_brush.transition().call(this.brush.move, xScale.range());
			onSelect();
		} else {
			if (type == 'categorical') {
				// let binList = [];
				let pos = domain_origin.map(d => xScale(d));
				pos.push(xScale.range()[1]);
				let min, max, minIdx, maxIdx;
				for (let i = 0; i < domain_origin.length; ++i) {
					let domain = domain_origin[i],
						l = pos[i], r = pos[i + 1];
					if (l <= s[1] && r >= s[0]) {
						// binList.push(domain);
						if (min === undefined || l < min) { min = l; minIdx = i; }
						if (max === undefined || r > max) { max = r; maxIdx = i; }
					}
				}
				this.g_brush.transition()
					.duration(800)
					.call(this.brush.move, [min, max]);
				// onSelect(binList);
				onSelect([minIdx, maxIdx + 1]);
			}
		}
	},
};

function drawBinnedScatterplot_setup(data, domain_origin, bins, width, height, options_) {
	let options = Object.assign({
		// opacity: d => d.value < 0.000000001 ? 0 : 1,
		opacity: d => isNaN(d.value) ? 0 : 1,
		color: COLOR_CIRCLE_DEFAULT,
		useLog: false,
	}, options_);

	let maxR = Math.min(width / bins[0].length, height / bins[1].length) / 2 - 1,
		maxValue = d3.max(data, d => d.value),
		xScale = options.xScale || d3.scaleLinear().domain(domain_origin[0]).range([1, width]),
		yScale = options.yScale || d3.scaleLinear().domain(domain_origin[1]).range([height - 1, 0]);

	let rScale = options.rScale
		|| (options.useLog ? d3.scaleLog().domain([1, maxValue + 1]).range([0, maxR])
			: d3.scaleLinear().domain([0, maxValue]).range([0, maxR]));

	let x = d => xScale(bins[0][d.index[0]][2]),
		y = d => yScale(bins[1][d.index[1]][2]),
		r = d => rScale(d.value + 1);

	let color = options.useLog ?
		(function () {
			let scale = d3.scaleLog().domain([1, maxValue + 1]).range([0, 1]);
			return d => options.color(scale(d.value + 1));
		})()
		: d => options.color(d.value / maxValue);

	let opacity = options.opacity;

	return {
		options,
		xScale, yScale, rScale,
		x, y, r,
		color, opacity,
		maxValue,
	};
}

export function drawBinnedScatterplot_d3(g, axesG, data, domain_origin, bins, width, height, options_) {
	let {
		options,
		xScale, yScale, rScale,
		x, y, r,
		color, opacity,
		maxValue,
	} = drawBinnedScatterplot_setup(data, domain_origin, bins, width, height, options_);

	let circle = g.selectAll('.circle').data(data),
		circle_enter = circle.enter().append('circle')
			.style('fill', color)
			.style('opacity', 0)
			.attr('r', 0),
		circle_update = circle.merge(circle_enter)
			.attr('class', d => `circle [${d.index}] "${d.value}"`)
			.attr('cx', x)
			.attr('cy', y),
		// .on('click', d => { onSelect([d.origin]); d3.event.stopPropagation(); }),
		circle_exit = circle.exit()
			.style('opacity', 0);
	circle_update//.transition().delay(200)
		.style('fill', color)
		.style('opacity', opacity)
		.attr('r', r);

	// let xAxis = d3.axisBottom(xScale).ticks(bins[0].length),
	// 	yAxis = d3.axisLeft(yScale).ticks(bins[1].length);
	let xAxis = d3.axisBottom(xScale).ticks(10),
		yAxis = d3.axisLeft(yScale).ticks(10);

	axesG.selectAll("*").remove();
	// if (options.drawXAxis) {
	let gXAxis = axesG.append('g')
		.attr('class', 'x-axis')
		.attr('transform', () => `translate(0,${height})`)
		.call(xAxis);
	// }
	// if (options.drawYAxis) {
	let gYAxis = axesG.append('g')
		.attr('class', 'y-axis')
		.attr('transform', () => `translate(0,0)`)
		.call(yAxis);
	// 	// 绘制网格线
	// 	var grid = axesG.selectAll(".grid")
	// 		.data(yScale.ticks(5))
	// 		.enter().append("g")
	// 		.attr("class", "grid");
	// 	grid.append("line")
	// 		.attr("y1", yScale)
	// 		.attr("y2", yScale)
	// 		.attr("x1", 0)
	// 		.attr("x2", width)
	// 		.style('stroke', '#d6d6d6');
	// }

	// drawLegend
	let ratios = [0.25, 0.5, 0.75],
		rs = ratios.map(d => r({ value: d * maxValue }));
	let legend_circle = g.selectAll('.legend_circle').data(ratios),
		legend_circle_enter = legend_circle.enter().append('circle')
			.style('fill', color)
			.style('opacity', 1),
		legend_circle_update = legend_circle.merge(legend_circle_enter)
			.attr('class', d => `legend_circle "${d * maxValue}"`)
			.attr('cx', (_, i) => 500 - rs[2] * 6 + (rs[2] * 2 + 50) * i)
			.attr('cy', (_, i) => -2 - 5 - rs[2])
			.attr('r', d => r({ value: d * maxValue })),
		// .on('click', d => { onSelect([d.origin]); d3.event.stopPropagation(); }),
		legend_circle_exit = legend_circle.exit()
			.style('opacity', 0);

	let legend_text = g.selectAll('.legend_text').data(ratios),
		legend_text_enter = legend_text.enter().append('text')
			.style('opacity', 1),
		legend_text_update = legend_text.merge(legend_text_enter)
			.attr('class', d => `legend_text "${d * maxValue}"`)
			.attr('x', (d, i) => 503 - rs[2] * 6 + (rs[2] * 2 + 50) * i + r({ value: d * maxValue }))
			.attr('y', (_, i) => -2 - rs[2])
			.text(d => d3.format('.2s')(d * maxValue)),
		// .on('click', d => { onSelect([d.origin]); d3.event.stopPropagation(); }),
		legend_text_exit = legend_text.exit()
			.style('opacity', 0);

	return {
		options,
		xScale, yScale, rScale,
		x, y, r,
		color, opacity,
		circle,
	};
}
