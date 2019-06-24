'use strict';

import * as d3 from 'd3';
import { generateUUID } from '../utility/utility';

module.exports = Histogram;
module.exports.default = Histogram;

const COLOR_HISTOGRAM_DEFAULT = d => 'steelblue';

function Histogram(parameters) {
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
		type: 'numerical',
		binSetting: { binWidth: 1, domain_origin: null },
		getValue: (finish) => finish([]),
		onSelect: (filter) => { console.log('Histogram::onSelect', filter, '(default)'); },
		onRefresh: () => { },
		refreshOptions: {},
	}, parameters);

	this.svg = null;
	this.boundingClip = null;
	this.g = null;

	// this.init();
}

Histogram.prototype = {
	setSize: function ({ width, height, margins }) {
		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom;

		this.svg
			.attr('height', height)
			.attr('width', width);
		this.boundingClip
			.attr('width', innerWidth)
			.attr('height', innerHeight);
		this.g_b
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.g
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.axesG
			// .attr('class', 'axes')
			.attr('class', 'axes axes-rotate')
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
			.attr('id', `histogram-svg-${generateUUID({ sep: '_' })}`)
			.on('click', () => {
				this.g_brush.call(this.brush.move, null); parameters.onSelect();
			});
		this.boundingClip = svg.append('defs').append('clipPath')
			.attr('id', 'histogram-clipPath')
			.append('rect');
		this.g_b = svg.append('g')
			.attr('clip-path', 'url(#histogram-clipPath)');
		this.axesG = svg.append('g');
		this.g = svg.append('g')
			.attr('clip-path', 'url(#histogram-clipPath)');

		this.brush = d3.brushX()
			.on("end", () => this.brushend());

		this.setSize(parameters);

		this.refresh(arguments);
	},

	refresh: function (options_) {
		let parameters = this.parameters,
			container = parameters.container,
			binSetting = parameters.binSetting,
			fitGrid = parameters.fitGrid,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render,
			renderBackground = options.renderBackground;

		let targetDomain = null;
		let targetBinWidth = binSetting.binWidth;
		let { domain_origin, domain, binWidth, binNum } = fitGrid(targetDomain, targetBinWidth);

		console.log('Histogram::refresh', 'grid', domain, binWidth, binNum);

		getValue({ domain, binWidth, binNum }, (data) => {
			console.log('Histogram', data);
			// draw
			if (render) {
				this.render(data, domain_origin, binNum, renderBackground);
			}

			// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
		});
	},

	render: function (data, domain_origin, binNum, renderBackground) {
		let parameters = this.parameters,
			width = parameters.width,
			height = parameters.height,
			margins = parameters.margins,
			binSetting = parameters.binSetting;

		if (domain_origin === undefined) { domain_origin = binSetting.domain_origin; }
		// console.log('render', data, domain_origin);

		let x_interp = d3.scaleLinear().domain([0, 1]).range(domain_origin);
		let bins = Array.from(Array(binNum + 1))
			.map((d, i) => [x_interp(i / binNum), x_interp((i + 1) / binNum), x_interp((i + 0.5) / binNum)]);


		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom;

		if (this.backgroundInited && !renderBackground) {
			let { histobar } = drawHistogram_d3(this.g, this.axesG, data, domain_origin, bins, innerWidth, innerHeight, {
				xScale: this.xScale, yScale: this.yScale,
				drawXAxis: true, drawYAxis: true,
			});
			this.histobar = histobar;
		} else {
			let {
				xScale, yScale,
			} = drawHistogram_d3(this.g_b, this.axesG, data, domain_origin, bins, innerWidth, innerHeight, {
				opacity: 0.5,
				// xScale: this.xScale, yScale: this.yScale,
			});
			this.xScale = xScale;
			this.yScale = yScale;
			this.backgroundInited = true;
			let { histobar } = drawHistogram_d3(this.g, this.axesG, data, domain_origin, bins, innerWidth, innerHeight, {
				xScale: this.xScale, yScale: this.yScale,
				drawXAxis: true, drawYAxis: true,
			})
			this.histobar = histobar;
		}
	},

	brushend: function () {
		if (!d3.event.sourceEvent) { return; }

		let parameters = this.parameters,
			onSelect = parameters.onSelect,
			histobar = this.histobar,
			xScale = this.xScale,
			type = parameters.type,
			binSetting = parameters.binSetting,
			domain_origin = binSetting.domain_origin;

		let s = d3.event.selection;
		if (s == null) {
			// this.g_brush.transition().call(this.brush.move, xScale.range());
			onSelect();
		} else {
			// if (type == 'categorical') {
			// 	// let binList = [];
			// 	let pos = domain_origin.map(d => xScale(d));
			// 	pos.push(xScale.range()[1]);
			// 	let min, max, minIdx, maxIdx;
			// 	for (let i = 0; i < domain_origin.length; ++i) {
			// 		let domain = domain_origin[i],
			// 			l = pos[i], r = pos[i + 1];
			// 		if (l <= s[1] && r >= s[0]) {
			// 			// binList.push(domain);
			// 			if (min === undefined || l < min) { min = l; minIdx = i; }
			// 			if (max === undefined || r > max) { max = r; maxIdx = i; }
			// 		}
			// 	}
			// 	this.g_brush.transition()
			// 		.duration(800)
			// 		.call(this.brush.move, [min, max]);
			// 	// onSelect(binList);
			// 	onSelect([minIdx, maxIdx + 1]);
			// }
		}
	},
};

function drawHistogram_setup(data, domain_origin, bins, width, height, options_) {
	let options = Object.assign({
		// opacity: d => d.value < 0.000000001 ? 0 : 1,
		opacity: d => isNaN(d.value) ? 0 : 1,
		color: COLOR_HISTOGRAM_DEFAULT,
		useLog: false,
	}, options_);

	let maxValue = d3.max(data, d => d.value),
		// xScale = options.xScale || d3.scaleLinear().domain(domain_origin).range([1, width]),
		xScale = options.xScale || d3.scaleBand().domain(bins.map(d => `${d[0]}`)).range([1, width]),
		yScale = options.yScale || d3.scaleLinear().domain([0, maxValue]).range([height - 1, 0]);

	let binNum = bins.length,
		cellWidth = width / binNum - 1,
		cellHeight = d => height - yScale(d.value);

	let
		// x = d => xScale(bins[d.index][0]),
		x = d => xScale(`${bins[d.index][0]}`) + cellWidth / 2,
		y = d => yScale(d.value);

	let color = options.useLog ?
		(function () {
			let scale = d3.scaleLog().domain([1, maxValue + 1]).range([0, 1]);
			return d => options.color(scale(d.value + 1));
		})()
		: d => options.color(d.value / maxValue);

	let opacity = options.opacity;

	return {
		options,
		xScale, yScale,
		x, y, cellWidth, cellHeight,
		color, opacity,
	};
}

export function drawHistogram_d3(g, axesG, data, domain_origin, bins, width, height, options_) {
	let {
		options,
		xScale, yScale,
		x, y, cellWidth, cellHeight,
		color, opacity,
	} = drawHistogram_setup(data, domain_origin, bins, width, height, options_);

	let binNum = bins.length;

	let histobar = g.selectAll('.histobar').data(data),
		histobar_enter = histobar.enter().append('rect')
			.style('fill', color)
			.style('opacity', 0)
			.attr('width', cellWidth)
			.attr('height', 0)
			.attr('y', yScale(0)),
		histobar_update = histobar.merge(histobar_enter)
			.attr('class', d => `histobar [${d.index}] "${d.value}"`)
			.attr('x', x),
		// .on('click', d => { onSelect([d.origin]); d3.event.stopPropagation(); }),
		histobar_exit = histobar.exit()
			.style('opacity', 0);
	histobar_update.transition().delay(200)
		.attr('y', y)
		.style('fill', color)
		.style('opacity', opacity)
		.attr('width', cellWidth)
		.attr('height', cellHeight);

	let xAxis = d3.axisBottom(xScale).ticks(binNum).tickFormat(d3.format('.2f')),
		yAxis = d3.axisLeft(yScale).ticks(5);
	axesG.selectAll("*").remove();
	if (options.drawXAxis) {
		let gXAxis = axesG.append('g')
			.attr('class', 'x-axis')
			.attr('transform', () => `translate(0,${height})`)
			.call(xAxis);
	}
	if (options.drawYAxis) {
		let gYAxis = axesG.append('g')
			.attr('class', 'y-axis')
			.attr('transform', () => `translate(0,0)`)
			.call(yAxis);
		// 绘制网格线
		var grid = axesG.selectAll(".grid")
			.data(yScale.ticks(5))
			.enter().append("g")
			.attr("class", "grid");
		grid.append("line")
			.attr("y1", yScale)
			.attr("y2", yScale)
			.attr("x1", 0)
			.attr("x2", width)
			.style('stroke', '#d6d6d6');
	}

	return {
		options,
		xScale, yScale,
		x, y, cellWidth, cellHeight,
		color, opacity,
		histobar,
	};
}
