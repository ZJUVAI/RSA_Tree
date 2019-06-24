'use strict';

import * as d3 from 'd3';
import { generateUUID } from '../utility/utility';

module.exports = Timelinechart;
module.exports.default = Timelinechart;

// DAYS
const MSECS_PER_UNIT = 1000 * 86400;//1000 * 86400000;
const TO_DATE = d => new Date((new Date(2000, 0, 1).getTime()) + d * MSECS_PER_UNIT); // 86400000 = seconds in a day
const TO_ORIGIN = d => (d.getTime() - (new Date(2000, 0, 1).getTime())) / (MSECS_PER_UNIT);
const BRUSH_MARGIN = 2;
const GRANULARITY_COARSE = 1;//864000;
const GRANULARITY_FINE = 1;//12 * 3600;

// // SECOUNDS
// const MSECS_PER_UNIT = 1000;
// const TO_DATE = d => new Date((new Date(2000, 0, 1).getTime()) + d * MSECS_PER_UNIT); // 86400000 = seconds in a day
// const TO_ORIGIN = d => (d.getTime() - (new Date(2000, 0, 1).getTime())) / (MSECS_PER_UNIT);
// const BRUSH_MARGIN = 2;
// const GRANULARITY_COARSE = 864000;
// const GRANULARITY_FINE = 12 * 3600;

function Timelinechart(parameters) {
	this.parameters = Object.assign({
		container: 'body',
		width: 700,
		height: 700,
		margins: {
			top: 50,
			left: 80,
			right: 30,
			bottom: 20
		},
		margins2: {
			top: 550,
			left: 80,
			right: 30,
			bottom: 60
		},
		getValue: (finish) => finish([]),
		onSelect: (filter) => { console.log('Timelinechart::onSelect', filter, '(default)'); },
		onRefresh: () => { },
		refreshOptions: {},
	}, parameters);

	this.svg = null;
	this.boundingClip = null;
	this.g = null;

	// this.init();
}

Timelinechart.prototype = {
	setSize: function ({ width, height, margins, margins2 }) {
		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom,
			innerHeight2 = height - margins2.top - margins2.bottom;

		this.svg
			.attr('height', height)
			.attr('width', width);
		this.boundingClip
			.attr('width', innerWidth)
			.attr('height', innerHeight);
		this.boundingClip2
			.attr('width', innerWidth)
			.attr('height', innerHeight2);
		this.g_b
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.g_b2
			.attr('transform', `translate(${margins2.left},${margins2.top})`);
		this.g
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.g2
			.attr('transform', `translate(${margins2.left},${margins2.top})`);
		this.axesG
			.attr('class', 'axes axes-rotate')
			.attr('transform', `translate(${margins.left},${margins.top})`);
		this.axesG2
			.attr('class', 'axes')
			.attr('transform', `translate(${margins2.left},${margins2.top})`);

		this.brush.extent([[0, 0], [innerWidth, innerHeight]]);
		this.brush2.extent([[0, 0], [innerWidth, innerHeight2]]);
		this.svg.select('.brush').remove();
		this.g_brush = this.svg.append('g')
			.attr('class', 'brush')
			.attr('transform', `translate(${margins.left},${margins.top})`)
			.attr('clip-path', 'url(#timelinechart-clipPath)')
			.call(this.brush);
		this.g_brush2 = this.svg.append('g')
			.attr('class', 'brush')
			.attr('transform', `translate(${margins2.left},${margins2.top})`)
			.attr('clip-path', 'url(#timelinechart-clipPath2)')
			.call(this.brush2);
	},

	init: function () {
		let parameters = this.parameters,
			container = parameters.container;

		let svg = this.svg = d3.select(`#${container}`).append('svg')
			.attr('id', `timelinechart-svg-${generateUUID({ sep: '_' })}`)
			.on('click', () => {
				// this.g_brush.call(this.brush.move, null); //parameters.onSelect();
			});
		let defs = svg.append('defs');
		this.boundingClip = defs.append('clipPath')
			.attr('id', 'timelinechart-clipPath')
			.append('rect');
		this.boundingClip2 = defs.append('clipPath')
			.attr('id', 'timelinechart-clipPath2')
			.append('rect');
		this.g_b = svg.append('g')
			.attr('clip-path', 'url(#timelinechart-clipPath)');
		this.g_b2 = svg.append('g')
			.attr('clip-path', 'url(#timelinechart-clipPath2)');
		this.axesG = svg.append('g');
		this.axesG2 = svg.append('g');
		this.g = svg.append('g')
			.attr('clip-path', 'url(#timelinechart-clipPath)');
		this.g2 = svg.append('g')
			.attr('clip-path', 'url(#timelinechart-clipPath2)');

		this.brush = d3.brushX()
			.on('end', () => this.brushend());

		this.brush2 = d3.brushX()
			.on('brush end', () => this.brushing2());
		// .on('start', () => this.brushstart2())
		// .on('end', () => this.brushend2());

		this.setSize(parameters);
		this.refresh(arguments);
	},

	refresh: function (options_) {
		let parameters = this.parameters,
			container = parameters.container,
			fitBin = parameters.fitBin,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render;

		// if (firstTime) {
		// 	let { domain_origin, domain, binWidth, binNum } = fitBin(null, GRANULARITY_FINE);

		// 	console.log('Timelinechart::refresh (first time)', 'grid', domain, binWidth, binNum);

		// 	getValue({ domain, binWidth, binNum }, (data) => {
		// 		console.log('Timelinechart', data);
		// 		// draw
		// 		if (render) {
		// 			this.render(data, domain_origin, true, true);
		// 		}
		// 		// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
		// 	});
		// } else {
		this.refreshFocus(options);
		this.refreshContext(options);
		// }
	},

	refreshFocus: function (options_) {

		let parameters = this.parameters,
			container = parameters.container,
			fitBin = parameters.fitBin,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh,
			width = parameters.width,
			margins = parameters.margins;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render, overview = options.overview, reset = options.reset, noTransition = options.noTransition;

		// if (domain_origin === undefined) { domain_origin = binSetting.domain_origin; }
		// console.log('render', data, domain_origin);

		let innerWidth = width - margins.left - margins.right;
		/* Focus */
		// scale alignment
		// let targetDomain = overview || !this.xScale ? null : this.xScale.domain().map(TO_ORIGIN),
		// targetInterval = overview ? GRANULARITY_COARSE : this.xScale ? (targetDomain[1] - targetDomain[0]) / innerWidth : GRANULARITY_FINE;
		let targetDomain = !this.xScale ? null : this.xScale.domain().map(TO_ORIGIN),
			targetInterval = GRANULARITY_FINE;//!this.xScale ? GRANULARITY_FINE : (targetDomain[1] - targetDomain[0]) / innerWidth * 10;
		let { domain_origin, domain, binWidth, binNum } = fitBin(targetDomain, targetInterval); // null = all, targetInterval = 1 (/days)

		console.log('Timelinechart::refresh (focus)', 'grid', domain, binWidth, binNum);

		let request = getValue({ domain, binWidth, binNum }, (data) => {
			console.log('Timelinechart', data);
			// draw
			if (render) {
				this.render(data, domain_origin, true, false, noTransition);
			}
			// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
		});
		let now = performance.now();
		if (this.lastPassedRequest_focus == null || now - this.lastPassedRequest_focus > 200) {
			this.lastPassedRequest_focus = now;
			this.lastRequest = null;
			console.log('passed');
		} else {
			this.lastRequest && this.lastRequest.abort();
			this.lastRequest = request;
			console.log('aborted');
		}
	},

	refreshContext: function (options_) {
		let parameters = this.parameters,
			container = parameters.container,
			fitBin = parameters.fitBin,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render;

		/* Context */
		// scale alignment
		let { domain_origin: domain_origin2, domain: domain2, binWidth: binWidth2, binNum: binNum2 } = fitBin(null, GRANULARITY_COARSE); // null = all, targetInterval = 1 (/days)

		console.log('Timelinechart::refresh (context)', 'grid', domain2, binWidth2, binNum2, domain_origin2, domain_origin2.map(TO_DATE));

		getValue({ domain: domain2, binWidth: binWidth2, binNum: binNum2 }, (data) => {
			console.log('Timelinechart', data);
			// draw
			if (render) {
				this.render(data, domain_origin2, false, true);
			}
			// onRefresh && onRefresh({ data, domain_origin2, domain2, binWidth, binNum2 });
		});

		// /* Context (fine) */
		// // scale alignment
		// let { domain_origin, domain, binWidth, binNum } = fitBin(null, GRANULARITY_FINE); // null = all, targetInterval = 1 (/days)

		// getValue({ domain: domain, binWidth: binWidth, binNum: binNum }, (data) => {
		// 	console.log('Timelinechart', data);
		// 	// draw
		// 	if (render) {
		// 		this.render(data, domain_origin, false, true);
		// 	}
		// 	// onRefresh && onRefresh({ data, domain_origin2, domain2, binWidth, binNum2 });
		// });
	},

	render: function (data, domain_origin, renderFocus, renderContext, noTransition) {
		let parameters = this.parameters,
			width = parameters.width,
			height = parameters.height,
			margins = parameters.margins,
			margins2 = parameters.margins2,
			binSetting = parameters.binSetting;

		// if (domain_origin === undefined) { domain_origin = binSetting.domain_origin; }
		// console.log('render', data, domain_origin);

		let innerWidth = width - margins.left - margins.right,
			innerHeight = height - margins.top - margins.bottom,
			innerHeight2 = height - margins2.top - margins2.bottom;


		if (renderFocus) {
			if (this.backgroundInited_Focus) {
				let { areapath, xAxis } = drawTimelinechart_d3(this.g, this.axesG, data, domain_origin, innerWidth, innerHeight, {
					area: this.area, xScale: this.xScale, yScale: this.yScale,
					drawXAxis: true, drawYAxis: true,
					noTransition,
				})
				this.areapath = areapath; this.xAxis = xAxis;
			} else {
				// background
				let { area, xScale, yScale, areapath: areapath_b } = drawTimelinechart_d3(this.g_b, this.axesG, data, domain_origin, innerWidth, innerHeight, {
					yScale: this.yScale,
					opacity: 0.5,
					noTransition,
				});
				this.areapath_b = areapath_b;
				this.area = area; this.xScale = xScale; this.yScale = yScale;
				this.backgroundInited_Focus = true;
				// foreground
				let { areapath, xAxis } = drawTimelinechart_d3(this.g, this.axesG, data, domain_origin, innerWidth, innerHeight, {
					area: this.area, xScale: this.xScale, yScale: this.yScale,
					drawXAxis: true, drawYAxis: true,
					noTransition,
				})
				this.areapath = areapath; this.xAxis = xAxis;
			}
		}
		if (renderContext) {
			if (this.backgroundInited_Context) {
				let { areapath: areapath2 } = drawTimelinechart_d3(this.g2, this.axesG2, data, domain_origin, innerWidth, innerHeight2, {
					area: this.area2, xScale: this.xScale2, yScale: this.yScale2,
					drawXAxis: true,
					noTransition,
				})
				this.areapath2 = areapath2;
			} else {
				// background
				let { area: area2, xScale: xScale2, yScale: yScale2 } = drawTimelinechart_d3(this.g_b2, this.axesG2, data, domain_origin, innerWidth, innerHeight2, {
					opacity: 0.5,
					noTransition,
				});
				this.area2 = area2; this.xScale2 = xScale2; this.yScale2 = yScale2;
				this.backgroundInited_Context = true;
				// foreground
				let { areapath: areapath2 } = drawTimelinechart_d3(this.g2, this.axesG2, data, domain_origin, innerWidth, innerHeight2, {
					area: this.area2, xScale: this.xScale2, yScale: this.yScale2,
					drawXAxis: true,
					noTransition,
				})
				this.areapath2 = areapath2;
			}
		}
	},

	brushend: function () {
		if (!d3.event.sourceEvent || this.no_brushend) { return; }

		let parameters = this.parameters,
			onSelect = parameters.onSelect,
			areapath = this.areapath,
			xScale = this.xScale;

		let s = d3.event.selection;
		if (s == null) {
			// this.g_brush.transition().call(this.brush.move, xScale.range());
			this.range_brushed = null;
			onSelect();
		} else {
			// let binList = [];
			let range = [TO_ORIGIN(xScale.invert(s[0] + BRUSH_MARGIN)), TO_ORIGIN(xScale.invert(s[1] - BRUSH_MARGIN))];
			let range_fit = this.range_brushed = onSelect(range),
				s_fit = [xScale(TO_DATE(range_fit[0])) - BRUSH_MARGIN, xScale(TO_DATE(range_fit[1])) + BRUSH_MARGIN];
			this.g_brush.transition()
				.duration(800)
				.call(this.brush.move, s_fit);
		}
	},

	brushing2: function () {
		if (!d3.event.sourceEvent) { return; }

		let brush = this.brush2,
			g = this.axesG,
			areapath = this.areapath,
			areapath_b = this.areapath_b,
			xScale = this.xScale,
			xScale2 = this.xScale2,
			area = this.area,
			xAxis = this.xAxis;

		let s = d3.event.selection;

		xScale.domain(s == null ? xScale2.domain() : [xScale2.invert(s[0]), xScale2.invert(s[1])]);
		areapath.attr('d', area);
		areapath_b.attr('d', area);
		g.select('.x-axis').call(xAxis);

		if (this.range_brushed) {
			let s_modified = [xScale(TO_DATE(this.range_brushed[0])) - BRUSH_MARGIN, xScale(TO_DATE(this.range_brushed[1])) + BRUSH_MARGIN];
			this.no_brushend = true;
			this.g_brush.call(this.brush.move, s_modified);
			this.no_brushend = false;
		}

		// this.refreshFocus();
		this.refreshFocus({ overview: true, reset: s == null, noTransition: true });
	},

	// brushstart2: function () {
	// },

	// brushend2: function () {
	// 	if (!d3.event.sourceEvent) { return; }
	// 	let s = d3.event.selection;
	// 	this.refreshFocus({ reset: s == null });
	// },
};

function drawTimelinechart_setup(data, domain_origin, width, height, options_) {
	let options = Object.assign({
		// opacity: d => d.value < 0.000000001 ? 0 : 1,
		opacity: 1,
		useLog: false,
		fill: 'steelblue',
	}, options_);

	let maxValue = d3.max(data, d => d.value),
		xScale = options.xScale || d3.scaleTime().domain(domain_origin.map(TO_DATE)).range([1, width]),
		yScale = options.yScale || d3.scaleLinear().domain([0, maxValue]).range([height - 1, 0]);

	let area;
	if (options.area) {
		area = options.area;
	} else {

		let x = d => xScale(TO_DATE(d.origin)),
			y = d => yScale(d.value);

		// interpolateNames = ['d3.curveLinear','d3.curveStepBefore','d3.curveStepAfter','d3.curveBasis','d3.curveBasisOpen', 'd3.curveBasisClosed', 'd3.curveBundle','d3.curveCardinal','d3.curveCardinal','d3.curveCardinalOpen','d3.curveCardinalClosed','d3.curveNatural'];

		area = d3.area()
			.curve(d3.curveNatural)
			.x(x)
			.y0(height)
			.y1(y);
	}

	let opacity = options.opacity;

	return {
		options,
		area, xScale, yScale,
		opacity,
	};
}

export function drawTimelinechart_d3(g, axesG, data, domain_origin, width, height, options_) {
	let {
		options,
		area, xScale, yScale,
		opacity,
	} = drawTimelinechart_setup(data, domain_origin, width, height, options_);

	let areapath = g.selectAll('.areapath').data([data]),
		areapath_enter = areapath.enter().append('path'),
		areapath_update = areapath.merge(areapath_enter)
			.style('fill', options.fill)
			.style('opacity', opacity)
			.attr('class', d => `areapath [${d.index}] '${d.value}'`),
		areapath_exit = areapath.exit()
			.style('opacity', 0);
	if (options.noTransition) {
		areapath_update.attr('d', area);
	} else {
		areapath_update.transition()
			.attr('d', area);
	}
	// .on('click', d => { onSelect([d.origin]); d3.event.stopPropagation(); }),

	let xAxis = d3.axisBottom(xScale).ticks(10),
		yAxis = d3.axisLeft(yScale).ticks(5);
	axesG.selectAll('*').remove();
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
	}
	// 绘制网格线
	// var grid = axesG.selectAll('.grid')
	// 	.data(yScale.ticks(5))
	// 	.enter().append('g')
	// 	.attr('class', 'grid');
	// grid.append('line')
	// 	.attr('y1', yScale)
	// 	.attr('y2', yScale)
	// 	.attr('x1', 0)
	// 	.attr('x2', width)
	// 	.style('stroke', '#d6d6d6');

	return {
		options,
		area, xScale, yScale, xAxis, yAxis,
		opacity,
		areapath: areapath_update,
	};
}
