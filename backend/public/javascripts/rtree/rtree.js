'use strict';

// let SimpleSAT = require ('../sat/simplesat');

module.exports = RTree;
module.exports.default = RTree;

function RTree(parameters) {
	this.parameters = Object.assign({
		dim: 3,
	}, parameters);

	this.root = null;
	this.sat = parameters.sat;

	const dim = parameters.dim


	this.extend = dim == 1 ? (a, b) => {
		a[0][0] = Math.min(a[0][0], b[0][0]);
		a[0][1] = Math.max(a[0][1], b[0][1]) + 0.000001; // ??
	} : dim === 2 ? (a, b) => {
		a[0][0] = Math.min(a[0][0], b[0][0]);
		a[0][1] = Math.max(a[0][1], b[0][1]) + 0.000001; // ??
		a[1][0] = Math.min(a[1][0], b[1][0]);
		a[1][1] = Math.max(a[1][1], b[1][1]) + 0.000001; // ??
	} : dim === 3 ? (a, b) => {
		a[0][0] = Math.min(a[0][0], b[0][0]);
		a[0][1] = Math.max(a[0][1], b[0][1]) + 0.000001; // ??
		a[1][0] = Math.min(a[1][0], b[1][0]);
		a[1][1] = Math.max(a[1][1], b[1][1]) + 0.000001; // ??
		a[2][0] = Math.min(a[2][0], b[2][0]);
		a[2][1] = Math.max(a[2][1], b[2][1]) + 0.000001; // ??
	} : (a, b) => {
		for (let i = 0; i < a.length; i += 1) {
			a[i][0] = Math.min(a[i][0], b[i][0]);
			a[i][1] = Math.max(a[i][1], b[i][1]) + 0.000001; // ??
		}
		return a;
	}

	this.bboxArea = dim === 1 ? (a) => (a[0][1] - a[0][0])
		: dim === 2 ? (a) => (a[0][1] - a[0][0]) * (a[1][1] - a[1][0])
			: dim === 3 ? (a) => (a[0][1] - a[0][0]) * (a[1][1] - a[1][0]) * (a[2][1] - a[2][0])
				: (a) => a.map(d => d[1] - d[0]).reduce((a, b) => a * b);

	this.bboxMargin = dim == 1 ? (a) => (a[0][1] - a[0][0])
		: dim === 2 ? (a) => (a[0][1] - a[0][0]) + (a[1][1] - a[1][0])
			: dim === 3 ? (a) => (a[0][1] - a[0][0]) + (a[1][1] - a[1][0]) + (a[2][1] - a[2][0])
				: (a) => a.map(d => d[1] - d[0]).reduce((a, b) => a + b);

	// this.bboxRatio=(a) =>{
	// 	let l = a.map(d => d[1] - d[0]);
	// 	return Math.max(...l) / Math.min(...l);
	// }

	this.enlargedBBox = dim == 1 ? (a, b) => [[Math.min(a[0][0], b[0][0]), Math.max(a[0][1], b[0][1])]]
		: dim === 2 ? (a, b) => [[Math.min(a[0][0], b[0][0]), Math.max(a[0][1], b[0][1])], [Math.min(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])]]
			: dim === 3 ? (a, b) => [[Math.min(a[0][0], b[0][0]), Math.max(a[0][1], b[0][1])], [Math.min(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])], [Math.min(a[2][0], b[2][0]), Math.max(a[2][1], b[2][1])]]
				: (a, b) => a.map((d, i) => [Math.min(a[i][0], b[i][0]), Math.max(a[i][1], b[i][1])]);

	this.enlargedArea = dim == 1 ? (a, b) => (Math.max(a[0][1], b[0][1]) - Math.min(a[0][0], b[0][0]))
		: dim === 2 ? (a, b) => (Math.max(a[0][1], b[0][1]) - Math.min(a[0][0], b[0][0])) * (Math.max(a[1][1], b[1][1]) - Math.min(a[1][0], b[1][0]))
			: dim === 3 ? (a, b) => (Math.max(a[0][1], b[0][1]) - Math.min(a[0][0], b[0][0])) * (Math.max(a[1][1], b[1][1]) - Math.min(a[1][0], b[1][0])) * (Math.max(a[2][1], b[2][1]) - Math.min(a[2][0], b[2][0]))
				: (a, b) => a.map((d, i) => Math.max(a[i][1], b[i][1]) - Math.min(a[i][0], b[i][0]))
					.reduce((a, b) => a * b);

	this.intersectionArea = dim === 1 ? (a, b) => Math.max(0, Math.min(a[0][1], b[0][1]) - Math.max(a[0][0], b[0][0]))
		: dim === 2 ? (a, b) => Math.max(0, Math.min(a[0][1], b[0][1]) - Math.max(a[0][0], b[0][0])) * Math.max(0, Math.min(a[1][1], b[1][1]) - Math.max(a[1][0], b[1][0]))
			: dim === 3 ? (a, b) => Math.max(0, Math.min(a[0][1], b[0][1]) - Math.max(a[0][0], b[0][0])) * Math.max(0, Math.min(a[1][1], b[1][1]) - Math.max(a[1][0], b[1][0])) * Math.max(0, Math.min(a[2][1], b[2][1]) - Math.max(a[2][0], b[2][0]))
				: (a, b) => a.map((d, i) => Math.max(0, Math.min(a[i][1], b[i][1]) - Math.max(a[i][0], b[i][0])))
					.reduce((a, b) => a * b);

	this.contains = dim === 1 ? (a, b) => a[0][0] <= b[0][0] && a[0][1] >= b[0][1]
		: dim === 2 ? (a, b) => a[0][0] <= b[0][0] && a[0][1] >= b[0][1] && a[1][0] <= b[1][0] && a[1][1] >= b[1][1]
			: dim === 3 ? (a, b) => a[0][0] <= b[0][0] && a[0][1] >= b[0][1] && a[1][0] <= b[1][0] && a[1][1] >= b[1][1] && a[2][0] <= b[2][0] && a[2][1] >= b[2][1]
				: (a, b) => a.map((d, i) => a[i][0] <= b[i][0] && a[i][1] >= b[i][1]).reduce((a, b) => a && b);

	this.containesPoint = dim === 2 ? (a, b) => a[0][0] <= b[0] && a[0][1] >= b[0] && a[1][0] <= b[1] && a[1][1] >= b[1]
		: dim === 3 ? (a, b) => a[0][0] <= b[0] && a[0][1] >= b[0] && a[1][0] <= b[1] && a[1][1] >= b[1] && a[2][0] <= b[2] && a[2][1] >= b[2]
			: (a, b) => a.map((d, i) => a[i][0] <= b[i] && a[i][1] >= b[i]).reduce((a, b) => a && b);

	// var intersects = (a, b) => a.map((d, i) => b[i][0] <= a[i][1] & b[i][1] > a[i][0]).reduce((a, b) => a & b);
	this.intersects = dim === 1 ? (a, b) => b[0][0] < a[0][1] && b[0][1] > a[0][0]
		: dim === 2 ? (a, b) => b[0][0] < a[0][1] && b[0][1] > a[0][0] && b[1][0] < a[1][1] && b[1][1] > a[1][0]
			: dim === 3 ? (a, b) => b[0][0] < a[0][1] && b[0][1] > a[0][0] && b[1][0] < a[1][1] && b[1][1] > a[1][0] && b[2][0] < a[2][1] && b[2][1] > a[2][0]
				: dim === 4 ? (a, b) => b[0][0] < a[0][1] && b[0][1] > a[0][0] && b[1][0] < a[1][1] && b[1][1] > a[1][0] && b[2][0] < a[2][1] && b[2][1] > a[2][0] && b[3][0] < a[3][1] && b[3][1] > a[3][0]
					: dim === 5 ? (a, b) => b[0][0] < a[0][1] && b[0][1] > a[0][0] && b[1][0] < a[1][1] && b[1][1] > a[1][0] && b[2][0] < a[2][1] && b[2][1] > a[2][0] && b[3][0] < a[3][1] && b[3][1] > a[3][0] && b[4][0] < a[4][1] && b[4][1] > a[4][0]
						: (a, b) => a.map((d, i) => b[i][0] < a[i][1] && b[i][1] > a[i][0]).reduce((a, b) => a && b);
}

RTree.prototype = {

	search: function (bbox, minLevel = 0, include = [this.root], calculateUncertainty = true) {
		let sat = this.sat,
			intersects = this.intersects;
		// node = this.root;

		// if (!sat) return { value: Math.random() * 100 }; // !! FOR TEST

		sat.calculate_start();

		for (let node of include) {

			if (intersects(bbox, node)) {
				var nodesToSearch = [],
					i, child;
				while (node) {
					if (node.isLeaf || node.level <= minLevel) {
						sat.calculate_add(node.satIdx, bbox, node);
					} else {
						i = node.children.length;
						while (i--) {
							child = node.children[i];
							if (intersects(bbox, child)) {
								nodesToSearch.push(child);
							}
						}
					}
					node = nodesToSearch.pop();
				}
			}
		}

		return sat.calculate(calculateUncertainty);
		// return sat.calculate_parallel();
		// return { value: 0, uncertainty: { all: 0, up: 0, down: 0 } };
	},

	tree: function () {
		let root = this.root,
			tree = {},
			cur = [root, tree];

		var nodesToSearch = [],
			i, child;
		while (cur) {
			let node = cur[0],
				node_tree = cur[1];

			node_tree.domain = node.slice();
			node_tree.level = node.level;
			node_tree.children = [];

			if (node.isLeaf) {

			} else {
				i = node.children.length;
				while (i--) {
					child = node.children[i];
					let child_tree = {};
					node_tree.children.push(child_tree);
					nodesToSearch.push([child, child_tree]);
				}
			}
			cur = nodesToSearch.pop();
		}

		return tree;
	},

	deserialize: (function () {
		let readAndBuild_rec = function (thisPointer, arrayBuffer, offset) {
			let parameters = thisPointer.parameters,
				dim = parameters.dim;

			let level = arrayBuffer.readUInt32LE(offset + 0),
				count = arrayBuffer.readUInt32LE(offset + 4),
				satIdx = arrayBuffer.readUInt32LE(offset + 8);
			offset += 12;

			let mins = [],
				maxs = [];
			for (let i = 0; i < dim; ++i) {
				mins.push(arrayBuffer.readUInt32LE(offset));
				offset += 4;
			}
			for (let i = 0; i < dim; ++i) {
				maxs.push(arrayBuffer.readUInt32LE(offset));
				offset += 4;
			}
			let node = Array.from(Array(dim)).map((_, i) => [mins[i], maxs[i]]);
			node.level = level;
			node.isLeaf = node.level === 0;
			node.satIdx = satIdx;
			if (node.isLeaf) {
				// sat.tables[node.satIdx].domain = Array.from(Array(dim)).map((_, i) => [mins[i], maxs[i], (maxs[i] - mins[i]) * binNum]);
				// sat.setDomain(node.satIdx, node);
			} else {
				node.count = count;

				node.children = [];
				for (let i = 0; i < count; ++i) {
					let { node: child, offset: offsetNew } = readAndBuild_rec(thisPointer, arrayBuffer, offset);
					offset = offsetNew;
					node.children.push(child);
				}
			}

			return { node, offset };
		};
		return function deserialize(arrayBuffer, offset, parameters) {
			this.release();

			let { node: root } = readAndBuild_rec(this, arrayBuffer, offset);
			this.root = root;

			return this;
		};
	})(),


	// deserialize: (function () {
	// 	let readAndBuild_rec = function (node, intArray, floatArray, idx, parameters, sat) {
	// 		let dim = parameters.dim,
	// 			binNum = parameters.sat_binNum;

	// 		node.level = intArray[idx++];
	// 		node.count = intArray[idx++];
	// 		node.isLeaf = node.level === 0;
	// 		if (node.isLeaf) {
	// 			let dimCoordinate = intArray[idx++],
	// 				cooDivideNum = intArray.slice(idx, idx += (dim + 5)),
	// 				cooDvideLength = floatArray.slice(idx, idx += (dim + 5)),
	// 				dimInner = intArray[idx++],
	// 				innDivideNum = intArray.slice(idx, idx += (dimInner + 5)),
	// 				innDvideLength = floatArray.slice(idx, idx += (dimInner + 5)),
	// 				domain_min = floatArray.slice(idx, idx += (dim + 5)),
	// 				domain_max = floatArray.slice(idx, idx += (dim + 5)),
	// 				sumTable = floatArray.slice(idx, idx += Math.pow(binNum, dim));

	// 			node.domain = Array.from(Array(dim)).map((_, i) => [domain_min[i], domain_max[i], 1.0 / (domain_max[i] - domain_min[i]) * binNum]);
	// 			// node.sat = Array.from(sumTable);
	// 			node.satIdx = sat.pushTable_array(sumTable, {
	// 				domain: node.domain,
	// 				node, count: node.count,
	// 			});
	// 		} else {
	// 			node.children = [];
	// 			for (let i = 0; i < node.count; i += 1) {
	// 				let mins = floatArray.slice(idx, idx += dim),
	// 					maxs = floatArray.slice(idx, idx += dim);
	// 				let child = Array.from(Array(dim)).map((_, i) => [mins[i], maxs[i]]);
	// 				idx = readAndBuild_rec(child, intArray, floatArray, idx, parameters, sat);
	// 				node.children.push(child);
	// 			}
	// 		}

	// 		return idx;
	// 	};
	// 	return function deserialize(arrayBuffer) {
	// 		this.release();

	// 		this.sat = new SimpleSAT(this.parameters);

	// 		let intArray = new Uint32Array(arrayBuffer),
	// 			floatArray = new Float32Array(arrayBuffer);

	// 		console.log(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer.slice(0, 4))));

	// 		let idx = 1;
	// 		let dataSize = intArray[idx++],
	// 			dim = intArray[idx++],
	// 			dataElemSize = intArray[idx++],
	// 			dataElemRealSize = intArray[idx++],
	// 			maxEntries = intArray[idx++],
	// 			minEntries = intArray[idx++];

	// 		this.parameters = Object.assign(this.parameters, {
	// 			dim, maxEntries, minEntries,
	// 		});

	// 		this.root = Array.from(Array(dim));
	// 		this.root[0] = [-99999, 99999];
	// 		this.root[1] = [-99999, 99999];
	// 		readAndBuild_rec(this.root, intArray, floatArray, idx, this.parameters, this.sat, 0);

	// 		console.log('rtree::deserialize()', this);

	// 		return this;
	// 	};
	// })(),

	release: function () {
		this.root = null;
	}
}