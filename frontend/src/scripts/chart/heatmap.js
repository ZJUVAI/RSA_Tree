'use strict';

import * as d3 from 'd3';
import Timer from '../test/timer';
import { generateUUID } from '../utility/utility';
import COLORBREWER from '../utility/colorbrewer';

module.exports = Heatmap;
module.exports.default = Heatmap;

// const COLOR_HEATMAP_DEFAULT = d3.scaleLinear()
// 	.interpolate(d3.interpolateRgb)
// 	.domain([0, 0.25, 0.5, 0.75, 1])
// 	.range([d3.rgb(255, 255, 212), d3.rgb(254, 217, 142), d3.rgb(254, 153, 41), d3.rgb(217, 95, 14), d3.rgb(153, 52, 4), d3.rgb(153, 52, 4)]);
const COLOR_HEATMAP_DEFAULT = d3.scaleLinear()
	.interpolate(d3.interpolateRgb)
	.domain([0, 0.2, 0.4, 0.6, 0.8, 1])
	// .range(["#f1eef6", "#d0d1e6", "#a6bddb", "#74a9cf", "#2b8cbe", "#045a8d"]);
	// .range(["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"]);
	.range(COLORBREWER['Oranges'][6]);

const COLOR_HEATMAP_ERROR = d3.scaleLinear()
	.interpolate(d3.interpolateRgb)
	.domain([0, 0.2, 0.4, 0.6, 0.8, 1])
	// .range(["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26", "#a50f15"]);
	// .range(["#feedde", "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"]);
	.range(COLORBREWER['Reds'][6]);

function Heatmap(parameters) {
	this.parameters = Object.assign({
		map: null,
		svg: null,
		resolution: [2, 2],
		fitGrid: (boundingbox, targetSize) => ({ boundingbox, size: targetSize, boundingbox_origin: boundingbox }),
		getValue: (finish) => finish([]),
		onSelect: (filter) => { console.log('Heatmap::onSelect', filter, '(default)'); },
		onRefresh: () => { },
		refreshOptions: {},
	}, parameters);

	// this.init();
}

Heatmap.prototype = {

	init: function () {
		let parameters = this.parameters,
			map = parameters.map,
			svg = parameters.svg, $svg;
		if (svg == null) {
			let svgId = `heatmap-svg-${generateUUID({ sep: '_' })}`;
			$svg = $('<svg></svg>').appendTo($(`#${map.getContainer()}`))
				.attr('id', svgId);
			this.parameters.svg = svgId;
		} else {
			$svg = $(`#${svg}`);
		}

		// map.leaflet.on('dragstart', () => { $svg.hide(); });
		// map.leaflet.on('dragend', () => { $svg.show(); this.refresh(); });
		// map.leaflet.on('zoomstart', () => { $svg.hide(); });
		// map.leaflet.on('zoom', () => { $svg.show(); this.refresh(); });
		map.leaflet.on('dragend', () => { this.refresh(); });
		map.leaflet.on('zoom', () => { this.refresh(); });


		this.width = $svg.width();
		this.height = $svg.height();

		this.refresh(arguments);
	},

	refresh: function (options_, x, y) {
		let parameters = this.parameters,
			map = parameters.map,
			mapContainer = $(`#${map.getContainer()}`),
			svg = parameters.svg,
			$svg = $(`#${svg}`),
			targetRes = parameters.resolution,
			fitGrid = parameters.fitGrid,
			getValue = parameters.getValue,
			onRefresh = parameters.onRefresh;

		let options = Object.assign({ test: false, loop: 10, render: true }, parameters.refreshOptions, options_),
			render = options.render;


		// let timer1 = new Timer({ name: `scale alignment` });
		// timer1.start();
		// identify canvas size
		// let width = $svg.width(),
		// 	height = $svg.height(),
		let width = this.width,
			height = this.height,
			// translate to map
			[[x0, x1], [y0, y1]] = map.toMap_boundingbox([[0, width], [0, height]]),
			width_map = x1 - x0,
			height_map = y1 - y0,
			heatmapCellSize = Math.max(width_map / targetRes[0], height_map / targetRes[1]);
		console.log([x0, x1, y0, y1]);
		// scale alignment
		let { boundingbox_origin, boundingbox, size } = fitGrid([[x0, x1], [y0, y1]], [heatmapCellSize, heatmapCellSize]),
			[[x0_scale, x1_scale], [y0_scale, y1_scale]] = boundingbox,
			width_scale = x1_scale - x0_scale,
			height_scale = y1_scale - y0_scale;
		// decide actual resolution
		let resolution = [Math.ceil(width_scale / size[0]), Math.ceil(height_scale / size[1])],
			boundingbox_revision = [
				[boundingbox[0][0], boundingbox[0][0] + resolution[0] * size[0]],
				[boundingbox[1][0], boundingbox[1][0] + resolution[1] * size[1]],
			];

		// timer1.stop();
		// timer1.print();

		console.log('Heatmap::refresh', 'grid', boundingbox, size, resolution);

		// let timer2 = new Timer({ name: `test` });
		// timer2.start();
		let data = [], value;
		// if (test) {
		// 	let timer = new Timer({ name: `calculate-heatmap-${map.getContainer()}` });
		// 	for (let l = 0; l < loop; l += 1) {
		// 		let timerName = `${l}`;
		// 		timer.start(timerName);
		// 		value = undefined;
		// 		for (let i = 0; i < resolution[0]; i += 1) {
		// 			for (let j = 0; j < resolution[1]; j += 1) {
		// 				value = getValue(i, j, value);
		// 			}
		// 		}
		// 		timer.stop(timerName);
		// 	}
		// 	timer.print();
		// }
		// timer2.stop();
		// timer2.print();
		// let timer3 = new Timer({ name: `calculate` });
		// timer3.start();
		// value = undefined;
		// for (let i = 0; i < resolution[0]; i += 1) {
		// 	for (let j = 0; j < resolution[1]; j += 1) {
		// 		// if (i === x && j === y) { debugger; }
		// 		// if (i == 257 && j == 110) { debugger; }
		// 		value = getValue(i, j, value);
		// 		data.push(Object.assign({
		// 			index: [i, j],
		// 			// value: getValue(i, j),
		// 		}, value));
		// 	}
		// }
		// // timer3.stop();
		// // timer3.print();
		// // draw
		// // let timer4 = new Timer({ name: `render` });
		// // timer4.start();
		// if (render) {
		// 	this.render(data, boundingbox_origin, resolution);
		// }
		// // timer4.stop();
		// // timer4.print();

		getValue({
			domain: boundingbox_revision,
			binWidth: [size[0], size[1]],
			binNum: resolution,
		}, (data) => {
			console.log('Heatmap', data);
			// draw
			if (render) {
				this.render(data, boundingbox_origin, resolution, options);
			}
			// onRefresh && onRefresh({ data, domain_origin, domain, binWidth, binNum });
		});
	},

	render: function (data, boundingbox, resolution, options) {
		let parameters = this.parameters,
			map = parameters.map,
			svg = parameters.svg;
		drawHeatmap_d3(svg, data, map.toScreen_boundingbox(boundingbox), resolution, options);
	}
};

function drawHeatmap_setup(data, boundingbox, resolution, options_) {
	let options = Object.assign({
		opacity: d => isNaN(d.value) || d.value < 0.000000001 ? 0 : 1,
		// opacity: d => isNaN(d.value) ? 0 : 1,
		useLog: true,
		drawOnStroke: false,
	}, options_);

	let [[x0, x1], [y0, y1]] = boundingbox;
	let xspan = x1 - x0, yspan = y1 - y0;

	let maxValue = d3.max(data, d => d.value);
	if (!options.drawOnStroke) {
		console.log('Heatmap::drawHeatmap_setup', 'max value', maxValue);
	}

	let width = xspan / resolution[0],
		height = yspan / resolution[1];

	if (options.drawOnStroke) {
		width -= 2; height -= 2;
	}

	let x = d => x0 + xspan * d.index[0] / resolution[0],
		y = d => y1 - yspan * d.index[1] / resolution[1];

	let colorFunc = options.colorFunc || (options.drawOnStroke ? COLOR_HEATMAP_ERROR : COLOR_HEATMAP_DEFAULT);

	let color = options.color || (options.useLog ?
		(function () {
			let scale = d3.scaleLog().domain([1, maxValue + 1]).range([0, 1]);
			return d => colorFunc(scale(d.value + 1));
		})()
		: d => colorFunc(d.value / maxValue));

	// let color = options.color || (options.useLog ?
	// 	(function () {
	// 		let scale = d3.scaleLog().domain([1, maxValue + 1]).range([0, 1]);
	// 		// return d => colorFunc(scale(d.value + 1));
	// 		let maxValue_a = d3.max(data, d => d.a),
	// 			scale_a = d3.scaleLog().domain([1, maxValue_a + 1]).range([0, 1])
	// 		if (options.drawOnStroke) {
	// 			return d => {
	// 				let c1 = d3.rgb(COLOR_HEATMAP_DEFAULT(scale_a(d.a + 1))),
	// 					c2 = d3.rgb(COLOR_HEATMAP_ERROR(scale(d.value) + 1));
	// 				let t = Math.sqrt(d.value);
	// 				return `rgb(${c1.r * (1 - t) + c2.r * t},${c1.g * (1 - t) + c2.g * t},${c1.b * (1 - t) + c2.b * t})`
	// 			}
	// 		} else {
	// 			return d => colorFunc(scale(d.value + 1));
	// 		}
	// 	})()
	// 	: d => colorFunc(d.value / maxValue));

	let opacity = options.opacity;

	return {
		options,
		x, y, width, height,
		color, opacity,
	}
}

export function drawHeatmap_d3(svg, data, boundingbox, resolution, options_) {
	let {
		options,
		x, y, width, height,
		color, opacity,
	} = drawHeatmap_setup(data, boundingbox, resolution, options_);

	let d3_svg = d3.select(`#${svg}`);

	let heatmap = d3_svg.selectAll(`.${options.class || 'heatrect'}`).data(data),
		heatmap_enter = heatmap.enter().append('rect'),
		heatmap_update = heatmap.merge(heatmap_enter)
			.style(options.drawOnStroke ? 'stroke' : 'fill', color)
			.style('opacity', opacity)
			.attr('class', d => `${options.class || 'heatrect'} [${d.index[0]},${d.index[1]}] lat=${d.lat}; lon=${d.lon}; v=${d.value};`)
			.attr('width', width)
			.attr('height', height)
			.attr('x', x)
			.attr('y', y),
		heatmap_exit = heatmap.exit()
			.style('opacity', 0);
}
