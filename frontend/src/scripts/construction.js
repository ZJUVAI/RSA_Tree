import * as d3 from 'd3';
import rbush from './rbush';

import dv from './splom/dv';

var rtree;

function datagen(opt) {
	let idx = d3.range(opt.N);
	let vals = idx.map(dv.rand.normal(10, 10))
	let stats = {};
	stats["a0"] = vals;
	if (opt.dim > 1)
		stats["a1"] = vals.map(function (d) { return dv.rand.normal(10, 10)() });
	if (opt.dim > 2)
		stats["a2"] = vals.map(function (d) { return dv.rand.normal(d, 10)() });
	if (opt.dim > 3)
		stats["a3"] = vals.map(function (d) { return Math.log(Math.abs(d) + 1) + dv.rand.uniform(3)() });
	if (opt.dim > 4)
		stats["a4"] = vals.map(function (d) { return dv.rand.normal(10, 10)() });

	let data = [];
	for (let name in stats) {
		data.push({ name: name, values: stats[name], type: dv.type.numeric });
	}
	data = dv.table(data);
	return data;
}

function construct(data, max_n, d, satBinNum, options, first_N) {
	var time_start = window.performance.now(),
		time_inserted, time_generated,
		time_inserted2, time_generated2;

	rtree = new rbush(max_n, d, satBinNum, options);

	let i = 0, l = Math.min(first_N, data.length);
	for (; i < l; i += 1) {
		rtree.insert(dimensions.map(d => scales[d](data[i][d])));
		if (i % 1000 === 0) {
			console.log(i, window.performance.now() - time_start);
		}
	}

	time_inserted = window.performance.now();

	rtree.generate();

	console.log(`rtree (${rtree.sat.nodesInfo.length})`, rtree);

	time_generated = window.performance.now();

	console.log('insert/generate', time_inserted - time_start, time_generated - time_inserted);

	i = Math.min(first_N, data.length), l = data.length;
	for (; i < l; i += 1) {
		if (i % 1000 === 0) {
			console.log(i, window.performance.now() - time_start);
		}
		rtree.insert2(dimensions.map(d => scales[d](data[d][i])));
	}

	time_inserted2 = window.performance.now();

	rtree.generate2();

	time_generated2 = window.performance.now();

	console.log('insert2/generate2', time_inserted2 - time_generated, time_generated2 - time_inserted2);
	console.log('total', time_generated2 - time_start);
}


// // SPLOM
// var option = { N: 1000000, dim: 5 }, data = datagen(option), domains = data.map(d => d3.extent(d));
// var scales = domains.map(([min, max]) => d3.scaleLinear().domain([min, max]).range([0, 1024])),
// 	dimensions = d3.range(option.dim);
// data = data[0].map((col, i) => data.map(row => row[i])); // transpose
// console.log(data, domains);

// var first_N = 100000,
// 	max_n = Math.min(first_N, option.N) / 100,
// 	satBinNum = 4,
// 	histogramBinNum = 50;

// construct(data, max_n, option.dim, satBinNum, {
// 	useHistogram: true,
// 	histogramBinNum,
// 	histogramDimension: Array.from(Array(option.dim), (_, i) => i),
// 	dynamicDomain: true,
// 	// domain: Array.from(Array(option.dim),()=>[0,1024]),
// 	align: false,
// 	hash: false,
// }, first_N);


// From DB

// function fetchPoints(offset, limit) {
// 	return function (res) {
// 		return new Promise((resolve, reject) => {
// 			$.ajax({
// 				method: 'post',
// 				type: 'json',
// 				url: '//localhost:3005/construct_test_progressive',
// 				data: { offset, limit },
// 				success: (points) => {
// 					console.log('points (progressive):', points);

// 					let i = 0, l = points.length, flag;
// 					for (; i < l; i += 1) {
// 						time0 = window.performance.now();
// 						flag=rtree.insert2(dimensions.map(d => scales[d](points[i][d])));
// 						time1 = window.performance.now();
// 						if (flag == false) { ++missCnt; }
// 						time_inserted2 += time1 - time0;
// 						total_pointN++;
// 						if (total_pointN % 1000 === 0) {
// 							console.log(total_pointN, time_inserted2 + time_inserted);
// 							outputCsv += `${total_pointN}, ${time_inserted2 + time_inserted + time_generated}\n`;
// 						}
// 					}
// 					resolve(points);
// 				},
// 			});
// 		})
// 	}
// }

// function cntTreeThreshold(pointNum, treeHeight) {
// 	return Math.ceil(Math.pow(pointNum, 1 / (treeHeight - 1)));
// }

// var max_n = cntTreeThreshold(93276, 4.6),
// 	dimensionNum = 2,
// 	satBinNum = 64,
// 	options = {
// 		useHistogram: false,
// 		// histogramBinNum: 8,
// 		// histogramDimension: Array.from(Array(option.dim), (_, i) => i),
// 		// dynamicDomain: true,
// 		// domain: Array.from(Array(option.dim),()=>[0,1024]),
// 		align: true,
// 		hash: false,
// 	},
// 	first_N = Math.floor(93276 * 0.8);
// var rtree = new rbush(max_n, dimensionNum, satBinNum, options);
// var scales,
// 	dimensions = d3.range(dimensionNum);

// var time_inserted = 0, time_generated = 0,
// 	time_inserted2 = 0, time_generated2 = 0,
// 	time0, time1;

// var total_pointN = 0, outputCsv = '', missCnt = 0;


// $.ajax({
// 	url: '//localhost:3005/construct_test_sample',
// 	method: 'get',
// 	success: (points) => {
// 		if (points) {
// 			console.log('point', points);
// 			scales = dimensions.map((_, i) => d3.scaleLinear().domain(d3.extent(points, d => d[i])).range([0, 1024]));
// 			let i = 0, l = Math.min(points.length, first_N);
// 			for (; i < l; i += 1) {
// 				time0 = window.performance.now();
// 				rtree.insert(dimensions.map(d => scales[d](points[i][d])));
// 				time1 = window.performance.now();
// 				time_inserted += time1 - time0;
// 				total_pointN++;
// 				if (total_pointN % 1000 === 0) {
// 					console.log(total_pointN, time_inserted);
// 					outputCsv += `${total_pointN}, ${time_inserted}\n`;
// 				}
// 			}

// 			time0 = window.performance.now();
// 			rtree.generate();
// 			time1 = window.performance.now();
// 			time_generated = time1 - time0;

// 			console.log(`rtree (${rtree.sat.nodesInfo.length})`, rtree);
// 			console.log('insert/generate', time_inserted, time_generated);
// 			outputCsv += `${total_pointN}, ${time_inserted + time_generated}\n`;

// 			i = l;
// 			l = points.length;
// 			let flag;
// 			for (; i < l; i += 1) {
// 				time0 = window.performance.now();
// 				flag = rtree.insert2(dimensions.map(d => scales[d](points[i][d])));
// 				time1 = window.performance.now();
// 				if (flag == false) { ++missCnt; }
// 				time_inserted2 += time1 - time0;
// 				total_pointN++;
// 				if (total_pointN % 1000 === 0) {
// 					console.log(total_pointN, time_inserted2 + time_inserted);
// 					outputCsv += `${total_pointN}, ${time_inserted2 + time_inserted + time_generated}\n`;
// 				}
// 			}

// 			let offest = 0, limit = 120000;
// 			fetchPoints(offest, limit)()
// 				.then(fetchPoints(offest += limit, limit))
// 				.then(fetchPoints(offest += limit, limit))
// 				.then(fetchPoints(offest += limit, limit))
// 				.then(fetchPoints(offest += limit, limit))
// 				.then(fetchPoints(offest += limit, limit))
// 				.then(fetchPoints(offest += limit, limit))
// 				.then(fetchPoints(offest += limit, limit))
// 				// .then(fetchPoints(offest += limit, limit))
// 				.then(() => {
// 					time0 = window.performance.now();
// 					rtree.generate2();
// 					time1 = window.performance.now();
// 					time_generated2 = time1 - time0;

// 					console.log('insert2/generate2', time_inserted2, time_generated2);
// 					console.log('total', time_inserted + time_generated + time_inserted2 + time_generated2);

// 					console.log(outputCsv);
// 					console.log(missCnt);
// 				})
// 		}
// 	}
// });


function fetchPoints(offset, limit) {
	return function (res) {
		return new Promise((resolve, reject) => {
			$.ajax({
				method: 'post',
				type: 'json',
				url: '//8.209.76.236:3005/construct_test_progressive',
				data: { offset, limit },
				success: (points) => {
					console.log('points (progressive):', points);

					let i = 0, l = Math.min(points.length, first_N - total_pointN);
					for (; i < l; i += 1) {
						time0 = window.performance.now();
						rtree.insert(dimensions.map(d => scales[d](points[i][d])));
						time1 = window.performance.now();
						time_inserted += time1 - time0;
						total_pointN++;
						if (total_pointN % 1000 === 0) {
							// console.log(total_pointN, time_inserted);
							outputCsv += `${total_pointN}, ${time_inserted}\n`;
						}
					}

					if (total_pointN >= first_N) {
						if (!generated) {
							time0 = window.performance.now();
							rtree.generate();
							time1 = window.performance.now();
							time_generated = time1 - time0;
							generated = true;

							console.log(`rtree (${rtree.sat.nodesInfo.length})`, rtree);
							console.log('insert/generate', time_inserted, time_generated);
							outputCsv += `${total_pointN}, ${time_inserted + time_generated}\n`;
						}

						i = Math.max(0, l);
						l = points.length;
						let flag;
						for (; i < l; i += 1) {
							time0 = window.performance.now();
							flag = rtree.insert2(dimensions.map(d => scales[d](points[i][d])));
							time1 = window.performance.now();
							if (flag == false) { ++missCnt; }
							time_inserted2 += time1 - time0;
							total_pointN++;
							if (total_pointN % 1000 === 0) {
								// console.log(total_pointN, time_inserted2 + time_inserted);
								outputCsv += `${total_pointN}, ${time_inserted2 + time_inserted + time_generated}\n`;
							}
						}
					}
					resolve(points);
				},
			});
		})
	}
}

function cntTreeThreshold(pointNum, treeHeight) {
	return Math.ceil(Math.pow(pointNum, 1 / (treeHeight - 1)));
}

// poi
var max_n = cntTreeThreshold(93276, 4.6),
	dimensionNum = 2,
	satBinNum = 64,
	options = {
		useHistogram: false,
		// histogramBinNum: 8,
		// histogramDimension: Array.from(Array(option.dim), (_, i) => i),
		// dynamicDomain: true,
		// domain: Array.from(Array(option.dim),()=>[0,1024]),
		align: true,
		hash: false,
	},
	// first_N = Math.floor(93276 * 1);
	first_N = Math.floor(939446 * 0.8);

// // Taxi
// var max_n = 1000,
// 	dimensionNum = 5,
// 	satBinNum = 8,
// 	options = {
// 		useHistogram: true,
// 		histogramBinNum: 8,
// 		histogramDimension: [2,3,4],
// 		dynamicDomain: true,
// 		// domain: Array.from(Array(option.dim),()=>[0,1024]),
// 		align: true,
// 		hash: false,
// 	},
// 	first_N = Infinity;

// // FL
// var max_n = 40,
// 	dimensionNum = 3,
// 	satBinNum = 8,
// 	options = {
// 		useHistogram: true,
// 		histogramBinNum: 8,
// 		histogramDimension: [2],
// 		dynamicDomain: true,
// 		// domain: Array.from(Array(option.dim),()=>[0,1024]),
// 		align: true,
// 		hash: false,
// 	},
// 	first_N = Infinity;

// NYC-taxi
var max_n = 40,
	dimensionNum = 3,
	satBinNum = 8,
	options = {
		useHistogram: true,
		histogramBinNum: 8,
		histogramDimension: [2],
		dynamicDomain: true,
		// domain: Array.from(Array(option.dim),()=>[0,1024]),
		align: true,
		hash: false,
	},
	first_N = Infinity;


var rtree = new rbush(max_n, dimensionNum, satBinNum, options);
console.log(max_n, dimensionNum, satBinNum, options);
var scales,
	dimensions = d3.range(dimensionNum);

var time_inserted = 0, time_generated = 0,
	time_inserted2 = 0, time_generated2 = 0,
	time0, time1;

var total_pointN = 0, outputCsv = '', missCnt = 0, generated = false;


$.ajax({
	url: '//8.209.76.236:3005/construct_test_sample',
	method: 'get',
	success: (points) => {
		if (points) {
			first_N = points.length;
			console.log('point', points);
			scales = dimensions.map((_, i) => d3.scaleLinear().domain(d3.extent(points, d => d[i])).range([0, 1024]));
			let i = 0, l = Math.min(points.length, first_N - total_pointN);
			for (; i < l; i += 1) {
				time0 = window.performance.now();
				rtree.insert(dimensions.map(d => scales[d](points[i][d])));
				time1 = window.performance.now();
				time_inserted += time1 - time0;
				total_pointN++;
				if (total_pointN % 1000 === 0) {
					// console.log(total_pointN, time_inserted);
					outputCsv += `${total_pointN}, ${time_inserted}\n`;
				}
			}

			if (total_pointN >= first_N) {
				if (!generated) {
					time0 = window.performance.now();
					rtree.generate();
					time1 = window.performance.now();
					time_generated = time1 - time0;
					generated = true;

					console.log(`rtree (${rtree.sat.nodesInfo.length}/${rtree.data.height})`, rtree);
					console.log('insert/generate', time_inserted, time_generated);
					outputCsv += `${total_pointN}, ${time_inserted + time_generated}\n`;
				}

				i = Math.max(0, l);
				l = points.length;
				let flag;
				for (; i < l; i += 1) {
					time0 = window.performance.now();
					flag = rtree.insert2(dimensions.map(d => scales[d](points[i][d])));
					time1 = window.performance.now();
					if (flag == false) { ++missCnt; }
					time_inserted2 += time1 - time0;
					total_pointN++;
					if (total_pointN % 1000 === 0) {
						// console.log(total_pointN, time_inserted2 + time_inserted);
						outputCsv += `${total_pointN}, ${time_inserted2 + time_inserted + time_generated}\n`;
					}
				}
			}

			let offest = 0, limit = 10000;
			fetchPoints(offest, limit)()
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				// .then(fetchPoints(offest += limit, limit))
				.then(() => {
					// time0 = window.performance.now();
					// rtree.generate();
					// time1 = window.performance.now();
					// time_generated = time1 - time0;

					time0 = window.performance.now();
					rtree.generate2();
					time1 = window.performance.now();
					time_generated2 = time1 - time0;

					console.log('insert2/generate2', time_inserted2, time_generated2);
					console.log('total', time_inserted + time_generated + time_inserted2 + time_generated2);

					console.log(outputCsv);
					console.log(missCnt);
				})
		}
	}
});
