'use strict';

let ndarray = require('ndarray');
let pool = require('typedarray-pool');
let interp_funcs = require('../utility/interp_funcs');

module.exports = SimpleSAT;
module.exports.default = SimpleSAT;

function SimpleSAT(parameters) {
	this.parameters = Object.assign({
		dim: 3,
	}, parameters);

	let dim = this.parameters.dim,
		nodeNum = this.parameters.nodeNum;

	this.tables = Array(nodeNum);
	this.calculate_queries = [];

	this.p = Array.from(Array(dim), () => 0);
	this.pow2 = this.p.map((_, i) => 1 << (dim - i - 1));
	this.pp = [];

	for (let i = 0; i < 1 << dim; i += 1) {
		// p = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
		let p = this.p.map((_, ii) => Math.sign(i & this.pow2[ii]));
		this.pp.push(p);
	}
}

SimpleSAT.prototype = {

	get: function (idx, ...ii) {
		let table = this.tables[idx],
			offset = table.index(...ii),
			data = table.data;
		return data[offset];
	},

	calculate_start: function () {
		this.calculate_queries = [];
	},

	calculate_add: function (idx, rect) {
		this.calculate_queries.push({ idx, rect });
	},

	calculate: function (calculateUncertainty = true) {
		// calculateUncertainty = false;
		let dim = this.parameters.dim,
			queries = this.calculate_queries,
			tables = this.tables;

		if (!queries.length) {
			return null;
			// { value: 0, uncertainty: { all: 0, up: 0, down: 0 }, intersects: 0, aligned: { all: 0, accurate: 0 } };
		}

		let k, idx, rect, table, domain, tableData, binNums, binWidths;

		let xRange, xi, xi_, xt, xi_r;

		let retValue = 0, uncertainty = 0, uncertaintyU = 0, uncertaintyD = 0;

		let aligned_all = 0, aligned_accurate = 0;
		if (dim === 1) {
			let interp = interp_funcs.interp_funcs[1];
			k = queries.length;
			while (k--) {
				idx = queries[k].idx;
				rect = queries[k].rect;
				table = tables[idx];
				// domain = tablesInfo[idx].domain;
				domain = table.domain;
				tableData = table.data;
				binNums = table.binNums;
				binWidths = table.binWidths;
				interp_funcs.set(tables, dim, binNums, 1); // TODO

				xRange = [
					(Math.max(domain[0][0], rect[0][0]) - domain[0][0]) / binWidths[0],
					(Math.min(domain[0][1], rect[0][1]) - domain[0][0]) / binWidths[0],
				];

				xi = [Math.floor(xRange[0]), Math.floor(xRange[1])];
				xt = [xRange[0] - xi[0], xRange[1] - xi[1]];
				xi_ = xi.map((d, i) => xt[i] === 0 ? d : d + 1);
				xi_r = xi.map((d, i) => xt[i] <= 0.5 ? d : d + 1);
				aligned_all += xi_.length;
				aligned_accurate += xt.map(d => d === 0 ? 1 : 0).reduce((a, b) => a + b, 0);

				let upper = !calculateUncertainty ? 0 :
					- tableData.get(xi[0])
					+ tableData.get(xi_[1]);

				let lower = !calculateUncertainty ? 0 : (xi_[0] >= xi[1] || xi_[2] >= xi[3]
					? 0 :
					- tableData.get(xi_[0])
					+ tableData.get(xi[1]));

				let value =
					- tableData.get(xi_r[0])
					+ tableData.get(xi_r[1]);

				// value = Math.round(value);

				uncertainty += upper - lower;// / value;
				uncertaintyU += upper - value;
				uncertaintyD += value - lower;
				retValue += value;

				// retValue = Math.max(retValue, interp(tableData, xi[0], xt[0], xi[2], xt[2]));
			}
		} else if (dim === 2) {
			let interp = interp_funcs.interp_funcs[2];
			k = queries.length;
			while (k--) {
				idx = queries[k].idx;
				rect = queries[k].rect;
				table = tables[idx];
				// domain = tablesInfo[idx].domain;
				domain = table.domain;
				tableData = table.data;
				binNums = table.binNums;
				binWidths = table.binWidths;
				interp_funcs.set(tables, dim, binNums, 1); // TODO

				xRange = [
					(Math.max(domain[0][0], rect[0][0]) - domain[0][0]) / binWidths[0],
					(Math.min(domain[0][1], rect[0][1]) - domain[0][0]) / binWidths[0],
					(Math.max(domain[1][0], rect[1][0]) - domain[1][0]) / binWidths[1],
					(Math.min(domain[1][1], rect[1][1]) - domain[1][0]) / binWidths[1],
				];

				xi = [Math.floor(xRange[0]), Math.floor(xRange[1]), Math.floor(xRange[2]), Math.floor(xRange[3])];
				xt = [xRange[0] - xi[0], xRange[1] - xi[1], xRange[2] - xi[2], xRange[3] - xi[3]];
				xi_ = xi.map((d, i) => xt[i] === 0 ? d : d + 1);
				xi_r = xi.map((d, i) => xt[i] <= 0.5 ? d : d + 1);
				aligned_all += xi_.length;
				aligned_accurate += xt.map(d => d === 0 ? 1 : 0).reduce((a, b) => a + b, 0);

				let upper = !calculateUncertainty ? 0 : tableData.get(xi[0], xi[2])
					- tableData.get(xi[0], xi_[3])
					- tableData.get(xi_[1], xi[2])
					+ tableData.get(xi_[1], xi_[3]);

				let lower = !calculateUncertainty ? 0 : (xi_[0] >= xi[1] || xi_[2] >= xi[3]
					? 0
					: tableData.get(xi_[0], xi_[2])
					- tableData.get(xi_[0], xi[3])
					- tableData.get(xi[1], xi_[2])
					+ tableData.get(xi[1], xi[3]));

				let value = tableData.get(xi_r[0], xi_r[2])
					- tableData.get(xi_r[0], xi_r[3])
					- tableData.get(xi_r[1], xi_r[2])
					+ tableData.get(xi_r[1], xi_r[3]);

				// value = Math.round(value);

				uncertainty += upper - lower;// / value;
				uncertaintyU += upper - value;
				uncertaintyD += value - lower;
				retValue += value;

				// retValue = Math.max(retValue, interp(tableData, xi[0], xt[0], xi[2], xt[2]));
			}
		} else if (dim == 3) {
			let interp = interp_funcs.interp_funcs[3];
			k = queries.length;
			while (k--) {
				idx = queries[k].idx;
				rect = queries[k].rect;
				table = tables[idx];
				// domain = tablesInfo[idx].domain;
				domain = table.domain;
				tableData = table.data;
				binNums = table.binNums;
				interp_funcs.set(tables, dim, binNums, 1); // TODO

				xRange = [
					(Math.max(domain[0][0], rect[0][0]) - domain[0][0]) * domain[0][2],
					(Math.min(domain[0][1], rect[0][1]) - domain[0][0]) * domain[0][2],
					(Math.max(domain[1][0], rect[1][0]) - domain[1][0]) * domain[1][2],
					(Math.min(domain[1][1], rect[1][1]) - domain[1][0]) * domain[1][2],
					(Math.max(domain[2][0], rect[2][0]) - domain[2][0]) * domain[2][2],
					(Math.min(domain[2][1], rect[2][1]) - domain[2][0]) * domain[2][2],
				];

				xi = [Math.floor(xRange[0]), Math.floor(xRange[1]), Math.floor(xRange[2]), Math.floor(xRange[3]), Math.floor(xRange[4]), Math.floor(xRange[5])];
				xt = [xRange[0] - xi[0], xRange[1] - xi[1], xRange[2] - xi[2], xRange[3] - xi[3], xRange[4] - xi[4], xRange[5] - xi[5]];
				aligned_all += xi_.length;
				aligned_accurate += xt.map(d => d === 0 ? 1 : 0).reduce((a, b) => a + b, 0);

				retValue += interp(tableData, xi[0], xt[0], xi[2], xt[2], x0[4], xt[4])
					- interp(tableData, xi[0], xt[0], xi[2], xt[2], x0[5], xt[5])
					- interp(tableData, xi[0], xt[0], xi[3], xt[3], x0[4], xt[4])
					+ interp(tableData, xi[0], xt[0], xi[3], xt[3], x0[5], xt[5])
					- interp(tableData, xi[1], xt[1], xi[2], xt[2], x0[4], xt[4])
					+ interp(tableData, xi[1], xt[1], xi[2], xt[2], x0[5], xt[5])
					+ interp(tableData, xi[1], xt[1], xi[3], xt[3], x0[4], xt[4])
					- interp(tableData, xi[1], xt[1], xi[3], xt[3], x0[5], xt[5]);
				// retValue = interp(tableData, xi[0], xt[0], xi[3], xt[3]);
			}
		} else if (dim === 4) {
			let interp = interp_funcs.interp_funcs[4];
			k = queries.length;
			while (k--) {
				idx = queries[k].idx;
				rect = queries[k].rect;
				table = tables[idx];
				// domain = tablesInfo[idx].domain;
				domain = table.domain;
				tableData = table.data;
				binNums = table.binNums;
				binWidths = table.binWidths;
				interp_funcs.set(tables, dim, binNums, 4); // TODO

				xRange = [
					(Math.max(domain[0][0], rect[0][0]) - domain[0][0]) / binWidths[0],
					(Math.min(domain[0][1], rect[0][1]) - domain[0][0]) / binWidths[0],
					(Math.max(domain[1][0], rect[1][0]) - domain[1][0]) / binWidths[1],
					(Math.min(domain[1][1], rect[1][1]) - domain[1][0]) / binWidths[1],
					(Math.max(domain[2][0], rect[2][0]) - domain[2][0]) / binWidths[2],
					(Math.min(domain[2][1], rect[2][1]) - domain[2][0]) / binWidths[2],
					(Math.max(domain[3][0], rect[3][0]) - domain[3][0]) / binWidths[3],
					(Math.min(domain[3][1], rect[3][1]) - domain[3][0]) / binWidths[3],
				];

				xi = [Math.floor(xRange[0]), Math.floor(xRange[1]), Math.floor(xRange[2]), Math.floor(xRange[3]), Math.floor(xRange[4]), Math.floor(xRange[5]), Math.floor(xRange[6]), Math.floor(xRange[7])];
				xt = [xRange[0] - xi[0], xRange[1] - xi[1], xRange[2] - xi[2], xRange[3] - xi[3], xRange[4] - xi[4], xRange[5] - xi[5], xRange[6] - xi[6], xRange[7] - xi[7]];
				xi_ = xi.map((d, i) => xt[i] === 0 ? d : d + 1);
				xi_r = xi.map((d, i) => xt[i] <= 0.5 ? d : d + 1);
				aligned_all += xi_.length;
				aligned_accurate += xt.map(d => d === 0 ? 1 : 0).reduce((a, b) => a + b, 0);

				let upper = !calculateUncertainty ? 0 :
					+ tableData.get(xi[0], xi[2], xi[4], xi[6])
					- tableData.get(xi[0], xi[2], xi[4], xi_[7])
					- tableData.get(xi[0], xi[2], xi_[5], xi[6])
					+ tableData.get(xi[0], xi[2], xi_[5], xi_[7])
					- tableData.get(xi[0], xi_[3], xi[4], xi[6])
					+ tableData.get(xi[0], xi_[3], xi[4], xi_[7])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi[6])
					- tableData.get(xi[0], xi_[3], xi_[5], xi_[7])
					- tableData.get(xi_[1], xi[2], xi[4], xi[6])
					+ tableData.get(xi_[1], xi[2], xi[4], xi_[7])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi[6])
					- tableData.get(xi_[1], xi[2], xi_[5], xi_[7])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi[6])
					- tableData.get(xi_[1], xi_[3], xi[4], xi_[7])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi[6])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi_[7]);

				let lower = !calculateUncertainty ? 0 :
					(xi_[0] >= xi[1] || xi_[2] >= xi[3] || xi_[4] >= xi[5] || xi_[6] >= xi[7]
						? 0 :
						+ tableData.get(xi_[0], xi_[2], xi_[4], xi_[6])
						- tableData.get(xi_[0], xi_[2], xi_[4], xi[7])
						- tableData.get(xi_[0], xi_[2], xi[5], xi_[6])
						+ tableData.get(xi_[0], xi_[2], xi[5], xi[7])
						- tableData.get(xi_[0], xi[3], xi_[4], xi_[6])
						+ tableData.get(xi_[0], xi[3], xi_[4], xi[7])
						+ tableData.get(xi_[0], xi[3], xi[5], xi_[6])
						- tableData.get(xi_[0], xi[3], xi[5], xi[7])
						- tableData.get(xi[1], xi_[2], xi_[4], xi_[6])
						+ tableData.get(xi[1], xi_[2], xi_[4], xi[7])
						+ tableData.get(xi[1], xi_[2], xi[5], xi_[6])
						- tableData.get(xi[1], xi_[2], xi[5], xi[7])
						+ tableData.get(xi[1], xi[3], xi_[4], xi_[6])
						- tableData.get(xi[1], xi[3], xi_[4], xi[7])
						- tableData.get(xi[1], xi[3], xi[5], xi_[6])
						+ tableData.get(xi[1], xi[3], xi[5], xi[7]));

				let value =
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6])
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7]);
				value = Math.round(value);

				uncertainty += upper - lower;// / value;
				uncertaintyU += upper - value;
				uncertaintyD += value - lower;
				retValue += value;

				// retValue = Math.max(retValue, interp(tableData, xi[0], xt[0], xi[2], xt[2]));
			}
		} else if (dim === 5) {
			let interp = interp_funcs.interp_funcs[5];
			k = queries.length;
			// if (k > 10) {
			// 	console.log(k);
			// }
			while (k--) {
				idx = queries[k].idx;
				rect = queries[k].rect;
				table = tables[idx];
				// domain = tablesInfo[idx].domain;
				domain = table.domain;
				tableData = table.data;
				binNums = table.binNums;
				binWidths = table.binWidths;
				interp_funcs.set(tables, dim, binNums, 5);

				xRange = [
					(Math.max(domain[0][0], rect[0][0]) - domain[0][0]) / binWidths[0],
					(Math.min(domain[0][1], rect[0][1]) - domain[0][0]) / binWidths[0],

					(Math.max(domain[1][0], rect[1][0]) - domain[1][0]) / binWidths[1],
					(Math.min(domain[1][1], rect[1][1]) - domain[1][0]) / binWidths[1],

					(Math.max(domain[2][0], rect[2][0]) - domain[2][0]) / binWidths[2],
					(Math.min(domain[2][1], rect[2][1]) - domain[2][0]) / binWidths[2],

					(Math.max(domain[3][0], rect[3][0]) - domain[3][0]) / binWidths[3],
					(Math.min(domain[3][1], rect[3][1]) - domain[3][0]) / binWidths[3],

					(Math.max(domain[4][0], rect[4][0]) - domain[4][0]) / binWidths[4],
					(Math.min(domain[4][1], rect[4][1]) - domain[4][0]) / binWidths[4],
				];

				xi = [Math.floor(xRange[0]), Math.floor(xRange[1]), Math.floor(xRange[2]), Math.floor(xRange[3]), Math.floor(xRange[4]), Math.floor(xRange[5]), Math.floor(xRange[6]), Math.floor(xRange[7]), Math.floor(xRange[8]), Math.floor(xRange[9])];
				xt = [xRange[0] - xi[0], xRange[1] - xi[1], xRange[2] - xi[2], xRange[3] - xi[3], xRange[4] - xi[4], xRange[5] - xi[5], xRange[6] - xi[6], xRange[7] - xi[7], xRange[8] - xi[8], xRange[9] - xi[9]];
				xi_ = xi.map((d, i) => xt[i] === 0 ? d : d + 1);
				xi_r = xi.map((d, i) => xt[i] <= 0.5 ? d : d + 1);
				aligned_all += xi_.length;
				aligned_accurate += xt.map(d => d === 0 ? 1 : 0).reduce((a, b) => a + b, 0);

				let upper = !calculateUncertainty ? 0 :
					- tableData.get(xi[0], xi[2], xi[4], xi[6], xi[8])
					+ tableData.get(xi[0], xi[2], xi[4], xi[6], xi_[9])
					+ tableData.get(xi[0], xi[2], xi[4], xi_[7], xi[8])
					- tableData.get(xi[0], xi[2], xi[4], xi_[7], xi_[9])
					+ tableData.get(xi[0], xi[2], xi_[5], xi[6], xi[8])
					- tableData.get(xi[0], xi[2], xi_[5], xi[6], xi_[9])
					- tableData.get(xi[0], xi[2], xi_[5], xi_[7], xi[8])
					+ tableData.get(xi[0], xi[2], xi_[5], xi_[7], xi_[9])
					+ tableData.get(xi[0], xi_[3], xi[4], xi[6], xi[8])
					- tableData.get(xi[0], xi_[3], xi[4], xi[6], xi_[9])
					- tableData.get(xi[0], xi_[3], xi[4], xi_[7], xi[8])
					+ tableData.get(xi[0], xi_[3], xi[4], xi_[7], xi_[9])
					- tableData.get(xi[0], xi_[3], xi_[5], xi[6], xi[8])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi[6], xi_[9])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi_[7], xi[8])
					- tableData.get(xi[0], xi_[3], xi_[5], xi_[7], xi_[9])
					+ tableData.get(xi_[1], xi[2], xi[4], xi[6], xi[8])
					- tableData.get(xi_[1], xi[2], xi[4], xi[6], xi_[9])
					- tableData.get(xi_[1], xi[2], xi[4], xi_[7], xi[8])
					+ tableData.get(xi_[1], xi[2], xi[4], xi_[7], xi_[9])
					- tableData.get(xi_[1], xi[2], xi_[5], xi[6], xi[8])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi[6], xi_[9])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi_[7], xi[8])
					- tableData.get(xi_[1], xi[2], xi_[5], xi_[7], xi_[9])
					- tableData.get(xi_[1], xi_[3], xi[4], xi[6], xi[8])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi[6], xi_[9])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi_[7], xi[8])
					- tableData.get(xi_[1], xi_[3], xi[4], xi_[7], xi_[9])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi[6], xi[8])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi[6], xi_[9])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi_[7], xi[8])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi_[7], xi_[9]);

				let lower = !calculateUncertainty ? 0 : (
					xi_[0] >= xi[1] || xi_[2] >= xi[3] || xi_[4] >= xi[5] || xi_[6] >= xi[7] || xi_[8] >= xi[9]
						? 0 :
						- tableData.get(xi_[0], xi_[2], xi_[4], xi_[6], xi_[8])
						+ tableData.get(xi_[0], xi_[2], xi_[4], xi_[6], xi[9])
						+ tableData.get(xi_[0], xi_[2], xi_[4], xi[7], xi_[8])
						- tableData.get(xi_[0], xi_[2], xi_[4], xi[7], xi[9])
						+ tableData.get(xi_[0], xi_[2], xi[5], xi_[6], xi_[8])
						- tableData.get(xi_[0], xi_[2], xi[5], xi_[6], xi[9])
						- tableData.get(xi_[0], xi_[2], xi[5], xi[7], xi_[8])
						+ tableData.get(xi_[0], xi_[2], xi[5], xi[7], xi[9])
						+ tableData.get(xi_[0], xi[3], xi_[4], xi_[6], xi_[8])
						- tableData.get(xi_[0], xi[3], xi_[4], xi_[6], xi[9])
						- tableData.get(xi_[0], xi[3], xi_[4], xi[7], xi_[8])
						+ tableData.get(xi_[0], xi[3], xi_[4], xi[7], xi[9])
						- tableData.get(xi_[0], xi[3], xi[5], xi_[6], xi_[8])
						+ tableData.get(xi_[0], xi[3], xi[5], xi_[6], xi[9])
						+ tableData.get(xi_[0], xi[3], xi[5], xi[7], xi_[8])
						- tableData.get(xi_[0], xi[3], xi[5], xi[7], xi[9])
						+ tableData.get(xi[1], xi_[2], xi_[4], xi_[6], xi_[8])
						- tableData.get(xi[1], xi_[2], xi_[4], xi_[6], xi[9])
						- tableData.get(xi[1], xi_[2], xi_[4], xi[7], xi_[8])
						+ tableData.get(xi[1], xi_[2], xi_[4], xi[7], xi[9])
						- tableData.get(xi[1], xi_[2], xi[5], xi_[6], xi_[8])
						+ tableData.get(xi[1], xi_[2], xi[5], xi_[6], xi[9])
						+ tableData.get(xi[1], xi_[2], xi[5], xi[7], xi_[8])
						- tableData.get(xi[1], xi_[2], xi[5], xi[7], xi[9])
						- tableData.get(xi[1], xi[3], xi_[4], xi_[6], xi_[8])
						+ tableData.get(xi[1], xi[3], xi_[4], xi_[6], xi[9])
						+ tableData.get(xi[1], xi[3], xi_[4], xi[7], xi_[8])
						- tableData.get(xi[1], xi[3], xi_[4], xi[7], xi[9])
						+ tableData.get(xi[1], xi[3], xi[5], xi_[6], xi_[8])
						- tableData.get(xi[1], xi[3], xi[5], xi_[6], xi[9])
						- tableData.get(xi[1], xi[3], xi[5], xi[7], xi_[8])
						+ tableData.get(xi[1], xi[3], xi[5], xi[7], xi[9]));

				// let value =
				// - interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8])
				// + interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9])
				// + interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8])
				// - interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9])
				// + interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8])
				// - interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9])
				// - interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8])
				// + interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9])
				// + interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8])
				// - interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9])
				// - interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8])
				// + interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9])
				// - interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8])
				// + interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9])
				// + interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8])
				// - interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9])
				// + interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8])
				// - interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9])
				// - interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8])
				// + interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9])
				// - interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8])
				// + interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9])
				// + interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8])
				// - interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9])
				// - interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8])
				// + interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9])
				// + interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8])
				// - interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9])
				// + interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8])
				// - interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9])
				// - interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8])
				// + interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9]);
				// value = Math.round(value);

				let value =
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6], xi_r[8])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6], xi_r[9])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7], xi_r[8])
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7], xi_r[9])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6], xi_r[8])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6], xi_r[9])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7], xi_r[8])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7], xi_r[9])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6], xi_r[8])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6], xi_r[9])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7], xi_r[8])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7], xi_r[9])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6], xi_r[8])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6], xi_r[9])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7], xi_r[8])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7], xi_r[9])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6], xi_r[8])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6], xi_r[9])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7], xi_r[8])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7], xi_r[9])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6], xi_r[8])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6], xi_r[9])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7], xi_r[8])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7], xi_r[9])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6], xi_r[8])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6], xi_r[9])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7], xi_r[8])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7], xi_r[9])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6], xi_r[8])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6], xi_r[9])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7], xi_r[8])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7], xi_r[9]);

				if (value < 0 || upper < 0 || lower < 0 || upper < lower || upper < value || value < lower) {
					debugger;
				}
				// if (lower !== upper) {
				// 	debugger;
				// }

				uncertainty += upper - lower;// / value;
				uncertaintyU += upper - value;
				uncertaintyD += value - lower;
				retValue += value;
			}
		} else if (dim == 6) {

			let interp = interp_funcs.interp_funcs[6];
			k = queries.length;
			while (k--) {
				idx = queries[k].idx;
				rect = queries[k].rect;
				table = tables[idx];
				// domain = tablesInfo[idx].domain;
				domain = table.domain;
				tableData = table.data;
				binNums = table.binNums;
				binWidths = table.binWidths;
				interp_funcs.set(tables, dim, binNums, 6);

				xRange = [
					(Math.max(domain[0][0], rect[0][0]) - domain[0][0]) / binWidths[0],
					(Math.min(domain[0][1], rect[0][1]) - domain[0][0]) / binWidths[0],

					(Math.max(domain[1][0], rect[1][0]) - domain[1][0]) / binWidths[1],
					(Math.min(domain[1][1], rect[1][1]) - domain[1][0]) / binWidths[1],

					(Math.max(domain[2][0], rect[2][0]) - domain[2][0]) / binWidths[2],
					(Math.min(domain[2][1], rect[2][1]) - domain[2][0]) / binWidths[2],

					(Math.max(domain[3][0], rect[3][0]) - domain[3][0]) / binWidths[3],
					(Math.min(domain[3][1], rect[3][1]) - domain[3][0]) / binWidths[3],

					(Math.max(domain[4][0], rect[4][0]) - domain[4][0]) / binWidths[4],
					(Math.min(domain[4][1], rect[4][1]) - domain[4][0]) / binWidths[4],

					(Math.max(domain[5][0], rect[5][0]) - domain[5][0]) / binWidths[5],
					(Math.min(domain[5][1], rect[5][1]) - domain[5][0]) / binWidths[5],
				];

				xi = [Math.floor(xRange[0]), Math.floor(xRange[1]), Math.floor(xRange[2]), Math.floor(xRange[3]), Math.floor(xRange[4]), Math.floor(xRange[5]), Math.floor(xRange[6]), Math.floor(xRange[7]), Math.floor(xRange[8]), Math.floor(xRange[9]), Math.floor(xRange[10]), Math.floor(xRange[11])];
				xt = [xRange[0] - xi[0], xRange[1] - xi[1], xRange[2] - xi[2], xRange[3] - xi[3], xRange[4] - xi[4], xRange[5] - xi[5], xRange[6] - xi[6], xRange[7] - xi[7], xRange[8] - xi[8], xRange[9] - xi[9], xRange[10] - xi[10], xRange[11] - xi[11]];
				xi_ = xi.map((d, i) => xt[i] === 0 ? d : d + 1);
				xi_r = xi.map((d, i) => xt[i] <= 0.5 ? d : d + 1);
				aligned_all += xi_.length;
				aligned_accurate += xt.map(d => d === 0 ? 1 : 0).reduce((a, b) => a + b, 0);

				let upper =
					+ tableData.get(xi[0], xi[2], xi[4], xi[6], xi[8], xi[10])
					- tableData.get(xi[0], xi[2], xi[4], xi[6], xi[8], xi_[11])
					- tableData.get(xi[0], xi[2], xi[4], xi[6], xi_[9], xi[10])
					+ tableData.get(xi[0], xi[2], xi[4], xi[6], xi_[9], xi_[11])
					- tableData.get(xi[0], xi[2], xi[4], xi_[7], xi[8], xi[10])
					+ tableData.get(xi[0], xi[2], xi[4], xi_[7], xi[8], xi_[11])
					+ tableData.get(xi[0], xi[2], xi[4], xi_[7], xi_[9], xi[10])
					- tableData.get(xi[0], xi[2], xi[4], xi_[7], xi_[9], xi_[11])
					- tableData.get(xi[0], xi[2], xi_[5], xi[6], xi[8], xi[10])
					+ tableData.get(xi[0], xi[2], xi_[5], xi[6], xi[8], xi_[11])
					+ tableData.get(xi[0], xi[2], xi_[5], xi[6], xi_[9], xi[10])
					- tableData.get(xi[0], xi[2], xi_[5], xi[6], xi_[9], xi_[11])
					+ tableData.get(xi[0], xi[2], xi_[5], xi_[7], xi[8], xi[10])
					- tableData.get(xi[0], xi[2], xi_[5], xi_[7], xi[8], xi_[11])
					- tableData.get(xi[0], xi[2], xi_[5], xi_[7], xi_[9], xi[10])
					+ tableData.get(xi[0], xi[2], xi_[5], xi_[7], xi_[9], xi_[11])
					- tableData.get(xi[0], xi_[3], xi[4], xi[6], xi[8], xi[10])
					+ tableData.get(xi[0], xi_[3], xi[4], xi[6], xi[8], xi_[11])
					+ tableData.get(xi[0], xi_[3], xi[4], xi[6], xi_[9], xi[10])
					- tableData.get(xi[0], xi_[3], xi[4], xi[6], xi_[9], xi_[11])
					+ tableData.get(xi[0], xi_[3], xi[4], xi_[7], xi[8], xi[10])
					- tableData.get(xi[0], xi_[3], xi[4], xi_[7], xi[8], xi_[11])
					- tableData.get(xi[0], xi_[3], xi[4], xi_[7], xi_[9], xi[10])
					+ tableData.get(xi[0], xi_[3], xi[4], xi_[7], xi_[9], xi_[11])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi[6], xi[8], xi[10])
					- tableData.get(xi[0], xi_[3], xi_[5], xi[6], xi[8], xi_[11])
					- tableData.get(xi[0], xi_[3], xi_[5], xi[6], xi_[9], xi[10])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi[6], xi_[9], xi_[11])
					- tableData.get(xi[0], xi_[3], xi_[5], xi_[7], xi[8], xi[10])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi_[7], xi[8], xi_[11])
					+ tableData.get(xi[0], xi_[3], xi_[5], xi_[7], xi_[9], xi[10])
					- tableData.get(xi[0], xi_[3], xi_[5], xi_[7], xi_[9], xi_[11])
					- tableData.get(xi_[1], xi[2], xi[4], xi[6], xi[8], xi[10])
					+ tableData.get(xi_[1], xi[2], xi[4], xi[6], xi[8], xi_[11])
					+ tableData.get(xi_[1], xi[2], xi[4], xi[6], xi_[9], xi[10])
					- tableData.get(xi_[1], xi[2], xi[4], xi[6], xi_[9], xi_[11])
					+ tableData.get(xi_[1], xi[2], xi[4], xi_[7], xi[8], xi[10])
					- tableData.get(xi_[1], xi[2], xi[4], xi_[7], xi[8], xi_[11])
					- tableData.get(xi_[1], xi[2], xi[4], xi_[7], xi_[9], xi[10])
					+ tableData.get(xi_[1], xi[2], xi[4], xi_[7], xi_[9], xi_[11])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi[6], xi[8], xi[10])
					- tableData.get(xi_[1], xi[2], xi_[5], xi[6], xi[8], xi_[11])
					- tableData.get(xi_[1], xi[2], xi_[5], xi[6], xi_[9], xi[10])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi[6], xi_[9], xi_[11])
					- tableData.get(xi_[1], xi[2], xi_[5], xi_[7], xi[8], xi[10])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi_[7], xi[8], xi_[11])
					+ tableData.get(xi_[1], xi[2], xi_[5], xi_[7], xi_[9], xi[10])
					- tableData.get(xi_[1], xi[2], xi_[5], xi_[7], xi_[9], xi_[11])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi[6], xi[8], xi[10])
					- tableData.get(xi_[1], xi_[3], xi[4], xi[6], xi[8], xi_[11])
					- tableData.get(xi_[1], xi_[3], xi[4], xi[6], xi_[9], xi[10])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi[6], xi_[9], xi_[11])
					- tableData.get(xi_[1], xi_[3], xi[4], xi_[7], xi[8], xi[10])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi_[7], xi[8], xi_[11])
					+ tableData.get(xi_[1], xi_[3], xi[4], xi_[7], xi_[9], xi[10])
					- tableData.get(xi_[1], xi_[3], xi[4], xi_[7], xi_[9], xi_[11])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi[6], xi[8], xi[10])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi[6], xi[8], xi_[11])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi[6], xi_[9], xi[10])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi[6], xi_[9], xi_[11])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi_[7], xi[8], xi[10])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi_[7], xi[8], xi_[11])
					- tableData.get(xi_[1], xi_[3], xi_[5], xi_[7], xi_[9], xi[10])
					+ tableData.get(xi_[1], xi_[3], xi_[5], xi_[7], xi_[9], xi_[11]);

				let lower = xi_[0] >= xi[1] || xi_[2] >= xi[3] || xi_[4] >= xi[5] || xi_[6] >= xi[7] || xi_[8] >= xi[9] || xi_[10] >= xi[11]
					? 0 :
					+ tableData.get(xi_[0], xi_[2], xi_[4], xi_[6], xi_[8], xi_[10])
					- tableData.get(xi_[0], xi_[2], xi_[4], xi_[6], xi_[8], xi[11])
					- tableData.get(xi_[0], xi_[2], xi_[4], xi_[6], xi[9], xi_[10])
					+ tableData.get(xi_[0], xi_[2], xi_[4], xi_[6], xi[9], xi[11])
					- tableData.get(xi_[0], xi_[2], xi_[4], xi[7], xi_[8], xi_[10])
					+ tableData.get(xi_[0], xi_[2], xi_[4], xi[7], xi_[8], xi[11])
					+ tableData.get(xi_[0], xi_[2], xi_[4], xi[7], xi[9], xi_[10])
					- tableData.get(xi_[0], xi_[2], xi_[4], xi[7], xi[9], xi[11])
					- tableData.get(xi_[0], xi_[2], xi[5], xi_[6], xi_[8], xi_[10])
					+ tableData.get(xi_[0], xi_[2], xi[5], xi_[6], xi_[8], xi[11])
					+ tableData.get(xi_[0], xi_[2], xi[5], xi_[6], xi[9], xi_[10])
					- tableData.get(xi_[0], xi_[2], xi[5], xi_[6], xi[9], xi[11])
					+ tableData.get(xi_[0], xi_[2], xi[5], xi[7], xi_[8], xi_[10])
					- tableData.get(xi_[0], xi_[2], xi[5], xi[7], xi_[8], xi[11])
					- tableData.get(xi_[0], xi_[2], xi[5], xi[7], xi[9], xi_[10])
					+ tableData.get(xi_[0], xi_[2], xi[5], xi[7], xi[9], xi[11])
					- tableData.get(xi_[0], xi[3], xi_[4], xi_[6], xi_[8], xi_[10])
					+ tableData.get(xi_[0], xi[3], xi_[4], xi_[6], xi_[8], xi[11])
					+ tableData.get(xi_[0], xi[3], xi_[4], xi_[6], xi[9], xi_[10])
					- tableData.get(xi_[0], xi[3], xi_[4], xi_[6], xi[9], xi[11])
					+ tableData.get(xi_[0], xi[3], xi_[4], xi[7], xi_[8], xi_[10])
					- tableData.get(xi_[0], xi[3], xi_[4], xi[7], xi_[8], xi[11])
					- tableData.get(xi_[0], xi[3], xi_[4], xi[7], xi[9], xi_[10])
					+ tableData.get(xi_[0], xi[3], xi_[4], xi[7], xi[9], xi[11])
					+ tableData.get(xi_[0], xi[3], xi[5], xi_[6], xi_[8], xi_[10])
					- tableData.get(xi_[0], xi[3], xi[5], xi_[6], xi_[8], xi[11])
					- tableData.get(xi_[0], xi[3], xi[5], xi_[6], xi[9], xi_[10])
					+ tableData.get(xi_[0], xi[3], xi[5], xi_[6], xi[9], xi[11])
					- tableData.get(xi_[0], xi[3], xi[5], xi[7], xi_[8], xi_[10])
					+ tableData.get(xi_[0], xi[3], xi[5], xi[7], xi_[8], xi[11])
					+ tableData.get(xi_[0], xi[3], xi[5], xi[7], xi[9], xi_[10])
					- tableData.get(xi_[0], xi[3], xi[5], xi[7], xi[9], xi[11])
					- tableData.get(xi[1], xi_[2], xi_[4], xi_[6], xi_[8], xi_[10])
					+ tableData.get(xi[1], xi_[2], xi_[4], xi_[6], xi_[8], xi[11])
					+ tableData.get(xi[1], xi_[2], xi_[4], xi_[6], xi[9], xi_[10])
					- tableData.get(xi[1], xi_[2], xi_[4], xi_[6], xi[9], xi[11])
					+ tableData.get(xi[1], xi_[2], xi_[4], xi[7], xi_[8], xi_[10])
					- tableData.get(xi[1], xi_[2], xi_[4], xi[7], xi_[8], xi[11])
					- tableData.get(xi[1], xi_[2], xi_[4], xi[7], xi[9], xi_[10])
					+ tableData.get(xi[1], xi_[2], xi_[4], xi[7], xi[9], xi[11])
					+ tableData.get(xi[1], xi_[2], xi[5], xi_[6], xi_[8], xi_[10])
					- tableData.get(xi[1], xi_[2], xi[5], xi_[6], xi_[8], xi[11])
					- tableData.get(xi[1], xi_[2], xi[5], xi_[6], xi[9], xi_[10])
					+ tableData.get(xi[1], xi_[2], xi[5], xi_[6], xi[9], xi[11])
					- tableData.get(xi[1], xi_[2], xi[5], xi[7], xi_[8], xi_[10])
					+ tableData.get(xi[1], xi_[2], xi[5], xi[7], xi_[8], xi[11])
					+ tableData.get(xi[1], xi_[2], xi[5], xi[7], xi[9], xi_[10])
					- tableData.get(xi[1], xi_[2], xi[5], xi[7], xi[9], xi[11])
					+ tableData.get(xi[1], xi[3], xi_[4], xi_[6], xi_[8], xi_[10])
					- tableData.get(xi[1], xi[3], xi_[4], xi_[6], xi_[8], xi[11])
					- tableData.get(xi[1], xi[3], xi_[4], xi_[6], xi[9], xi_[10])
					+ tableData.get(xi[1], xi[3], xi_[4], xi_[6], xi[9], xi[11])
					- tableData.get(xi[1], xi[3], xi_[4], xi[7], xi_[8], xi_[10])
					+ tableData.get(xi[1], xi[3], xi_[4], xi[7], xi_[8], xi[11])
					+ tableData.get(xi[1], xi[3], xi_[4], xi[7], xi[9], xi_[10])
					- tableData.get(xi[1], xi[3], xi_[4], xi[7], xi[9], xi[11])
					- tableData.get(xi[1], xi[3], xi[5], xi_[6], xi_[8], xi_[10])
					+ tableData.get(xi[1], xi[3], xi[5], xi_[6], xi_[8], xi[11])
					+ tableData.get(xi[1], xi[3], xi[5], xi_[6], xi[9], xi_[10])
					- tableData.get(xi[1], xi[3], xi[5], xi_[6], xi[9], xi[11])
					+ tableData.get(xi[1], xi[3], xi[5], xi[7], xi_[8], xi_[10])
					- tableData.get(xi[1], xi[3], xi[5], xi[7], xi_[8], xi[11])
					- tableData.get(xi[1], xi[3], xi[5], xi[7], xi[9], xi_[10])
					+ tableData.get(xi[1], xi[3], xi[5], xi[7], xi[9], xi[11]);

				// let value =
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[8], xt[8], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6], xi[9], xt[9], xi[11], xt[11])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[10], xt[10])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[8], xt[8], xi[11], xt[11])
				// 	- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[10], xt[10])
				// 	+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7], xi[9], xt[9], xi[11], xt[11]);


				let value =
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6], xi_r[8], xi_r[10])
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6], xi_r[8], xi_r[11])
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[6], xi_r[9], xi_r[11])
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7], xi_r[9], xi_r[10])
					- tableData.get(xi_r[0], xi_r[2], xi_r[4], xi_r[7], xi_r[9], xi_r[11])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6], xi_r[9], xi_r[10])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[6], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7], xi_r[8], xi_r[10])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7], xi_r[8], xi_r[11])
					- tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[2], xi_r[5], xi_r[7], xi_r[9], xi_r[11])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6], xi_r[9], xi_r[10])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[6], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7], xi_r[8], xi_r[10])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7], xi_r[8], xi_r[11])
					- tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[4], xi_r[7], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6], xi_r[8], xi_r[10])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6], xi_r[8], xi_r[11])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[6], xi_r[9], xi_r[11])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7], xi_r[9], xi_r[10])
					- tableData.get(xi_r[0], xi_r[3], xi_r[5], xi_r[7], xi_r[9], xi_r[11])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6], xi_r[9], xi_r[10])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[6], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7], xi_r[8], xi_r[10])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7], xi_r[8], xi_r[11])
					- tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[4], xi_r[7], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6], xi_r[8], xi_r[10])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6], xi_r[8], xi_r[11])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[6], xi_r[9], xi_r[11])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7], xi_r[9], xi_r[10])
					- tableData.get(xi_r[1], xi_r[2], xi_r[5], xi_r[7], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6], xi_r[8], xi_r[10])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6], xi_r[8], xi_r[11])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[6], xi_r[9], xi_r[11])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7], xi_r[9], xi_r[10])
					- tableData.get(xi_r[1], xi_r[3], xi_r[4], xi_r[7], xi_r[9], xi_r[11])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6], xi_r[8], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6], xi_r[8], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6], xi_r[9], xi_r[10])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[6], xi_r[9], xi_r[11])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7], xi_r[8], xi_r[10])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7], xi_r[8], xi_r[11])
					- tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7], xi_r[9], xi_r[10])
					+ tableData.get(xi_r[1], xi_r[3], xi_r[5], xi_r[7], xi_r[9], xi_r[11]);

				value = Math.round(value);

				if (value < 0 || upper < 0 || lower < 0 || upper < lower || upper < value || value < lower) {
					debugger;
				}
				// if (lower !== upper) {
				// 	debugger;
				// }

				uncertainty += upper - lower;// / value;
				uncertaintyU += upper - value;
				uncertaintyD += value - lower;
				retValue += value;
			}

		} else {
			// let interp = interp_funcs.interp_funcs[dim];

			// let interp_param = Array.from(Array(dim * 2)),
			// 	i, pp = this.pp;

			// let xRange = Array.from(Array(dim));

			// k = queries.length;
			// while (k--) {
			// 	idx = queries[k].idx;
			// 	rect = queries[k].rect;
			// 	table = tables[idx];
			// 	// domain = tablesInfo[idx].domain;
			// 	domain = table.domain;
			// 	tableData = table.data;
			// 	binNums = table.binNums;
			// 	interp_funcs.set(tables, dim, binNums, 1); // TODO

			// 	xRange = xRange.map((_, i) => [
			// 		(Math.max(domain[i][0], rect[i][0]) - domain[i][0]) * domain[i][2],
			// 		(Math.min(domain[i][1], rect[i][1]) - domain[i][0]) * domain[i][2]
			// 	]);

			// 	xi = xRange.map(d => [Math.floor(d[0]), Math.floor(d[1])]);
			// 	xt = xRange.map((d, i) => [d[0] - xi[i][0], d[1] - xi[i][1]]);

			// 	i = 1 << dim;
			// 	while (i--) {
			// 		// p = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
			// 		// p = p.map((_, ii) => Math.sign(i & pow2[ii]));

			// 		// p: see wikipedia https://en.wikipedia.org/wiki/Summed-area_table#Extensions
			// 		pp[i].map((d, ii) => {
			// 			interp_param[ii * 2] = xi[ii][d]; interp_param[ii * 2 + 1] = xt[ii][d];
			// 		});
			// 		if ((dim - pp[i].reduce((a, b) => a + b, 0)) % 2 === 0) {
			// 			retValue += interp(tableData, ...interp_param);
			// 		} else {
			// 			retValue -= interp(tableData, ...interp_param);
			// 		}
			// 	}
			// }
		}

		return {
			value: retValue < 0.00001 ? 0 : retValue,
			uncertainty: { all: uncertainty, up: uncertaintyU, down: uncertaintyD },
			intersects: queries.length,
			aligned: { all: aligned_all, accurate: aligned_accurate },
		};
		// uncertainty
		// return retValue == 0 ? 0 : uncertainty / retValue;
	},

	deserialize: (function () {
		return function deserialize(arrayBuffer, offset, [satIdx_begin, satIdx_end]) {
			let parameters = this.parameters,
				dim = parameters.dim;

			let i, j;

			for (let k = satIdx_begin; k < satIdx_end; ++k) {
				let tableSize = arrayBuffer.readUInt32LE(offset + 0),
					insertTime = arrayBuffer.readUInt32LE(offset + 4);
				offset += 8;
				let mins = [],
					maxs = [],
					binNums = [],
					binWidths = [];
				for (let i = 0; i < dim; ++i) {
					mins.push(arrayBuffer.readUInt32LE(offset));
					offset += 4;
				}
				for (let i = 0; i < dim; ++i) {
					maxs.push(arrayBuffer.readUInt32LE(offset));
					offset += 4;
				}
				for (let i = 0; i < dim; ++i) {
					binNums.push(arrayBuffer.readUInt32LE(offset));
					offset += 4;
				}
				for (let i = 0; i < dim; ++i) {
					binWidths.push(arrayBuffer.readUInt32LE(offset));
					offset += 4;
				}
				let domain = Array.from(Array(dim)).map((_, i) => [mins[i], mins[i] + binNums[i] * binWidths[i]]),
					// tableLength = binNum.reduce((a, b) => a * b, 1),
					nd = binNums.map(d => d + 2),
					size = nd.reduce((a, b) => a * b, 1);
				// size = binNums.reduce((a, b) => a * b);
				let table = ndarray(pool.malloc(size, 'uint32'), nd);
				// let table = ndarray(arrayBuffer.slice(offset), binNums);
				// let table = ndarray(pool.malloc(size, 'uint32'), binNums);
				// for (let i = 0; i < size; i += 1, offset += 4) {
				// 	table.data[i] = arrayBuffer.readUInt32LE(offset);
				// }

				// let position = Array.from(Array(dim)).map(() => 0);

				// while (position[0] <= binNums[0] + 1) {
				// 	let flag = 1, position_topleft = position.slice(0);
				// 	for (i = 0; i < dim; ++i) {
				// 		if (position[i] === 0) { flag = 0; break; }
				// 		if (position[i] > binNums[i]) { flag = 2; position_topleft[i] -= 1; }
				// 	}
				// 	switch (flag) {
				// 		case 0: break;
				// 		case 2: table.set(...position, table.get(...position_topleft)); break;
				// 		case 1: default:
				// 			table.set(...position, arrayBuffer.readFloatLE(offset));
				// 			offset += 4;
				// 	}

				// 	j = dim - 1;
				// 	position[j] += 1;
				// 	while (j > 0 && position[j] > binNums[j] + 1) {
				// 		position[j--] = 0;
				// 		position[j] += 1;
				// 	}
				// }

				let position = Array.from(Array(dim)).map(() => 0),
					idx = 0;

				while (position[0] <= binNums[0] + 1) {
					let flag = 1;
					for (i = 0; i < dim; ++i) {
						if (position[i] === 0 || position[i] > binNums[i]) {
							flag = 0;
						}
					}
					if (flag) {
						table.data[idx] = arrayBuffer.readUInt32LE(offset);
						offset += 4;
					} else {
						table.data[idx] = 0;
					}

					// console.log(position, table.index(...position), idx);

					idx += 1;
					j = dim - 1;
					position[j] += 1;
					while (j > 0 && position[j] > binNums[j] + 1) {
						position[j--] = 0;
						position[j] += 1;
					}
				}

				this.tables[k] = {
					data: table,
					binNums, binWidths,
					domain,
				};
			}
			return this;
		};
	})(),
}