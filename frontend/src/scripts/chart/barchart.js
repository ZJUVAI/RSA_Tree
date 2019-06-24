'use strict';

import * as d3 from 'd3';
import { generateUUID } from '../utility/utility';

module.exports = Barchart;
module.exports.default = Barchart;

const COLOR_BARCHART_DEFAULT = d => 'steelblue';

function Barchart(parameters) {
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
		type: 'categorical',
		binSetting: { binNum: 0 },
		getValue: (finish) => finish([]),
		onSelect: (filter) => { console.log('Barchart::onSelect', filter, '(default)'); },
		onRefresh: () => { },
		refreshOptions: {},
	}, parameters);

	this.svg = null;
	this.boundingClip = null;
	this.g = null;

	// this.init();
}

Barchart.prototype = {
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
			.attr('id', `barchart-svg-${generateUUID({ sep: '_' })}`)
			.on('click', () => {
				this.g_brush.call(this.brush.move, null); parameters.onSelect();
			});
		this.boundingClip = svg.append('defs').append('clipPath')
			.attr('id', 'barchart-clipPath')
			.append('rect');
		this.g_b = svg.append('g')
			.attr('clip-path', 'url(#barchart-clipPath)');
		this.axesG = svg.append('g');
		this.g = svg.append('g')
			.attr('clip-path', 'url(#barchart-clipPath)');

		this.brush = d3.brushX()
			.on("end", () => this.brushend());

		this.setSize(parameters);

		this.refresh(arguments);
	},

	refresh: function (options_) {
		let parameters = this.parameters,
			// type = parameters.type,
			container = parameters.container,
			binSetting = parameters.binSetting,
			// fitGrid = parameters.fitGrid,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render;

		// switch (type) {
		// case 'categorical':
		let { domain_origin_cat, domain_cat, binWidth: binWidth_cat, binNum: binNum_cat } = binSetting;

		console.log('Barchart::refresh', 'grid', domain_cat, binWidth_cat, binNum_cat);

		getValue({ domain: domain_cat, binWidth: binWidth_cat, binNum: binNum_cat }, (data) => {
			console.log('Barchart', data);
			// draw
			if (render) {
				this.render(data, domain_origin_cat, binNum_cat);
			}

			// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
		});
		// 		break;
		// 	case 'numerical':
		// 		let targetDomain = null;
		// 		let targetBinWidth = binSetting.binWidth;
		// 		let { domain_origin, domain, binWidth, binNum } = fitGrid(targetDomain, targetBinWidth);

		// 		console.log('Barchart::refresh', 'grid', domain, binWidth, binNum);

		// 		getValue({ domain, binWidth, binNum }, (data) => {
		// 			console.log('Barchart', data);
		// 			// draw
		// 			if (render) {
		// 				this.render(data, domain_origin, binNum);
		// 			}

		// 			// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
		// 		});
		// 		break;
		// 	default:
		// 		console.warn('Barchart::refresh()', `unknown type: ${type}`);
		// }
	},

	render: function (data, domain_origin) {
		let parameters = this.parameters,
			width = parameters.width,
			height = parameters.height,
			margins = parameters.margins,
			binSetting = parameters.binSetting;

		if (domain_origin === undefined) { domain_origin = binSetting.domain_origin_cat; }
		// console.log('render', data, domain_origin);

		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom;

		if (this.backgroundInited) {
			let { bar } = drawBarchart_d3(this.g, this.axesG, data, domain_origin, innerWidth, innerHeight, {
				xScale: this.xScale, yScale: this.yScale,
				drawXAxis: true, drawYAxis: true,
			});
			this.bar = bar;
		} else {
			let {
				xScale, yScale,
			} = drawBarchart_d3(this.g_b, this.axesG, data, domain_origin, innerWidth, innerHeight, {
				opacity: 0.5,
			});
			this.xScale = xScale;
			this.yScale = yScale;
			this.backgroundInited = true;
			let { bar } = drawBarchart_d3(this.g, this.axesG, data, domain_origin, innerWidth, innerHeight, {
				xScale: this.xScale, yScale: this.yScale,
				drawXAxis: true, drawYAxis: true,
			})
			this.bar = bar;
		}
	},

	brushend: function () {
		if (!d3.event.sourceEvent) { return; }

		let parameters = this.parameters,
			onSelect = parameters.onSelect,
			bar = this.bar,
			xScale = this.xScale,
			type = parameters.type,
			binSetting = parameters.binSetting,
			domain_origin = binSetting.domain_origin_cat;

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

function drawBarchart_setup(data, domain_origin, width, height, options_) {
	let options = Object.assign({
		// opacity: d => d.value < 0.000000001 ? 0 : 1,
		opacity: d => isNaN(d.value) ? 0 : 1,
		color: COLOR_BARCHART_DEFAULT,
		useLog: false,
	}, options_);

	let maxValue = d3.max(data, d => d.value),
		xScale = options.xScale || d3.scaleBand().domain(domain_origin).range([1, width]),
		yScale = options.yScale || d3.scaleLinear().domain([0, maxValue]).range([height - 1, 0]);

	let binNum = domain_origin.length,
		cellWidth = width / binNum - 1,
		cellHeight = d => height - yScale(d.value);

	let x = d => xScale(d.origin),
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

export function drawBarchart_d3(g, axesG, data, domain_origin, width, height, options_) {
	let {
		options,
		xScale, yScale,
		x, y, cellWidth, cellHeight,
		color, opacity,
	} = drawBarchart_setup(data, domain_origin, width, height, options_);

	let binNum = domain_origin.length;

	let bar = g.selectAll('.bar').data(data),
		bar_enter = bar.enter().append('rect')
			.style('fill', color)
			.style('opacity', 0)
			.attr('width', cellWidth)
			.attr('height', 0)
			.attr('y', yScale(0)),
		bar_update = bar.merge(bar_enter)
			.attr('class', d => `bar [${d.index}] "${d.value}"`)
			.attr('x', x),
		// .on('click', d => { onSelect([d.origin]); d3.event.stopPropagation(); }),
		bar_exit = bar.exit()
			.style('opacity', 0);
	bar_update.transition().delay(200)
		.attr('y', y)
		.style('fill', color)
		.style('opacity', opacity)
		.attr('width', cellWidth)
		.attr('height', cellHeight);

	let xAxis = d3.axisBottom(xScale).ticks(binNum),
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
		bar,
	};
}
