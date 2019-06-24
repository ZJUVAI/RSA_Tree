// import '../css/splom.less';
// import '../css/index.less';
import { fetchFuncs } from './utility/utility';
// import Controller from './controller/controller';
import * as d3 from 'd3';

let { fetchJSON } = fetchFuncs;

const REQUEST_ID = 'SPLOM';

const data_fetch = {
	path: '1221/', name: 'splom5', extra: '',
	satNumPerFile: 50,
	checkError: true,
	checkTime: true, checkTime_loop: 100,
};

$(splom_main);

// onload
function splom_main() {
	let controller;
	let promise_parameter;

	promise_parameter = new Promise((resolve, reject) => {
		fetchJSON('constructRSATree', (result, status) => status === 'success' ? resolve(result) : reject(status), {
			data: Object.assign({}, data_fetch, {
				uuid: REQUEST_ID,
			}),
		});
	}).then((result) => {
		console.log('heatmap_main:(load parameter)', result);

		let dataDomain = result.dataDomain,
			scaleDomain = result.scaleDomain;

		// controller = new Controller({
		// 	type: 'rtree',
		// 	attributes: {
		// 		0: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
		// 		1: { id: 1, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
		// 		2: { id: 2, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
		// 		3: { id: 3, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
		// 		4: { id: 4, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
		// 	},
		// 	scaleAlignment: true,
		// 	granularity: 1,
		// });
		return result;
	});

	let results = {};
	Promise.all([promise_parameter]).then(([parameters]) => {
		for (let i = 0; i < 5; i += 1) {
			// 1-d histogram
			let query = [];
			for (let k = 0; k < 5; k += 1) {
				if (k == i) {
					query.push({
						x0: 0,
						binWidth: 1,
						binNum: 50,
						min: 0, max: 50,
					});
				} else {
					query.push({
						x0: 0,
						binWidth: 50,
						binNum: 1,
						min: 0, max: 50,
					});
				}
			}
			fetchJSON('requestRSATree',
				(result, status) => {
					results[`${i}`] = result;
					console.log(results);
				}, {
					data: Object.assign({}, data_fetch, {
						uuid: REQUEST_ID,
						query: JSON.stringify(query),
						name: `SPLOM-${i}`,
					}),
				}
			);

			for (let j = i + 1; j < 5; j += 1) {
				// 2-d heatmap
				let query = [];
				for (let k = 0; k < 5; k += 1) {
					if (k == i || k == j) {
						query.push({
							x0: 0,
							binWidth: 1,
							binNum: 50,
							min: 0, max: 50,
						});
					} else {
						query.push({
							x0: 0,
							binWidth: 50,
							binNum: 1,
							min: 0, max: 50,
						});
					}
				}
				fetchJSON('requestRSATree',
					(result, status) => {
						results[`${i}X${j}`] = result;
						console.log(results);
					}, {
						data: Object.assign({}, data_fetch, {
							uuid: REQUEST_ID,
							query: JSON.stringify(query),
							name: `SPLOM-${i}X${j}`,
						}),
					}
				);
			}
		}
	});

	window.getAll = function () {
		Promise.all([promise_parameter]).then(([parameters]) => {
			fetchJSON('requestRSATree_all', (result, status) => {
				console.log(result);

				let timesArray = result.times,
					avgs = [];
				for (let key in timesArray) {
					let times = timesArray[key],
						avg = (times.reduce((a, b) => a + b, 0)) / times.length;
					avgs.push(avg);
				}
				console.log((avgs.reduce((a, b) => a + b, 0)) / avgs.length);
			}, {
					data: Object.assign({}, data_fetch, {
						uuid: REQUEST_ID,
						name: `brightkite`,
					}),
				});
		});
	};

	window.getAll_clear = function () {
		Promise.all([promise_parameter]).then(([parameters]) => {
			fetchJSON('requestRSATree_all_clear', (result, status) => {
			}, {
					data: Object.assign({}, data_fetch, {
						uuid: REQUEST_ID,
						name: `brightkite`,
					}),
				});
		});
	};
}

// //init
// var cell_width = 150, cell_margin = 5;
// var svg = d3.select('#svg')
// 	.attr('width', cell_margin + (cell_width + cell_margin) * d)
// 	.attr('height', cell_margin + (cell_width + cell_margin) * d),
// 	cells = svg.selectAll('.cell')
// 		.data(graphs)
// 		.enter().append('g')
// 		.attr('class', 'cell')
// 		.attr('transform', d => `translate(${cell_margin + d.i * (cell_width + cell_margin)},${cell_margin + d.j * (cell_width + cell_margin)})`),
// 	cell_boundry = cells.append('rect')
// 		.attr('class', 'cell_boundry')
// 		.attr('x', 0).attr('y', 0)
// 		.attr('width', cell_width).attr('height', cell_width);

// // draw cell contents
// cells.each((d, i, group) => {
// 	// d.graph.draw(group[i],result);
// });