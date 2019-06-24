'use strict';

// import Rtree from '../rtree/rtree';
// import SimpleSAT from '../sat/simplesat';
import * as d3 from 'd3';

module.exports = Controller;
module.exports.default = Controller;

const BEST_MULTIPLES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24, 30, 36, 40, 48, 60, 72, 90, 96, 100, 120, 144, 180, 200, 216, 240, 288, 300, 360, 432, 480, 600, 720, 864, 900, 960, 1080, 1200, 1296, 1440, 1800, 2160, 2400, 2592, 2880, 3600, 4320, 4800, 5400, 5760, 6480, 7200, 8640, 10800, 11520, 12960, 14400, 17280, 21600, 23040, 25920, 28800, 32400, 34560, 36000, 43200, 51840, 57600, 64800, 69120, 72000, 77760, 86400, 103680, 108000, 115200, 129600, 138240, 144000, 155520, 172800, 207360, 216000, 259200, 288000, 311040, 324000, 345600, 388800, 414720, 432000, 466560, 518400, 576000, 622080, 648000];

function Controller(parameters) {
	this.parameters = Object.assign({
		data: [], attributes: {},
		scaleAlignment: false,
		granularity: 1,
	}, parameters);

	this.data = this.parameters.data;
	this.dimensions = {};

	this.init();
}

Controller.prototype = {

	init: function () {
		let data = this.data,
			parameters = this.parameters,
			scaleAlignment = parameters.scaleAlignment,
			attributes = parameters.attributes;

		let dimensions = this.dimensions = {};

		for (let [name, attribute] of Object.entries(attributes)) {
			let id = attribute.id,
				domain = attribute.domain,
				scale = attribute.scale,
				type = attribute.type;

			switch (type) {
				case 'ordinal':
					let domainIndex = domain.reduce(function (acc, cur, i) {
						acc[cur] = i;
						return acc;
					}, {});
					dimensions[name] = Object.assign({}, attribute, {
						id, domain,
						scale: [0, domain.length],
						filter_none: [0, domain.length],
						filter: [0, domain.length],
						toScale: d => domainIndex[d],
						toOrigin: d => domain[d],
						// x0: scale[0], x1: scale[1], binNum: 1, binWidth: scale[1] - scale[0],
					});
					break;
				case 'numerical':
					dimensions[name] = Object.assign({}, attribute, {
						id, domain, scale: scale || domain,
						filter_none: scale ? [scale[0], scale[1]] : [domain[0], domain[1]],
						filter: scale ? [scale[0], scale[1]] : [domain[0], domain[1]],
						toScale: scale ? d3.scaleLinear().domain(domain).range(scale) : d => d,
						toOrigin: scale ? d3.scaleLinear().domain(scale).range(domain) : d => d,
						// x0: scale[0], x1: scale[1], binNum: 1, binWidth: scale[1] - scale[0],
					});
					break;
				case 'categorical':
				default:
					console.warn('Controller::init()', 'attribute type not support', type);
			}

			// if (scale != undefined) {
			// 	dimensions[name] = Object.assign({}, attribute, {
			// 		id, domain, scale,
			// 		filter_none: type == 'numerical' ? [scale[0], scale[1]] : [0, scale.length],
			// 		filter: type == 'numerical' ? [scale[0], scale[1]] : [0, scale.length],
			// 		toScale: d3.scaleLinear().domain(domain).range(scale),
			// 		toOrigin: d3.scaleLinear().domain(scale).range(domain),
			// 		// x0: scale[0], x1: scale[1], binNum: 1, binWidth: scale[1] - scale[0],
			// 	});
			// } else {
			// 	dimensions[name] = Object.assign({}, attribute, {
			// 		id, domain,
			// 		filter_none: type == 'numerical' ? [domain[0], domain[1]] : [0, domain.length],
			// 		filter: type == 'numerical' ? [domain[0], domain[1]] : [0, domain.length],
			// 		// toScale: d => d,
			// 		// toOrigin: d => d,
			// 	});
			// }
		}
	},

	toScale: function (name, value) {
		return this.dimensions[name].toScale(value);
	},

	toOrigin: function (name, value) {
		return this.dimensions[name].toOrigin(value);
	},

	toOrigin_boundingbox: function (value) {
		let ret = value instanceof Array ? Array(value.length) : {};
		for (let [name, dimension] of Object.entries(this.dimensions)) {
			if (value.hasOwnProperty(name)) {
				ret[name] = [dimension.toOrigin(value[name][0]), dimension.toOrigin(value[name][1])];
			}
		}
		return ret;
	},

	fitGrid: function (boundingbox, size, forceSqure = false) {
		let parameters = this.parameters,
			granularity = parameters.granularity,
			scaleAlignment = parameters.scaleAlignment;

		let boundingbox_fit = boundingbox instanceof Array ? Array(boundingbox.length) : {},
			boundingbox_scale = boundingbox instanceof Array ? Array(boundingbox.length) : {},
			size_scale = size instanceof Array ? Array(size.length) : {},
			resolution_scale = size instanceof Array ? Array(size.length) : {};
		let squre_width = undefined;
		for (let [name, dimension] of Object.entries(this.dimensions)) {
			if (boundingbox.hasOwnProperty(name)) {
				let { domain_origin, domain, binWidth, binNum, x0, x1 } = this.fitBin(dimension, boundingbox[name], size[name], squre_width);
				boundingbox_fit[name] = domain_origin;
				boundingbox_scale[name] = domain;
				size_scale[name] = binWidth;
				resolution_scale[name] = binNum;
				Object.assign(dimension, {
					x0, x1, binNum, binWidth,
				});
				if (forceSqure) { squre_width = binWidth; }
			}
		}
		return { boundingbox_origin: boundingbox_fit, boundingbox: boundingbox_scale, size: size_scale, resolution: resolution_scale };
	},

	fitBin: function (dimension, domain, width, forceWidth) {
		if (dimension instanceof String || typeof dimension === "string") { dimension = this.dimensions[dimension]; }
		if (dimension.type === 'categorical' || dimension.type === 'ordinal') {
			return {
				domain_origin_cat: dimension.domain,
				domain_cat: dimension.domain.map((_, i) => i),
				domain_origin: [0, dimension.domain.length - 1],
				domain: [0, dimension.domain.length - 1],
				binWidth: 1,
				binNum: dimension.domain.length,
			}
		}

		let parameters = this.parameters,
			granularity = parameters.granularity,
			scaleAlignment = parameters.scaleAlignment;
		domain = domain || dimension.domain;

		let [x0, x1] = domain;
		let x0_fit = dimension.toScale(x0),
			x1_fit = dimension.toScale(x1),
			width_fit = forceWidth || dimension.toScale(width) - dimension.toScale(0);
		if (scaleAlignment) {
			// x0_fit = findBestMultiple_floor(x0_fit / granularity) * granularity;
			// x1_fit = findBestMultiple_ceil(x1_fit / granularity) * granularity;
			width_fit = forceWidth || findBestMultiple(width_fit / granularity) * granularity;
			if (width_fit === 0) { width_fit = granularity; }
			x0_fit = Math.floor(x0_fit / width_fit) * width_fit;
		}
		let binNum = Math.ceil((x1_fit - x0_fit) / width_fit);
		x1_fit = x0_fit + width_fit * binNum;

		return {
			domain_origin: [dimension.toOrigin(x0_fit), dimension.toOrigin(x1_fit)],
			domain: [x0_fit, x1_fit],
			binWidth: width_fit,
			binNum,
			x0: x0_fit, x1: x1_fit,
		}
	},

	fitRange: function (dimension, domain) {
		if (dimension instanceof String || typeof dimension === "string") { dimension = this.dimensions[dimension]; }
		if (dimension.type === 'categorical' || dimension.type === 'ordinal') {
			return {
				domain_origin: dimension.domain,
				domain: dimension.domain.map((_, i) => i),
			}
		}

		let parameters = this.parameters,
			granularity = parameters.granularity,
			scaleAlignment = parameters.scaleAlignment;
		domain = domain || dimension.domain;

		let [x0, x1] = domain;
		let x0_fit = dimension.toScale(x0),
			x1_fit = dimension.toScale(x1),
			width_fit = dimension.toScale(x1 - x0) - dimension.toScale(0);
		if (scaleAlignment) {
			// x0_fit = findBestMultiple_floor(x0_fit / granularity) * granularity;
			// x1_fit = findBestMultiple_ceil(x1_fit / granularity) * granularity;
			// x0_fit = Math.floor(x0_fit / granularity) * granularity;
			// x1_fit = Math.ceil(x1_fit / granularity) * granularity;
			width_fit = findBestMultiple(width_fit / granularity) * granularity;
			if (width_fit === 0) { width_fit = granularity; }
			x0_fit = Math.floor(x0_fit / width_fit) * width_fit;
		}
		x1_fit = x0_fit + width_fit;
		
		return {
			domain_origin: [dimension.toOrigin(x0_fit), dimension.toOrigin(x1_fit)],
			domain: [x0_fit, x1_fit],
			x0: x0_fit, x1: x1_fit,
		}
	},

	getInterval: function (name, idx) {
		let dimension = this.dimensions[name];
		switch (dimension.type) {
			case 'categorical':
			case 'ordinal':
				return [idx, idx + 1];
			case 'numerical':
				let binWidth = dimension.binWidth,
					x1 = dimension.x0 + binWidth * idx,
					x2 = x1 + binWidth;
				return [x1, x2];
		}
	},

	getQueryRange: function (filter) {
		let dimensions = this.dimensions,
			queryRange = Array(dimensions.length);
		for (let [name, dimension] of Object.entries(dimensions)) {
			let id = dimension.id,
				filter_d = dimension.filter;
			if (filter.hasOwnProperty(name)) {
				queryRange[id] = [Math.max(filter[name][0], filter_d[0]), Math.min(filter[name][1], filter_d[1])];
			} else {
				queryRange[id] = filter_d;
			}
		}
		return queryRange;
	},

	generateQueryGrid: function (grid) {
		let dimensions = this.dimensions,
			queryGrid = Array(dimensions.length);
		for (let [name, dimension] of Object.entries(dimensions)) {
			let id = dimension.id,
				filter_d = dimension.filter;
			if (grid.hasOwnProperty(name)) {
				queryGrid[id] = grid[name];
			} else {
				queryGrid[id] = {
					x0: filter_d[0],
					binWidth: filter_d[1],
					binNum: 1,
				};
			}
			Object.assign(queryGrid[id], {
				min: filter_d[0],
				max: filter_d[1],
			});
		}
		return queryGrid;
	},

	filter: function (name, filter) {
		let dimension = this.dimensions[name];
		switch (dimension.type) {
			case 'numerical':
				let { domain_origin, domain } = this.fitRange(dimension, filter);
				dimension.filter = domain;
				return domain_origin;
			case 'categorical': case 'ordinal': default:
				dimension.filter = filter || dimension.filter_none;
				return dimension.filter;
		}
	},

	matchFilter_origin: function (value) {
		for (let [name, dimension] of Object.entries(this.dimensions)) {
			let x;
			if (value instanceof Array) {
				x = value[dimension.id];
			} else {
				// if (!value.hasOwnProperty(name)) {
				// 	return false;
				// }
				x = value[name];
			}
			if (dimension.toScale) { x = dimension.toScale(x); }
			if (x < dimension.filter[0] || x > dimension.filter[1]) { return false; }
		}
		return true;
	},
};

// function getCategoricalDomain(data, access) {
// 	let set = new Set();
// 	for (let datum of data) {
// 		set.add(access(datum));
// 	}
// 	return Array.from(set);
// }

// function getNumericalDomain(data, access) {
// 	let values = data.map(access),
// 		min = values[0], max = values[0];
// 	for (let i = 1; i < values.length; i += 1) {
// 		let value = values[i];
// 		// if (value < 1) { debugger; }
// 		if (value < min) { min = value; }
// 		if (value > max) { max = value; }
// 	}
// 	return [min, max];
// }

function findBestMultiple(value) {
	for (let i = 0; i < BEST_MULTIPLES.length; i += 1) {
		let multiple = BEST_MULTIPLES[i];
		if (multiple == value) { return multiple; }
		if (multiple > value) {
			if (i == 0) { return multiple; }
			let last = BEST_MULTIPLES[i - 1];
			if (multiple - value < value - last) {
				return multiple;
			} else {
				return last;
			}
		}
	}
}

function findBestMultiple_floor(value) {
	for (let i = 0; i < BEST_MULTIPLES.length; i += 1) {
		let multiple = BEST_MULTIPLES[i];
		if (multiple == value) { return multiple; }
		if (multiple > value) {
			if (i == 0) { return multiple; }
			return BEST_MULTIPLES[i - 1];
		}
	}
}

function findBestMultiple_ceil(value) {
	for (let i = 0; i < BEST_MULTIPLES.length; i += 1) {
		let multiple = BEST_MULTIPLES[i];
		if (multiple == value) { return multiple; }
		if (multiple > value) {
			return BEST_MULTIPLES[i];
		}
	}
}

/* 生成2,3,5为约数的数用于倍数（可以被更好的整除）*/
// let values = new Set();
// for (let i = 0; i < 100; i++) {
// 	for (let j = Math.max(0, Math.floor((i - 1) * 2 / 3 / 2)); j <= Math.ceil((i + 1) * 2 / 3); j++) {
// 		for (let k = Math.max(0, Math.floor((i - 1) * 2 / 5 / 2), Math.floor((j - 2) * 3 / 5 / 2)); k <= Math.min(Math.ceil((i + 1) * 2 / 5), Math.ceil((j + 2) * 3 / 5)); k++) {
// 			values.add(1 * Math.pow(2, i) * Math.pow(3, j) * Math.pow(5, k));
// 		}
// 	}
// }
// console.log(Array.from(values.entries()).map(d => d[0]).sort((a, b) => a - b));