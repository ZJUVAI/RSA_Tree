import '../css/brushingAndLinking.less';
import '../css/index.less';

import * as d3 from 'd3';
import $ from 'jquery';
import Map from './utility/map'
import { fetchFuncs } from './utility/utility';
import Controller from './controller/controller';
import Barchart from './chart/barchart';
import Heatmap from './chart/heatmap_batch';
import Timelinechart from './chart/timelinechart';

let { fetchJSON } = fetchFuncs;

const REQUEST_ID = 'BrushingAndLinking_1129_brightkite_1';

const data_fetch = {
	// path：读取数据的路径；name：文件名，和原始数据文件名（在根目录）；extra：后缀，用来放不同的测试集
	// path: '1220/', name: 'brightkite_days', extra: '',
	path: 'BRIGHTKITE/', name: 'brightkite_days', extra: '',
	satNumPerFile: 50,
	checkIntersects: false,
	checkError: false,
	checkTime: false, checkTime_loop: 1,
};

// const data_fetchOrigin = {
// 	name: 'brightkite', extra: '_small',
// };

// let chartType = [''], // heatmap/direct/nodes/error (e.g. ['heatmap', 'nodes'])
let heatmapResolution_target = [1024, 1024];
// timeTest = false, timeTest_loop = 10,
// timeTest_histo = false, timeTest_loop_histo = 10;

let map = new Map({
	container: 'brushmap',
	options: {
		minZoom: 6, maxZoom: 8,
		zoomDelta: 0.25,
		zoomSnap: 0,
		maxBounds: [L.latLng(30, -130), L.latLng(45, -112)],
		maxBoundsViscosity: 1.0,
	},
	// view: [[35, -100], 5],
	view: [[34, -117], 6],
});


map.setOffset((zoom) => {
	console.log(zoom);
	switch (Math.floor(zoom)) {
		case 6:
			return { lon: 0, lat: 0, x: 0, y: 100 };
		case 7:
			return { lon: 0, lat: 0, x: 0, y: 30 };
		case 8:
			return { lon: 0, lat: 0, x: 0, y: 1 };
		default:
			return { lon: 0, lat: 0, x: 0, y: 0 };
	}
});

$(function () {
	// SQL query
	// let promise_sql = new Promise((resolve, reject) => {
	// 	fetchJSON('getBrightkite_test', (result, status) => status === 'success' ? resolve(result) : reject(status), {});
	// }).then((result) => {
	// 	console.log('brushingAndLinking_main:(load origin)', result);
	// 	return result;
	// });

	// // test construction
	// fetchJSON('constructRSATree', (result, status) => console.log('POST /constructRSATree', status, result), {
	// 	data: Object.assign({}, data_fetch, {
	// 		uuid: 'BrushingAndLinking_1129_brightkite_1',
	// 	}),
	// });

	let controller;
	let promise_parameter;//, promise_preprocess, promise_testData;
	// get parameters
	promise_parameter = new Promise((resolve, reject) => {
		fetchJSON('constructRSATree', (result, status) => status === 'success' ? resolve(result) : reject(status), {
			data: Object.assign({}, data_fetch, {
				uuid: REQUEST_ID,
			}),
		});
	}).then((result) => {
		console.log('brushingAndLinking_main:(load parameter)', result);

		let dataDomain = result.dataDomain.map(d => [+d[0], +d[1]]),
			scaleDomain = result.scaleDomain.map(d => [+d[0], +d[1]]);

		controller = new Controller({
			attributes: {
				// 0: { domain: dataDomain[0], scale: scaleDomain[0] },
				// 1: { domain: dataDomain[1], scale: scaleDomain[1] },
				lon: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
				lat: { id: 1, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
				time: { id: 2, type: 'numerical', domain: dataDomain[2], scale: scaleDomain[2] },
				dayOfWeek: { id: 4, type: 'ordinal', domain: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }, //Array.from(Array(7)).map((_, i) => i)
				hour: { id: 3, type: 'ordinal', domain: Array.from(Array(24)).map((_, i) => i) },
			},
			scaleAlignment: true,
			granularity: 1,
		});
		console.log('brushingAndLinking_main:(load parameter)', 'controller', result);
		return result;
	});

	Promise.all([promise_parameter]).then(([paremeters]) => {

		let createBarchart = (name, container) => {
			let barchart = new Barchart({
				container: container,
				width: 620,
				height: 316,
				margins: {
					top: 50,
					left: 80,
					right: 30,
					bottom: 20
				},
				type: 'categorical',
				binSetting: controller.fitBin(name),
				getValue: ({ domain, binWidth, binNum }, finish) => {
					let dimension = controller.dimensions[name];
					let query = controller.generateQueryGrid({
						[name]: {
							x0: domain[0],
							binWidth,
							binNum,
						}
					});

					return fetchJSON('requestRSATree',
						(result, status) => finish(result.map((d, i) => ({
							index: d.index[dimension.id],
							// value: d.result.value,
							value: d.value,
							// uncertainty: d.result.uncertainty,
							origin: dimension.domain[d.index[dimension.id]],
						}))), {
							data: Object.assign({}, data_fetch, {
								uuid: REQUEST_ID,
								query: JSON.stringify(query),
								name: `barchart_${name}`,
							}),
						});
				},
				onSelect: (filter) => {
					controller.filter(name, filter);
					heatmap.refresh();
					barchart_dayofweek.refresh();
					barchart_hour.refresh();
					timelinechart_time.refresh();
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
			});

			return barchart;
		}, createTimelinechart = (name, container) => {
			let timelinechart = new Timelinechart({
				container: container,
				width: 620,
				height: 316,
				margins: {
					top: 50,
					left: 80,
					right: 30,
					bottom: 120
				},
				margins2: {
					top: 250,
					left: 80,
					right: 30,
					bottom: 20
				},
				domain: controller.dimensions[name].domain,
				fitBin: (domain, targetInterval) => {
					let { domain_origin, domain: domain_fit, binWidth, binNum } = controller.fitBin(name, domain, targetInterval);
					return {
						domain_origin, domain: domain_fit, binWidth, binNum,
					};
				},
				getValue: ({ domain, binWidth, binNum }, finish) => {
					let dimension = controller.dimensions[name];
					let query = controller.generateQueryGrid({
						[name]: {
							x0: domain[0],
							binWidth,
							binNum,
						}
					});

					return fetchJSON('requestRSATree',
						(result, status) => finish(result.map((d, i) => ({
							index: d.index[dimension.id],
							// value: d.result.value,
							value: d.value,
							// uncertainty: d.result.uncertainty,
							// origin: [dimension.toOrigin(domain[0] + binWidth * i), dimension.toOrigin(domain[0] + binWidth * (i + 1))],
							origin: dimension.toOrigin(domain[0] + binWidth * (d.index[dimension.id] + 0.5)),
						}))), {
							data: Object.assign({}, data_fetch, {
								uuid: REQUEST_ID,
								query: JSON.stringify(query),
								name: `timelinechart_${name}`,
							}),
						});
				},
				onSelect: (filter) => {
					let filter_fit = controller.filter(name, filter);
					heatmap.refresh();
					barchart_dayofweek.refresh();
					barchart_hour.refresh();
					timelinechart_time.refresh();
					return filter_fit;
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
			});

			return timelinechart;
		};

		let heatmap
			= new Heatmap({
				render: false,
				map,
				// svg: 'brushmapSvg',
				canvas: 'brushmapCanvas',
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
							}),
						});
				},
				// refreshOptions: { test: timeTest, loop: timeTest_loop, render: true },
			}),
			barchart_dayofweek = createBarchart('dayOfWeek', 'barchart-dayofweek'),
			barchart_hour = createBarchart('hour', 'barchart-hour'),
			timelinechart_time = createTimelinechart('time', 'timelinechart-time');

		// console.log([controller.dimensions['lon'].domain, controller.dimensions['lat'].domain]);
		// map.drawBoundingbox([controller.dimensions['lon'].domain, controller.dimensions['lat'].domain]);
		timelinechart_time.init();
		barchart_dayofweek.init();
		barchart_hour.init();
		heatmap.init();
	});

	window.getAll = function () {
		Promise.all([promise_parameter]).then(([parameters]) => {
			fetchJSON('requestRSATree_all', (result, status) => {
				console.log(result);
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
})