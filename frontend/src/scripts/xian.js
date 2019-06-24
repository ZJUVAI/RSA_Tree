import '../css/heatmap.less';
import '../css/index.less';
import Map from './utility/map'
import deserialize from './utility/deserialize';
import { statistics, fetchFuncs, consoleFuncs } from './utility/utility';
import Controller from './controller/controller';
import Heatmap from './chart/heatmap';
import * as d3 from 'd3';
import Timer from './test/timer';

let { fetchJSON, fetchBinary } = fetchFuncs;

const REQUEST_ID = 'XIAN';

const data_fetch = {
	path: 'xian_hier_0104/', name: 'xian', extra: '',
	satNumPerFile: 50,
	checkError: true,
	checkTime: true, checkTime_loop: 3,
};

const boundingbox = [[108.911, 108.999], [34.205, 34.281]],
	chartType = ['heatmap', 'nodes'], // heatmap/direct/nodes/error (e.g. ['heatmap', 'nodes'])
	// chartType = ['heatmap'], // heatmap/direct/nodes/error (e.g. ['heatmap', 'nodes'])
	// chartType = ['nodes'], // heatmap/direct/nodes/error (e.g. ['heatmap', 'nodes'])
	heatmapResolution_target = [64, 64];

let map = new Map({
	container: 'map',
	options: { minZoom: 4, maxZoom: 18 },
	// view: [[34.243, 108.960], 14],
	// view: [[34.26957694899875, 108.91813516616823], 16],
	view: [[34.27057439983362, 108.91672164201738], 18],
});

// map.setOffset({ lon: -0.00468, lat: 0.00183 });
map.setOffset({ lon: -0.0046, lat: 0.0017 });

window.mapInfo = function () {
	console.log(map.leaflet.getCenter(), map.leaflet.getZoom());
}

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
	console.log('heatmap_main', 'map boundingbox', boundingbox);
	map.drawBoundingbox(boundingbox);

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
				map, svg: 'mapSvg',
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
						(result, status) => finish(result.map((d, i) => ({
							index: [d.index[0], d.index[1]],
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							// origin: dimension.domain[i],
						}))), {
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
				refreshOptions: { useLog: false },
			});

			heatmap.init();
		});
	}


	if (chartType.includes('nodes')) {
		Promise.all([promise_parameter]).then(([parameters]) => {
			fetchJSON('requestRSATree_nodes', (result, status) => {
				// draw nodes;
				let options_nodes = { color: 'teal' };
				let drawNodes_recur = function (node) {
					if (node.level == 0) {//leaf
						let domain = node.domain;
						let { lon, lat } = controller.toOrigin_boundingbox({ lon: domain[0], lat: domain[1] });
						map.drawBoundingbox([lon, lat], options_nodes);
					} else {
						node.children.forEach(drawNodes_recur);
					}
				}

				drawNodes_recur(result);


				let options_quad = { color: 'red' };
				let drawQuad_recur = function (node, level) {
					map.drawBoundingbox(node, options_quad);

					if (level > 0) {
						let left = [node[0][0], node[1][0]],
							right = [node[0][1], node[1][1]],
							mid = [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2];

						let quads = [
							[[left[0], mid[0]], [left[1], mid[1]]],
							[[left[0], mid[0]], [mid[1], right[1]]],
							[[mid[0], right[0]], [left[1], mid[1]]],
							[[mid[0], right[0]], [mid[1], right[1]]],
						];
						quads.forEach(d => drawQuad_recur(d, level - 1));
					}
				}

				drawQuad_recur(boundingbox, 0);
			}, {
					data: Object.assign({}, data_fetch, {
						uuid: REQUEST_ID,
						name: `heatmap_nodes`,
					}),
				});
		});
	}

}