'use strict';

let fs = require('fs');
let deserialize = require('./utility/deserialize');
let ndarray = require('ndarray');
let pool = require('typedarray-pool');
// let RTree = require('./rtree/rtree');
// let SimpleSAT = require('../../../core/sat/simplesat');

function RSATree(parameters, callback) {
	let path = parameters.path,
		name = parameters.name,
		extra = parameters.extra,
		satNumPerFile = parameters.satNumPerFile;

	let promise_parameters = new Promise((resolve, reject) => {
		let filename = `${name}Parameter${extra}.json`, filepath = `./data/${path}${filename}`;
		console.log('fetchParameter', filepath);

		fs.readFile(filepath, 'utf8', function (err, data) {
			if (err) {
				reject(err);
			}

			let parameters = JSON.parse(data);

			let result = {
				dim: parameters.dimCoordinate, resultDim: parameters.dimInnNum,
				dataDomain: parameters.originRange.map(d => [+d[0], +d[1]]),
				scaleDomain: parameters.converseRange.map(d => [+d[0], +d[1]]),
			}

			resolve(result);
		});
	}).then((parameters) => {
		console.log('RSATree::(load parameters)', parameters);
		this.parameters = parameters;
		return parameters;
	});

	let promise_rtree = new Promise((resolve, reject) => {
		promise_parameters.then((param) => {
			// load RTree
			let filename = `${name}Rtree${extra}`, filepath = `./data/${path}${filename}`;
			console.log('fetchRTree', filepath);
			fs.readFile(filepath, (err, data) => {
				if (err) {
					reject(err);
				}
				let rtree = this.rtree = deserialize(data, param);
				console.log('RSATree:(load RTree)', `level: ${rtree && rtree.root.level}`);
				resolve(rtree);
			});
		})
	});

	let promise_sat = new Promise((resolve, reject) => {
		promise_parameters.then((param) => {
			// load SAT
			let filename = `${name}SAT${extra}`, filepath = `./data/${path}${filename}`;
			console.log('fetchSAT', filepath);
			fs.readFile(filepath, (err, data) => {
				if (err) {
					reject(err);
				}
				let sat = this.sat = deserialize(data, param);
				let satNum = sat.parameters.nodeNum,
					fileNum = Math.ceil(satNum / satNumPerFile),
					promise_satBlock = [];
				for (let i = 0; i < fileNum; i += 1) { // fetch all files for sat
					promise_satBlock.push(new Promise((resolve, reject) => {
						let filename = `${name}SAT${extra}_${i}`, filepath = `./data/${path}${filename}`;
						console.log('fetchSAT(blocks)', filepath);
						fs.readFile(filepath, function (err, data) {
							if (err) {
								console.log('fetchSAT(blocks)', err, filepath);
								reject(err);
							}
							console.log('RSATree:(load SAT)', `block #${i}`);
							sat.deserialize(data, 0, [(i) * satNumPerFile, Math.min((i + 1) * satNumPerFile, satNum)]);
							resolve();
						});
					}));
				}
				// wait until all files done
				Promise.all(promise_satBlock).then(() => {
					console.log('RSATree:(load SAT)', `number: ${sat.tables.length}`);
					// console.log('RSATree:(load SAT)', `points number: ${sat.tables[0]}`);
					resolve(sat);
				});
			});
		})
	});

	let promise_origin = new Promise((resolve, reject) => {
		promise_parameters.then((param) => {
			// load original data
			let filename = `${name}Data${extra}`, filepath = `./data/${filename}`;
			console.log('fetchOrigin', filepath);
			this.origin_filepath = filepath;
			// fs.readFile(filepath, (err, data) => {
			// 	if (err) {
			// 		reject(err);
			// 	}
			// 	// let origin = this.origin = deserialize(data, param);
			// 	// console.log('RSATree:(load original data)', `number: ${origin.length}`);
			// 	// resolve(origin);
			// 	resolve(null);
			// });
			// let readStream = fs.createReadStream(filepath);
			// let points = null,
			// 	count, dim, x,
			// 	i, j;
			// readStream
			// 	.on('data', function (chunk) {
			// 		let offset = 0, value;
			// 		if (!points) { // first chunk
			// 			i = 0; j = 0;
			// 			offset = 4;// skip TypeID
			// 			count = chunk.readUInt32LE(offset);
			// 			dim = chunk.readUInt32LE(offset + 4);
			// 			x = chunk.readUInt32LE(offset + 8);
			// 			offset += 12;
			// 			let nd = [count, dim],
			// 				size = nd.reduce((a, b) => a * b, 1);
			// 			points = ndarray(pool.malloc(size, 'float32'), nd);
			// 		}
			// 		while (offset < chunk.length) {
			// 			value = chunk.readFloatLE(offset);
			// 			offset += 4;
			// 			// if (points[i] == null) {
			// 			// 	points[i] = Array(dim);
			// 			// }
			// 			// points[i][j] = value;
			// 			points.set(i, j, value);
			// 			++j;
			// 			if (j >= dim) { j = 0; ++i; }
			// 		}
			// 	})
			// 	.on('end', function () {
			// 		console.log('RSATree:(load original data)', `number: ${count}`);
			// 		resolve(points);
			// 	});
			resolve([]);
		})
	});
	// .then((origin) => {
	// 	this.origin = origin;
	// });

	Promise.all([promise_rtree, promise_sat, promise_origin]).then(([rtree, sat, origin]) => {
		rtree.sat = sat;
		// check actural min max
		let parameters = this.parameters,
			dim = parameters.dim,
			dataDomain = parameters.dataDomain,
			scaleDomain = parameters.scaleDomain,
			scaleDomain_new = scaleDomain.map(d => d.slice(0));
		for (let table of sat.tables) {
			let domain = table.domain;
			for (let i = 0; i < dim; i += 1) {
				if (domain[i][0] < scaleDomain_new[i][0]) { scaleDomain_new[i][0] = domain[i][0]; }
				if (domain[i][1] > scaleDomain_new[i][1]) {
					scaleDomain_new[i][1] = domain[i][1];
				}
			}
		}
		for (let i = 0; i < dim; i += 1) {
			dataDomain[i] = [
				dataDomain[i][0] + (dataDomain[i][1] - dataDomain[i][0]) * (scaleDomain_new[i][0] - scaleDomain[i][0]) / (scaleDomain[i][1] - scaleDomain[i][0]),
				dataDomain[i][0] + (dataDomain[i][1] - dataDomain[i][0]) * (scaleDomain_new[i][1] - scaleDomain[i][0]) / (scaleDomain[i][1] - scaleDomain[i][0]),
			];
		}
		parameters.scaleDomain = scaleDomain_new;
		callback();
	});
}

RSATree.prototype = {
	query: function (query, options_) {
		let options = Object.assign({
			include: undefined,
			minLevel: 0,
		}, options_);

		let rtree = this.rtree;

		let query_loop = query.filter(d => d.binNum > 1),
			dim_inloop = 0,
			query_loopIdx = query.map(d => d.binNum === 1 ? undefined : dim_inloop++);

		let ranges = query.map((d, i) => {
			return Array.from(Array(d.binNum)).map((_, j) => {
				let x0 = d.x0 + d.binWidth * j,
					x1 = x0 + d.binWidth;
				return [Math.max(x0, d.min), Math.min(x1, d.max)];
			});
		});

		let results = [];
		if (options.timer) {
			options.timer.start(options.timerName);
		}
		if (query_loop.length === 0) {
			let idx_all = query.map((_, i) => 0),
				rect = query.map((_, i) => ranges[i][idx_all[i]]);
			let result = rtree.search(rect, options.minLevel);
			if (result) {
				results.push({
					index: idx_all,
					// result: rtree.search(rect, options.minLevel),
					result,
				});
			}
		} else {
			let idx = query_loop.map(() => 0);
			while (idx[0] < query_loop[0].binNum) {
				let idx_all = query.map((_, i) => query_loopIdx[i] === undefined ? 0 : idx[query_loopIdx[i]]),
					rect = query.map((_, i) => ranges[i][idx_all[i]]);
				let result = rtree.search(rect, options.minLevel);
				if (result) {
					results.push({
						index: idx_all,
						// result: rtree.search(rect, options.minLevel),
						// result,
						value: result.value,
					});
				}

				let j = dim_inloop - 1;
				idx[j] += 1;
				while (j > 0 && idx[j] >= query_loop[j].binNum) {
					idx[j--] = 0;
					idx[j] += 1;
				}
			}
		}
		if (options.timer) {
			options.timer.stop(options.timerName);
		}

		return results;
	},

	query_list: function (query, options_) {
		let options = Object.assign({
			include: undefined,
			minLevel: 0,
		}, options_);

		let rtree = this.rtree;

		let query_loop = query.filter(d => d.length > 1),
			dim_inloop = 0,
			query_loopIdx = query.map(d => d.length === 1 ? undefined : dim_inloop++);

		// let ranges = query.map((d, i) => {
		// 	return Array.from(Array(d.binNum)).map((_, j) => {
		// 		let x0 = d.x0 + d.binWidth * j,
		// 			x1 = x0 + d.binWidth;
		// 		return [Math.max(x0, d.min), Math.min(x1, d.max)];
		// 	});
		// });

		let results = [];
		if (options.timer) {
			options.timer.start(options.timerName);
		}
		if (query_loop.length === 0) {
			let idx_all = query.map((_, i) => 0),
				rect = query.map((d, i) => d[idx_all[i]]);
			results.push({
				index: idx_all,
				result: rtree.search(rect, options.minLevel),
			});
		} else {
			let idx = query_loop.map(() => 0);
			while (idx[0] < query_loop[0].length) {
				let idx_all = query.map((_, i) => query_loopIdx[i] === undefined ? 0 : idx[query_loopIdx[i]]),
					rect = query.map((d, i) => d[idx_all[i]]);
				results.push({
					index: idx_all,
					result: rtree.search(rect, options.minLevel),
				});

				let j = dim_inloop - 1;
				idx[j] += 1;
				while (j > 0 && idx[j] >= query_loop[j].length) {
					idx[j--] = 0;
					idx[j] += 1;
				}
			}
		}
		if (options.timer) {
			options.timer.stop(options.timerName);
		}

		return results;
	},

	query_origin: function (query) {
		let dim = query.length,
			nd = query.map(d => d.binNum),
			size = nd.reduce((a, b) => a * b, 1),
			answers = ndarray(pool.malloc(size, 'uint32'), nd);
		let origin = this.origin,
			parameters = this.parameters,
			dataDomain = parameters.dataDomain,
			scaleDomain = parameters.scaleDomain,
			query_origin = query.map((d, i) => {
				let domain_origin = dataDomain[i],
					domain_scale = scaleDomain[i],
					scale2origin = (x) => {
						let t = (x - domain_scale[0]) / (domain_scale[1] - domain_scale[0]);
						return domain_origin[0] + t * (domain_origin[1] - domain_origin[0]);
					};
				return {
					x0: scale2origin(d.x0),
					min: scale2origin(d.min),
					max: scale2origin(d.max),
					binNum: d.binNum,
					binWidth: d.binWidth * (domain_origin[1] - domain_origin[0]) / (domain_scale[1] - domain_scale[0]),
				}
			});
		// for (let point of origin) {
		// for (let i = 0; i < origin.shape[0]; i += 1) {
		// 	let position = Array(dim);
		// 	for (let d = 0; d < dim; d += 1) {
		// 		// let x = point[d],
		// 		let x = origin.get(i, d),
		// 			query_d = query_origin[d];
		// 		if (x < query_d.min || x > query_d.max) {
		// 			position = null; break;
		// 		}
		// 		position[d] = Math.floor((x - query_d.x0) / query_d.binWidth);
		// 		if (position[d] == query_d.binNum) { position[d] -= 1; }
		// 	}
		// 	if (position != null) {
		// 		let idx = answers.index(...position);
		// 		answers.data[idx] += 1;
		// 	}
		// }

		let pointN = 0;

		return new Promise((resolve, reject) => {
			let readStream = fs.createReadStream(this.origin_filepath);
			let point = null,
				headerRead = false,
				count, dim_origin, x,
				i, j;
			readStream
				.on('data', function (chunk) {
					let offset = 0, value;
					if (!headerRead) { // first chunk
						i = 0; j = 0;
						offset = 4;// skip TypeID
						count = chunk.readUInt32LE(offset);
						dim_origin = chunk.readUInt32LE(offset + 4);
						if (dim_origin != dim) {
							console.error('number of dimensions not matched', `query: ${dim}`, `original data: ${dim_origin}`);
						}
						x = chunk.readUInt32LE(offset + 8);
						offset += 12;
						// let nd = [count, dim],
						// 	size = nd.reduce((a, b) => a * b, 1);
						// points = ndarray(pool.malloc(size, 'float32'), nd);
						point = [];
						headerRead = true;
					}
					while (offset < chunk.length) {
						value = chunk.readFloatLE(offset);
						offset += 4;
						// if (points[i] == null) {
						// 	points[i] = Array(dim);
						// }
						// points[i][j] = value;
						point.push(value);
						// points.set(i, j, value);
						++j;
						if (j > dim) {
							++pointN;
							j = 0; ++i;
							let position = Array(dim);
							for (let d = 0; d < dim; d += 1) {
								let x = point[d],
									// let x = origin.get(i, d),
									query_d = query_origin[d];
								if (x < query_d.min || x > query_d.max) {
									position = null; break;
								}
								position[d] = Math.floor((x - query_d.x0) / query_d.binWidth);
								if (position[d] < 0 || position[d] >= query_d.binNum) {
									position = null; break;
								}
								// if (position[d] == query_d.binNum) { position[d] -= 1; }
							}
							if (position != null) {
								let idx = answers.index(...position);
								answers.data[idx] += 1;
								// if (answers.get(84, 223) != 0) {
								// 	console.log(cnt, position);
								// 	debugger;
								// }
							}
							point = [];
						}
					}
				})
				.on('end', function () {
					console.log('RSATree:(load original data)', `number: ${pointN}`);
					// resolve(points);
					resolve(answers);
				});

			// return answers;
		});
	},
};

module.exports = RSATree;
module.exports.default = RSATree;