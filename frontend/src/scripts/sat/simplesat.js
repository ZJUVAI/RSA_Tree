'use strict';

import ndarray from 'ndarray';
import pool from 'typedarray-pool';
import interp_funcs from '../utility/interp_funcs';

module.exports = SimpleSAT;
module.exports.default = SimpleSAT;

function SimpleSAT(parameters) {
	this.parameters = Object.assign({
		dim: 3,
	}, parameters);

	let dim = this.parameters.dim;

	this.tables = [];
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

	calculate: function () {
		let dim = this.parameters.dim,
			queries = this.calculate_queries,
			tables = this.tables;

		if (!queries.length) { return undefined; }

		let k, idx, rect, table, domain, tableData, binNums, binWidths;

		let xRange, xi, xi_, xt;

		let retValue = 0, uncertainty = 0, uncertaintyU = 0, uncertaintyD = 0;

		if (dim === 2) {
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

				let upper = tableData.get(xi[0], xi[2])
					- tableData.get(xi[0], xi_[3])
					- tableData.get(xi_[1], xi[2])
					+ tableData.get(xi_[1], xi_[3]);

				let lower = xi_[0] >= xi[1] || xi_[2] >= xi[3]
					? 0
					: tableData.get(xi_[0], xi_[2])
					- tableData.get(xi_[0], xi[3])
					- tableData.get(xi[1], xi_[2])
					+ tableData.get(xi[1], xi[3]);

				let value =
					interp(tableData, xi[0], xt[0], xi[2], xt[2])
					- interp(tableData, xi[0], xt[0], xi[3], xt[3])
					- interp(tableData, xi[1], xt[1], xi[2], xt[2])
					+ interp(tableData, xi[1], xt[1], xi[3], xt[3]);

				value = Math.round(value);

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

				let upper =
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

				let lower = xi_[0] >= xi[1] || xi_[2] >= xi[3] || xi_[4] >= xi[5] || xi_[6] >= xi[7]
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
					+ tableData.get(xi[1], xi[3], xi[5], xi[7]);

				let value =
					+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6])
					- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7])
					- interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6])
					+ interp(tableData, xi[0], xt[0], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7])
					- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6])
					+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7])
					+ interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6])
					- interp(tableData, xi[0], xt[0], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7])
					- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[6], xt[6])
					+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[4], xt[4], xi[7], xt[7])
					+ interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[6], xt[6])
					- interp(tableData, xi[1], xt[1], xi[2], xt[2], xi[5], xt[5], xi[7], xt[7])
					+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[6], xt[6])
					- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[4], xt[4], xi[7], xt[7])
					- interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[6], xt[6])
					+ interp(tableData, xi[1], xt[1], xi[3], xt[3], xi[5], xt[5], xi[7], xt[7]);
				value = Math.round(value);

				uncertainty += upper - lower;// / value;
				uncertaintyU += upper - value;
				uncertaintyD += value - lower;
				retValue += value;

				// retValue = Math.max(retValue, interp(tableData, xi[0], xt[0], xi[2], xt[2]));
			}
		} else {
			let interp = interp_funcs.interp_funcs[dim];

			let interp_param = Array.from(Array(dim * 2)),
				i, pp = this.pp;

			let xRange = Array.from(Array(dim));

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

				xRange = xRange.map((_, i) => [
					(Math.max(domain[i][0], rect[i][0]) - domain[i][0]) * domain[i][2],
					(Math.min(domain[i][1], rect[i][1]) - domain[i][0]) * domain[i][2]
				]);

				xi = xRange.map(d => [Math.floor(d[0]), Math.floor(d[1])]);
				xt = xRange.map((d, i) => [d[0] - xi[i][0], d[1] - xi[i][1]]);

				i = 1 << dim;
				while (i--) {
					// p = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
					// p = p.map((_, ii) => Math.sign(i & pow2[ii]));

					// p: see wikipedia https://en.wikipedia.org/wiki/Summed-area_table#Extensions
					pp[i].map((d, ii) => {
						interp_param[ii * 2] = xi[ii][d]; interp_param[ii * 2 + 1] = xt[ii][d];
					});
					if ((dim - pp[i].reduce((a, b) => a + b, 0)) % 2 === 0) {
						retValue += interp(tableData, ...interp_param);
					} else {
						retValue -= interp(tableData, ...interp_param);
					}
				}
			}
		}

		return {
			value: retValue < 0.00001 ? 0 : retValue, uncertainty: { all: uncertainty, up: uncertaintyU, down: uncertaintyD },
			intersects: queries.length,
		};
		// uncertainty
		// return retValue == 0 ? 0 : uncertainty / retValue;
	},

	deserialize: (function () {
		return function deserialize(arrayBuffer, idx) {
			let intArray = new Uint32Array(arrayBuffer),
				floatArray = new Float32Array(arrayBuffer);

			let parameters = this.parameters,
				dim = parameters.dim,
				nodeNum = parameters.nodeNum = intArray[idx++];

			let i, j;

			for (let k = 0; k < nodeNum; ++k) {

				let mins = intArray.slice(idx, idx += dim),
					maxs = intArray.slice(idx, idx += dim),
					binNums = intArray.slice(idx, idx += dim),
					binWidths = Array.from(intArray.slice(idx, idx += dim)),
					domain = Array.from(Array(dim)).map((_, i) => [mins[i], mins[i] + binNums[i] * binWidths[i]]),
					// tableLength = binNum.reduce((a, b) => a * b, 1),
					nd = binNums.map(d => d + 2),
					size = nd.reduce((a, b) => a * b, 1);
				let //tableData = floatArray.slice(idx, idx += tableLength),
					table = ndarray(pool.malloc(size, "uint32"), nd);

				let position = Array.from(Array(dim)).map(() => 0);

				while (position[0] <= binNums[0] + 1) {
					let flag = 1, position_topleft = position.slice(0);
					for (i = 0; i < dim; ++i) {
						if (position[i] === 0) { flag = 0; break; }
						if (position[i] > binNums[i]) { flag = 2; position_topleft[i] -= 1; }
					}
					switch (flag) {
						case 0: break;
						case 2: table.set(...position, table.get(...position_topleft)); break;
						case 1: default: table.set(...position, floatArray[idx++]);
					}

					j = dim - 1;
					position[j] += 1;
					while (j > 0 && position[j] > binNums[j] + 1) {
						position[j--] = 0;
						position[j] += 1;
					}
				}

				this.tables.push({
					data: table,
					binNums, binWidths,
					domain,
				});
			}
			return this;
		};
	})(),
}