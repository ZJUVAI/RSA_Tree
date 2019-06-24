import '../css/heatmap.less';
import '../css/index.less';
import Map from './utility/map'
import deserialize from './utility/deserialize';
import { statistics, fetchFuncs, consoleFuncs } from './utility/utility';
import Controller from './controller/controller';
import Heatmap from './chart/heatmap_batch';
import * as d3 from 'd3';
import Timer from './test/timer';

let { fetchJSON, fetchBinary } = fetchFuncs;

const REQUEST_ID = 'POI';

const data_fetch = {
	// path: '1218/', name: 'poi', extra: '',
	path: 'POI/', name: 'poi', extra: '',
	satNumPerFile: 50,
	checkError: false,
	checkTime: false, checkTime_loop: 12,
};

const boundingbox = [[119.23710632324219, 122.82713856109619], [27.15396499633789, 31.17931958053589]],
	chartType = ['heatmap', 'error'], // heatmap/direct/nodes/error (e.g. ['heatmap', 'nodes'])
	heatmapResolution_target = [512, 512];

let map = new Map({
	container: 'map',
	options: { minZoom: 7, maxZoom: 18 },
	view: [[29.20107298174993, 121.05], 9],
	// view: [[29.864151472184368, 121.54859518860786], 13],
	// view: [[29.49417656691086, 121.03895], 13],
});


// // 宁波
// map.setView([29.864151472184368, 121.54859518860786], 13);
// let boundingbox = [[121.32311138332336, 121.77186541305512],
// [29.610846456419676, 30.114015779444426]];

// // 新昌
// map.setView([29.49417656691086, 121.03895], 13);
// let boundingbox = [[120.70256870158494, 121.15132273131668],
// [29.241331484823377, 29.744500807848127]];

$(heatmap_main);

// onload
function heatmap_main() {
	let controller;
	let promise_parameter, promise_preprocess, promise_testData;

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

		controller = new Controller({
			type: 'rtree',
			attributes: {
				lon: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
				lat: { id: 1, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
			},
			scaleAlignment: true,
			granularity: 1,
		});
		return result;
	});

	// if (chartType.includes('heatmap') || chartType.includes('error') || chartType.includes('nodes')) {
	// 	let promise_rtree = new Promise((resolve, reject) => {
	// 		promise_parameter.then((param) => {
	// 			// load RTree
	// 			fetchBinary('fetchPreprocess', (result, status) => status === 'success' ? resolve({ result, param }) : reject(status), {
	// 				data: Object.assign({ type: 'rtree' }, data_fetch),
	// 			});
	// 		})
	// 	}).then(({ result, param }) => {
	// 		let rtree = deserialize(result, param);
	// 		console.log('heatmap_main:(load RTree)', rtree);
	// 		return rtree;
	// 	}), promise_sat = new Promise((resolve, reject) => {
	// 		promise_parameter.then((param) => {
	// 			// load SAT
	// 			fetchBinary('fetchPreprocess', (result, status) => status === 'success' ? resolve({ result, param }) : reject(status), {
	// 				data: Object.assign({ type: 'sat' }, data_fetch),
	// 			});
	// 		})
	// 	}).then(({ result, param }) => {
	// 		let sat = deserialize(result, param);
	// 		console.log('heatmap_main:(load SAT)', sat);
	// 		return sat;
	// 	});

	// 	promise_preprocess = Promise.all([promise_rtree, promise_sat]).then(([rtree, sat]) => {
	// 		rtree.sat = sat;
	// 		return { rtree, sat };
	// 	});
	// }

	// if (chartType.includes('error')) {
	// 	// load precise data
	// 	promise_testData = new Promise((resolve, reject) => {
	// 		promise_parameter.then((param) => {
	// 			fetchBinary('fetchOrigin', (result, status) => status === 'success' ? resolve(result) : reject(status), {
	// 				data: data_fetchOrigin
	// 			});
	// 		})
	// 	}).then((result) => {
	// 		let points = deserialize(result);
	// 		console.log('heatmap_main:(load points)', points);
	// 		return points;
	// 	});
	// }

	/* draw */
	// console.log('heatmap_main', 'map boundingbox', boundingbox);
	// map.drawBoundingbox(boundingbox);

	// if (chartType.includes('nodes')) {
	// 	Promise.all([promise_preprocess]).then(([{ sat }]) => {
	// 		sat.tables.forEach(function ({ domain }) {
	// 			map.drawBoundingbox(controller.toOrigin_boundingbox(domain));
	// 		});
	// 	});
	// }

	if (chartType.includes('heatmap') || chartType.includes('error')) {
		Promise.all([promise_parameter]).then(([parameters]) => {
			let heatmap = new Heatmap({
				map,
				// svg: 'mapSvg',
				canvas: 'mapCanvas',
				resolution: heatmapResolution_target,
				fitGrid: (boundingbox, targetSize) => {
					let { boundingbox_origin, boundingbox: boundingbox_fit, size } = controller.fitGrid({ lon: boundingbox[0], lat: boundingbox[1] }, { lon: targetSize[0], lat: targetSize[1] }, true);
					return {
						boundingbox_origin: [boundingbox_origin.lon, boundingbox_origin.lat],
						boundingbox: [boundingbox_fit.lon, boundingbox_fit.lat],
						size: [size.lon, size.lat],
					};
				},
				getValue: ({ domain, binWidth, binNum }, finish) => {
					let query = controller.generateQueryGrid({
						lon: {
							x0: domain[0][0],
							binWidth: binWidth[0],
							binNum: binNum[0],
						},
						lat: {
							x0: domain[1][0],
							binWidth: binWidth[1],
							binNum: binNum[1],
						},
					});

					fetchJSON('requestRSATree',
						(result, status) => finish(result/*.map((d, i) => ({
							index: [d.index[0], d.index[1]],
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							// origin: dimension.domain[i],
						}))*/), {
							data: Object.assign({}, data_fetch, {
								uuid: REQUEST_ID,
								query: JSON.stringify(query),
								name: `heatmap`,
								options: JSON.stringify({
									minLevel: 0,
								}),
							}),
						});
				},
				// refreshOptions: { test: timeTest, loop: timeTest_loop, render: chartType.includes('heatmap') },
			});

			heatmap.init();
		});
	}

	window.getAll = function () {
		Promise.all([promise_parameter]).then(([parameters]) => {
			fetchJSON('requestRSATree_all', (result, status) => {
				console.log(result);
			}, {
					data: Object.assign({}, data_fetch, {
						uuid: REQUEST_ID,
						name: `poi`,
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