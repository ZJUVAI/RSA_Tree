import * as d3 from 'd3';
import '../css/binned.less';
import '../css/index.less';

// import $ from 'jquery';
import { fetchFuncs } from './utility/utility';
import Controller from './controller/controller';
import Histogram from './chart/histogram_log';
import BinnedScatterplot from './chart/binnedscatterplot';

let { fetchJSON } = fetchFuncs;

const REQUEST_ID = 'Flight';

const data_fetch = {
	path: '0118/', name: 'flight4', extra: '',
	satNumPerFile: 50,
	checkError: false,
	checkTime: false, checkTime_loop: 3,
};

const REQUEST_ID2 = 'Flight_Histo';

const data_fetch2 = {
	path: '0118/', name: 'flight3', extra: '',
	satNumPerFile: 50,
	checkError: false,
	checkTime: false, checkTime_loop: 3,
};

let $ = require('jquery');
require('bootstrap');
let Slider = require('bootstrap-slider');

let attrSliderBinned = new Slider('#attr-filter-binned', {
	id: 'slider-attr-binned',
	min: 0,
	max: 0,
	attrValue: [0, 0],
	range: true,
	step: 10,
	tooltip: 'always',
	tooltip_split: true,
	tooltip_position: 'bottom',
	precision: 2,
});

let binSliderBinned = new Slider('#bin-filter-binned', {
	id: 'slider-bin-binned',
	min: 0,
	max: 0,
	step: 10,
	range: false,
	tooltip: 'always',
	precision: 2,
	tooltip_position: 'bottom',
});

let attrSliderHistogram = new Slider('#attr-filter-histogram', {
	id: 'slider-attr-histogram',
	min: 0,
	max: 0,
	attrValue: [0, 0],
	range: true,
	step: 10,
	tooltip: 'always',
	tooltip_split: true,
	precision: 2,
	tooltip_position: 'bottom',
});

let binSliderHistogram = new Slider('#bin-filter-histogram', {
	id: 'slider-bin-histogram',
	min: 0,
	max: 0,
	step: 1,
	range: false,
	tooltip: 'always',
	precision: 2,
	tooltip_position: 'bottom',
});

let filterArray = []; // 格式为[carrierDelay, [distance, lateAircraftDelay]]
// 为了暴力计算存储的数据 格式为[x, y, z]
let violenceArray = [];
let violenceArrayNew = [];

$('.tooltip').find('.tooltip-arrow').remove();

$(() => {
	let xNameScatter = 'Distance',
		yNameScatter = 'CarrierDelay',
		xNameHistogram = 'LateAircraftDelay';
	// sizeName = 'CarrierDelay';
	// 修改左上角响应的属性名
	$('#x-field').html(`(${xNameScatter})`);
	$('#y-field').html(`(${yNameScatter})`);
	$(`[data-field=${xNameScatter}]`).parent('.item-field').css({
		'background-color': 'white',
		'border-color': '#2C82BE',
		'border-width': '2px'
	});
	$(`[data-field=${yNameScatter}]`).parent('.item-field').css({
		'background-color': 'white',
		'border-color': '#2C82BE',
		'border-width': '2px'
	});
	// $(`[data-field=${sizeName}]`).parent('.item-field').css({
	// 	'background-color': 'white',
	// 	'border-color': '#2C82BE',
	// 	'border-width': '2px'
	// });
	// $('#size-field').html(`(${sizeName})`);
	$('#size-count').attr('checked', 'checked');
	$('#color-none').attr('checked', 'checked');

	let xNameWithOperatorScatter = `${$('#x-operator').html().toUpperCase()}(${xNameScatter})`;
	let yNameWithOperatorScatter = `${$('#y-operator').html().toUpperCase()}(${yNameScatter})`;
	let xNameWithOperatorHistogram = `${$('#y-operator').html().toUpperCase()}(${xNameHistogram})`;
	let yNameWithOperatorHistogram = `COUNT`;

	let controller, controller2;
	let promise_parameter, promise_parameter2;//, promise_preprocess, promise_testData;
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
				Distance: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
				CarrierDelay: { id: 1, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
			},
			scaleAlignment: false,
			granularity: 1,
		});
		console.log('flight_main:(load parameter)', 'controller', controller);
		return result;
	});

	Promise.all([promise_parameter]).then(([paremeters]) => {

		let createBinnedScatterplot = (name1, name2, container, options_) => {
			let options = Object.assign({
				binWidth: [500, 500],
				renderOptions: { useLog: true },
			}, options_);
			let scatterplot = new BinnedScatterplot({
				container: container,
				width: 720,
				height: 770,
				margins: {
					top: 120,
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
					scatterplot.refresh();
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
				renderOptions: Object.assign({}, options.renderOptions),
			});

			return scatterplot;
		};

		scatterplot = createBinnedScatterplot('Distance', 'CarrierDelay', 'binnedMap');

		scatterplot.init();
	});

	// HISTOGRAM
	promise_parameter2 = new Promise((resolve, reject) => {
		fetchJSON('constructRSATree', (result, status) => status === 'success' ? resolve(result) : reject(status), {
			data: Object.assign({}, data_fetch2, {
				uuid: REQUEST_ID2,
			}),
		});
	}).then((result) => {
		console.log('flight_main:(load parameter)', result);

		let dataDomain = result.dataDomain.map(d => [+d[0], +d[1]]),
			scaleDomain = result.scaleDomain.map(d => [+d[0], +d[1]]);

		controller2 = new Controller({
			attributes: {
				// 0: { domain: dataDomain[0], scale: scaleDomain[0] },
				// 1: { domain: dataDomain[1], scale: scaleDomain[1] },
				// Distance: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
				LateAircraftDelay: { id: 0, type: 'numerical', domain: dataDomain[0], scale: scaleDomain[0] },
				// CarrierDelay: { id: 1, type: 'numerical', domain: dataDomain[1], scale: scaleDomain[1] },
			},
			scaleAlignment: false,
			granularity: 1,
		});
		console.log('flight_main:(load parameter 2)', 'controller', controller2);
		return result;
	});

	Promise.all([promise_parameter2]).then(([paremeters]) => {

		let createHistogram = (name, container, options_) => {
			let options = Object.assign({
				binWidth: 100,
				renderOptions: { useLog: true },
			}, options_);
			let histogram = new Histogram({
				container: container,
				width: 720,
				height: 770,
				margins: {
					top: 80,
					left: 80,
					right: 30,
					bottom: 30
				},
				binSetting: {
					binWidth: options.binWidth,
					domain_origin: controller2.dimensions[name].domain,
				},
				fitGrid: (targetDomain, binSize) => {
					// let { domain_origin, domain, binWidth, binNum, x0, x1 } = controller2.fitBin(name, targetDomain, targetBinWidth, null);

					let dimension = controller2.dimensions[name],
						max = dimension.domain[1];

					let curDigit = 0,
						curX = binSize * Math.pow(10, curDigit),
						binNum = 0;
					let binXs = [0, curX];
					while (curX < max) {
						let curRatio = Math.pow(10, curDigit);
						for (let i = 0; i < 9; ++i) {
							curX += binSize * curRatio;
							binXs.push(curX);
							++binNum;
							if (curX >= max) break;
						}
						++curDigit;
					}
					let domain_origins = [],
						domains = [];
					// bins = [];
					for (let i = 1; i < binXs.length; i += 1) {
						let domain_origin = [binXs[i - 1], binXs[i]];
						let { x0, x1 } = controller2.fitRange(name, domain_origin);
						domain_origins.push(domain_origin);
						domains.push([x0 + 1, x1 + 1]);
						// bins.push([x0, x1]);
					}

					return {
						domain_origins,
						domains,
					};
				},
				getValue: ({ domains }, finish) => {
					let dimension = controller2.dimensions[name];
					let query = controller2.generateQueryGrid({
						[name]: domains,
					});

					return fetchJSON('requestRSATree_log',
						(result, status) => finish(result.map((d, i) => ({
							index: d.index[dimension.id],
							value: d.result.value,
							uncertainty: d.result.uncertainty,
							// origin: dimension.domain[i],
						}))), {
							data: Object.assign({}, data_fetch2, {
								uuid: REQUEST_ID2,
								query: JSON.stringify(query),
								name: `histogram_${name}`,
							}),
						});
				},
				onSelect: (filter) => {
					controller2.filter(name, filter);
					histogram.refresh();
				},
				// refreshOptions: { test: timeTest_histo, loop: timeTest_loop_histo, render: true },
			});

			return histogram;
		};

		histogram = createHistogram('LateAircraftDelay', 'histogram');

		histogram.init();
	});

	let scatterplot = null,
		histogram = null;

	// 初始化slider
	let changeAttrSlider = (min, max, steps, value, currentSlider, minHtml, maxHtml) => {
		let interval = max - min;
		currentSlider.setAttribute('min', min);
		currentSlider.setAttribute('step', (interval / steps));
		currentSlider.setAttribute('max', max);
		currentSlider.setValue(value);
		minHtml.html(min);
		maxHtml.html(max);
	};

	let changeBinSlider = (min, max, steps, value, currentSlider, minHtml, maxHtml) => {
		let interval = max - min;
		currentSlider.setAttribute('min', min);
		currentSlider.setAttribute('step', (interval / steps));
		currentSlider.setAttribute('max', max);
		minHtml.html(`${min}%`);
		maxHtml.html(`${max}%`);
		currentSlider.setValue(value);
	};

	changeBinSlider(5, 50, 45 * 10, 500, binSliderBinned, $('#bin-min-binned'), $('#bin-max-binned'));
	changeBinSlider(1, 200, 199, 100, binSliderHistogram, $('#bin-min-histogram'), $('#bin-max-histogram'));

	// 修改shape单选框的选中事件，切换显示直方图和散点图
	$('.shape-option').on('click', (e) => {
		let selectedID = e.target.id;
		$(`#${selectedID}`).addClass('shape-selected');
		$(`#${selectedID}`).siblings().removeClass('shape-selected');
		if (selectedID === 'shape-point') {
			// slider 的显隐
			if ($('#filter-field-binned').html() === '') {
				$('.bin-binned').css('display', 'block');
				$('.bin-histogram').css('display', 'none');
				$('.attr-histogram').css('display', 'none');
			} else {
				$('.bin-binned').css('display', 'block');
				$('.bin-histogram').css('display', 'none');
				$('.attr-binned').css('display', 'block');
				$('.attr-histogram').css('display', 'none');
			}
			// 右侧视图的响应显隐
			$('#binnedMap-container').css('display', 'block');
			$('#scatterPlot-histogram').css('display', 'none');
			$('#histogram-container').css('display', 'none');
			$('#scatterPlot-container').css('display', 'block');

			// 左上角
			$('#y-operator').html('BIN');
			$('#x-field').html(`(${xNameScatter})`);
			$('#y-field').html(`(${yNameScatter})`);
			$(`[data-field=${xNameScatter}]`).parent('.item-field').css({
				'background-color': 'white',
				'border-color': '#2C82BE',
				'border-width': '2px'
			});
			// $(`[data-field=${sizeName}]`).parent('.item-field').css({
			// 	'background-color': 'white',
			// 	'border-color': '#2C82BE',
			// 	'border-width': '2px'
			// });
			$(`[data-field=${yNameScatter}]`).parent('.item-field').css({
				'background-color': 'white',
				'border-color': '#2C82BE',
				'border-width': '2px'
			});
			$('#size-btn-group-none').css('display', 'none');
			$('#size-btn-group').css('display', 'inline-block');
		} else if (selectedID === 'shape-bar') {
			$('#binnedMap-container').css('display', 'none');
			$('#scatterPlot-container').css('display', 'none');
			$('#scatterPlot-histogram').css('display', 'block');
			$('#histogram-container').css('display', 'block');

			// 修改左上角属性
			$('#y-count').attr('checked', 'checked');
			$('#y-operator').html('COUNT');
			$('#x-field').html(`(${xNameHistogram})`);
			$('#y-field').html(`(${xNameHistogram})`);
			$(`[data-field=${xNameHistogram}]`).parent('.item-field').css({
				'background-color': 'white',
				'border-color': '#2C82BE',
				'border-width': '2px'
			});
			$(`[data-field=${xNameHistogram}]`).parent('.item-field').siblings().css('background-color', 'none');
			$('#size-btn-group-none').css('display', 'inline-block');
			$('#size-btn-group').css('display', 'none');
			$('#color-btn-group-none').css('display', 'inline-block');
			$('#color-btn-group').css('display', 'none');
			$('#item-size').hide();
			$('#item-shape').hide();
			if ($('#filter-field-histogram').html() === '') {
				$('.bin-histogram').css('display', 'block');
				$('.bin-binned').css('display', 'none');
				$('.attr-binned').css('display', 'none');
			} else {
				$('.bin-histogram').css('display', 'block');
				$('.bin-binned').css('display', 'none');
				$('.attr-histogram').css('display', 'block');
				$('.attr-binned').css('display', 'none');
			}
			// $(`[data-field=${sizeName}]`).parent('.item-field').css({
			// 	'background-color': 'white',
			// 	'border-color': '#2C82BE',
			// 	'border-width': '2px'
			// });
			$(`[data-field=${xNameScatter}]`).parent('.item-field').css({
				'background-color': '#f6f6f7',
				'border-color': '#979797',
				'border-width': '1px'
			});
			$(`[data-field=${yNameScatter}]`).parent('.item-field').css({
				'background-color': '#f6f6f7',
				'border-color': '#979797',
				'border-width': '1px'
			});
		}
	});

	// x-menu
	$('.x-operator-menu').change(() => {
		let operator = $('input[type="radio"][name="x-operator"]:checked').val();
		$('span#x-operator').html(operator.toUpperCase());
	});

	// y-menu
	$('.y-operator-menu').change(() => {
		let operator = $('input[type="radio"][name="y-operator"]:checked').val();
		$('span#y-operator').html(operator.toUpperCase());
		let checkedShape = $('input[type="radio"][name="shape"]:checked').val();
		if (checkedShape === 'bar') {
			sizeTypeForHistogram = operator;
			let currentValue = attrSliderHistogram.getValue();
			let binValue = binSliderHistogram.getValue();
		}

	});

	// size-menu
	$('.size-operator-menu').change(() => {
		let operator = $('input[type="radio"][name="size-operator"]:checked').val();
		$('span#size-operator').html(operator.toUpperCase());
	});

	// color-menu
	$('.color-operator-menu').change(() => {
		// current selected color
		let currentColor = $('input[type="radio"][name="color-operator"]:checked').val();
		$('#color-btn-group-none').hide();
		$('#color-btn-group').show();
		$('span#color-operator').html(currentColor.toUpperCase());
		// todo
		controller.parameters.scaleAlignment = true;
		scatterplot.refresh(null, () => {
			scatterplot.showUncertainty();
		})
	});

	// 添加filter
	$('.fa-filter').on('click', (event) => {
		let currentShape = $('.shape-selected').attr('id');
		console.log(currentShape);
		$('.attr').css('display', 'block');
		let $parent = $(event.target).parent();
		$parent.css({
			'background-color': 'white',
			'border-color': '#2C82BE',
			'border-width': '2px'
		});
		// if ($parent.hasClass('selected')) {
		// 	$parent.removeClass('selected');
		// 	$parent.css('background-color', '#ccc');
		// } else {
		// 	$parent.addClass('selected');
		// 	$parent.css({'background-color': 'white', 'border-color': '#2C82BE', 'border-width': '2px'});
		// }
		let fieldName = $(event.target).siblings('.field-name').html();
		if (currentShape === 'shape-point') {
			console.log(fieldName);
			$('.attr-binned').css('display', 'block');
			$('#filter-field-binned').html(`Filter: ${fieldName}`);
			// console.log(controller);
			let dimension = controller.dimensions[fieldName],
				domain = dimension.domain;
			changeAttrSlider(Math.floor(domain[0]), Math.ceil(domain[1]), dimension.scale[1] - dimension.scale[0], [Math.floor(domain[0]), Math.ceil(domain[1])], attrSliderBinned, $('#attr-min-binned'), $('#attr-max-binned'));
		} else if (currentShape === 'shape-bar') {
			$('.attr-histogram').css('display', 'block');
			$('#filter-field-histogram').html(fieldName);
			let dimension = controller2.dimensions[fieldName],
				domain = dimension.domain;
			changeAttrSlider(domain[0], domain[1], dimension.scale[1] - dimension.scale[0], [domain[0], domain[1]], attrSliderHistogram, $('#attr-min-histogram'), $('#attr-max-histogram'));
		}
	});


	attrSliderBinned.on('slide', () => {
		let currentValue = attrSliderBinned.getValue();
		let minValue = currentValue[0],
			maxValue = currentValue[1];
		console.log('slider-filter-binnnedmap', minValue, maxValue);
		controller.filter('Distance', [minValue, maxValue]);
		scatterplot.refresh();
	});

	// histogram
	attrSliderHistogram.on('slide', () => {
		let binValue = binSliderHistogram.getValue();
		let currentValue = attrSliderHistogram.getValue();
		let minValue = currentValue[0],
			maxValue = currentValue[1];
		console.log('slider-filter-histogram', minValue, maxValue);
	});

	// bin slider 滑动事件 scatterplot
	binSliderBinned.on('slide', () => {
		let attrValue = attrSliderBinned.getValue();
		let currentValue = binSliderBinned.getValue();
		d3.select('#binnedMap-svg').selectAll().remove();

		// console.log('slider-binnnedmap', currentValue);
		// scatterplot.parameters.binSetting.binWidth = [currentValue, currentValue];
		let t = currentValue / 100,
			domain1 = controller.dimensions['Distance'].domain,
			domain2 = controller.dimensions['CarrierDelay'].domain;
		scatterplot.parameters.binSetting.binWidth = [t * (domain1[1] - domain1[0]), t * (domain2[1] - domain2[0])];
		scatterplot.refresh({ renderBackground: true });
	});

	// bin slider 滑动事件 histogram
	binSliderHistogram.on('slide', () => {
		let attrValue = attrSliderHistogram.getValue();
		let currentValue = binSliderHistogram.getValue();

		// console.log('slider-histogram', currentValue);
		histogram.parameters.binSetting.binWidth = currentValue;
		histogram.refresh({ renderBackground: true });
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
