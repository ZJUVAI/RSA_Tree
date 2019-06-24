import '../css/flight.less';
import '../css/index.less';

import $ from 'jquery';
import { fetchFuncs } from './utility/utility';
import Controller from './controller/controller';
import Barchart from './chart/barchart';
import Histogram from './chart/histogram';
import BinnedScatterplot from './chart/binnedscatterplot';
import Timelinechart from './chart/timelinechart';

let { fetchJSON } = fetchFuncs;

const REQUEST_ID = 'Flight';

const data_fetch = {
	path: '1207/', name: 'flight', extra: '',
	satNumPerFile: 50,
	checkError: true,
	checkTime: true, checkTime_loop: 3,
};


$(function () {
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
		console.log('flight_main:(load parameter)', result);

		let dataDomain = result.dataDomain.map(d => [+d[0], +d[1]]),
			scaleDomain = result.scaleDomain.map(d => [+d[0], +d[1]]);

		controller = new Controller({
			attributes: {
				// 0: { domain: dataDomain[0], scale: scaleDomain[0] },
				// 1: { domain: dataDomain[1], scale: scaleDomain[1] },
				depDelay: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
				arrDelay: { id: 1, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
				dayOfWeek: { id: 2, type: 'ordinal', domain: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }, //Array.from(Array(7)).map((_, i) => i)
				year: { id: 3, type: 'ordinal', domain: Array.from(Array(18)).map((_, i) => (2001 + i).toString()) },
				carrier: { id: 4, type: 'ordinal', domain: ['AA', 'AQ', 'AS', 'CO', 'DL', 'US', 'WN', 'NW', 'TW', 'UA', 'HP', 'MQ', 'B6', 'DH', 'EV', 'FL', 'OO', 'RU', 'TZ', 'HA', 'OH', 'F9', 'YV', 'XE', '9E', 'VX', 'NK', 'G4', 'YX'] },
				month: { id: 5, type: 'ordinal', domain: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
			},
			scaleAlignment: true,
			granularity: 1,
		});
		console.log('flight_main:(load parameter)', 'controller', controller);
		return result;
	});

	Promise.all([promise_parameter]).then(([paremeters]) => {
		let createBarchart = (name, container, options_) => {
			let options = Object.assign({
				binWidth: [1000, 1000],
				renderOptions: { useLog: true },
			}, options_);
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
						(result, status) => finish(result.map((d, i) => options.type == 'categorical' ? ({
							index: d.index[dimension.id],
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							origin: dimension.domain[i],
						}) : ({
							index: d.index[dimension.id],
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							origin: dimension.domain[i],
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
					barchart_dayofweek.refresh();
					barchart_year.refresh();
					barchart_month.refresh();
					scatterplot_delays.refresh();
					scatterplot_year_delay.refresh();
					scatterplot_year_month.refresh();
					// histogram_depdelay.refresh();
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
			});

			return barchart;
		};

		let createHistogram = (name, container, options_) => {
			let options = Object.assign({
				binWidth: 1000,
				renderOptions: { useLog: true },
			}, options_);
			let histogram = new Histogram({
				container: container,
				width: 620,
				height: 316,
				margins: {
					top: 50,
					left: 80,
					right: 30,
					bottom: 40
				},
				binSetting: {
					binWidth: options.binWidth,
					domain_origin: controller.dimensions[name].domain,
				},
				fitGrid: (targetDomain, targetBinWidth) => {
					let { domain_origin, domain, binWidth, binNum, x0, x1 } = controller.fitBin(name, targetDomain, targetBinWidth, null);
					return {
						domain_origin,
						domain,
						binWidth,
						binNum,
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
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							// origin: dimension.domain[i],
						}))), {
							data: Object.assign({}, data_fetch, {
								uuid: REQUEST_ID,
								query: JSON.stringify(query),
								name: `histogram_${name}`,
							}),
						});
				},
				onSelect: (filter) => {
					controller.filter(name, filter);
					barchart_dayofweek.refresh();
					barchart_year.refresh();
					barchart_month.refresh();
					scatterplot_delays.refresh();
					scatterplot_year_delay.refresh();
					scatterplot_year_month.refresh();
					// histogram_depdelay.refresh();
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
			});

			return histogram;
		};

		let createBinnedScatterplot = (name1, name2, container, options_) => {
			let options = Object.assign({
				binWidth: [1000, 1000],
				renderOptions: { useLog: true },
			}, options_);
			let scatterplot = new BinnedScatterplot({
				container: container,
				width: 620,
				height: 620,
				margins: {
					top: 50,
					left: 80,
					right: 30,
					bottom: 20
				},
				binSetting: {
					binWidth: options.binWidth,
					domain_origin: [controller.dimensions[name1].domain, controller.dimensions[name2].domain],
				},
				fitGrid: (domain, targetBinWidth) => {
					let { boundingbox_origin, boundingbox: boundingbox_fit, size, resolution } = controller.fitGrid({ [name1]: domain[0], [name2]: domain[1] }, { [name1]: targetBinWidth[0], [name2]: targetBinWidth[1] }, false);
					return {
						domain_origin: [boundingbox_origin[name1], boundingbox_origin[name2]],
						domain: [boundingbox_fit[name1], boundingbox_fit[name2]],
						binWidth: [size[name1], size[name2]],
						binNum: [resolution[name1], resolution[name2]],
					};
				},
				getValue: ({ domain, binWidth, binNum }, finish) => {
					let dimension1 = controller.dimensions[name1],
						dimension2 = controller.dimensions[name2];
					let query = controller.generateQueryGrid({
						[name1]: {
							x0: domain[0][0],
							binWidth: binWidth[0],
							binNum: binNum[0],
						},
						[name2]: {
							x0: domain[1][0],
							binWidth: binWidth[1],
							binNum: binNum[1],
						},
					});

					return fetchJSON('requestRSATree',
						(result, status) => finish(result.map((d, i) => ({
							index: [d.index[dimension1.id], d.index[dimension2.id]],
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							// origin: dimension.domain[i],
						}))), {
							data: Object.assign({}, data_fetch, {
								uuid: REQUEST_ID,
								query: JSON.stringify(query),
								name: `binnedscatterplot_${name1}_${name2}`,
							}),
						});
				},
				onSelect: (filter) => {
					controller.filter(name, filter);
					barchart_dayofweek.refresh();
					barchart_year.refresh();
					barchart_month.refresh();
					scatterplot_delays.refresh();
					scatterplot_year_delay.refresh();
					scatterplot_year_month.refresh();
					// histogram_depdelay.refresh();
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
				renderOptions: Object.assign({}, options.renderOptions),
			});

			return scatterplot;
		};

		let barchart_dayofweek = createBarchart('dayOfWeek', 'barchart-dayofweek'),
			barchart_year = createBarchart('year', 'barchart-year'),
			barchart_month = createBarchart('month', 'barchart-month');

		let scatterplot_delays = createBinnedScatterplot('depDelay', 'arrDelay', 'scatterplot-delays'),
			scatterplot_year_delay = createBinnedScatterplot('year', 'depDelay', 'scatterplot-year-delay'),
			scatterplot_year_month = createBinnedScatterplot('year', 'month', 'scatterplot-year-month');

		// let histogram_depdelay = createHistogram('depDelay', 'histogram-depdelay');

		barchart_dayofweek.init();
		barchart_year.init();
		barchart_month.init();

		scatterplot_delays.init();
		scatterplot_year_delay.init();
		scatterplot_year_month.init();

		// histogram_depdelay.init();

		window.test = function () {
			histogram_depdelay.parameters.binSetting.binWidth /= 2;
			histogram_depdelay.refresh({ renderBackground: true });
		};
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
});