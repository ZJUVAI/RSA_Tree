import { get } from "http";

export function generateUUID(parameters_) {
	let parameters = Object.assign({
		sep: '-',
		format: [2, 1, 1, 1, 4],
		prefix: 'UUID',
		postfix: '',
	}, parameters_);
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}

	return `${parameters.prefix}${parameters.format.map(d => Array.from(new Array(d)).map(() => s4()).join('')).join(parameters.sep)}${parameters.postfix}`;
};

export const statistics = (function statistics_generator() {
	const FUNCTIONS = {
		count: values => values.length,
		sum: values => values.reduce((a, c) => a + c, 0),
		mean: values => values.reduce((a, c) => a + c, 0) / values.length,
		min: (values) => {
			if(values.length===0){return 0;}
			let min = values[0];
			for (let i = 1; i < values.length; i += 1) {
				if (values[i] < min) { min = values[i]; }
			}
			return min;
		},
		max: (values) => {
			if(values.length===0){return 0;}
			let max = values[0];
			for (let i = 1; i < values.length; i += 1) {
				if (values[i] > max) { max = values[i]; }
			}
			return max;
		},
		median: values => {
			let values_sorted = values.slice().sort((a, b) => a - b),
				len = values_sorted.length,
				half = Math.floor(len / 2);
			if (len === 0) { return 0; }
			else if (len % 2) { return values_sorted[half] }
			else { return (values_sorted[half - 1] + values_sorted[half]) / 2; }
		},
		histogram: (values, { histogram_binNumber: bin_number, histogram_logBase: logBase, histogram_logOffset: logOffset, excludeMinMax }) => {
			if (logBase) {
				let transformFunc = d => Math.log(d + logOffset) / Math.log(logBase),
					reverseFunc = d => Math.pow(logBase, d) - logOffset,
					values_log = values.map(transformFunc);
				let min = FUNCTIONS['min'](values_log),
					max = FUNCTIONS['max'](values_log),
					min_origin = FUNCTIONS['min'](values),
					max_origin = FUNCTIONS['max'](values),
					bin_width = (max - min) / bin_number,
					bins = Array.from(new Array(bin_number + 2)).map(() => 0);
				for (let value of values) {
					let value_log = transformFunc(value);
					if (value === max_origin) {
						if (excludeMinMax) {
							bins[bin_number] += 1
						} else {
							bins[bin_number + 1] += 1
						}
					} else if (value === min_origin) {
						if (excludeMinMax) {
							bins[1] += 1;
						} else {
							bins[0] += 1;
						}
					} else {
						bins[Math.floor((value_log - min) / bin_width) + 1] += 1;
					}
				}
				let ret = excludeMinMax ? [] : [{
					name: `${min_origin.toFixed(4)}`,
					range: [min_origin, min_origin],
					count: bins[0],
				}];
				for (let i = 0; i < bin_number; i += 1) {
					let range = [reverseFunc(min + (max - min) * i / bin_number), reverseFunc(min + (max - min) * (i + 1) / bin_number)];
					ret.push({
						name: `${range[0].toFixed(4)}-${range[1].toFixed(4)}`,
						range,
						count: bins[i + 1],
					});
				}
				if (!excludeMinMax) {
					ret.push({
						name: `${max_origin.toFixed(4)}`,
						range: [max_origin, max_origin],
						count: bins[bin_number + 1],
					});
				}

				return ret;
			} else {
				let min = Math.min(...values),
					max = Math.max(...values),
					bin_width = (max - min) / bin_number,
					bins = Array.from(new Array(bin_number)).map(() => 0);
				for (let value of values) {
					bins[value === max ? bin_number - 1 : Math.floor((value - min) / bin_width)] += 1;
				}
				return bins.map((d, i) => {
					let range = [min + (max - min) * i / bin_number, min + (max - min) * (i + 1) / bin_number];
					return {
						name: `${range[0].toFixed(4)}-${range[1].toFixed(4)}`,
						range,
						count: d,
					};
				});
			}
		},
	};

	return function statistics(values, functions, parameters_) {
		let parameters = Object.assign({
			histogram_binNumber: 10,
			histogram_logBase: 0,
			histogram_logOffset: 1,
			excludeMinMax: false,
		}, parameters_);
		if (parameters.excludeMinMax) {
			let min = FUNCTIONS['min'](values, parameters),
				max = FUNCTIONS['max'](values, parameters);
			values = values.filter(d => d != min && d != max);
		}
		return (functions || ['count', 'sum', 'mean', 'min', 'max', 'median'])
			.map(d => ({ name: d, value: FUNCTIONS[d] && FUNCTIONS[d](values, parameters) })) // calculate
			.reduce((acc, cur) => (acc[cur.name] = cur.value, acc), {}); // array to object
	};
})();

export const consoleFuncs = {
	drawHistogram: function (data, parameters_) {
		let parameters = Object.assign({
			maxWidth: 150,
			symbol: '#',
			title: '',
		}, parameters_);

		let max_count = Math.max(...data.map(d => d.count)),
			max_width = parameters.maxWidth,
			max_nameLength = Math.max(...data.map(d => d.name.length)),
			max_barLength = max_width - max_nameLength - max_count.toString().length - 3,
			symbol = parameters.symbol;

		let str = `${parameters.title}\n`;
		for (let { name, count } of data) {
			let bar_length = Math.round(count / max_count * max_barLength);
			str += `${repeatChar(' ', max_nameLength - name.length)}${name} |${repeatChar(symbol, bar_length)} ${count}${repeatChar(' ', max_width - bar_length - count.toString().length)}\n`;
		}
		console.log(str);
	},
}

export function repeatChar(char, n) {
	if (isNaN(n)) { return ''; }
	return Array.from(new Array(n)).map(() => char).join('');
}

export const fetchFuncs = {

	fetchJSON: function (path, success, parameters_) {
		let parameters = Object.assign({
			method: parameters_.data != undefined ? 'post' : 'get',
			data: {},
		}, parameters_);

		let url = `//localhost:3005/${path}`;
		return $.ajax({
			method: parameters.method,
			type: 'json',
			url,
			data: parameters.data,
			success: success,
		});
	},

	fetchBinary: function (path, success, parameters_) {
		let parameters = Object.assign({
			method: parameters_.data != undefined ? 'post' : 'get',
			data: {},
		}, parameters_);

		let url = `//localhost:3005/${path}`;
		return $.ajax({
			method: parameters.method,
			type: 'json',
			dataType: 'binary',
			responseType: 'arraybuffer',
			url,
			data: parameters.data,
			success: success,
		});
	},
};

// add binary ajax for jquery
$.ajaxTransport("+binary", function (options, originalOptions, jqXHR) {
	// check for conditions and support for blob / arraybuffer response type
	if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob))))) {
		return {
			// create new XMLHttpRequest
			send: function (headers, callback) {
				// setup all variables
				var xhr = new XMLHttpRequest(),
					url = options.url,
					type = options.type,
					async = options.async || true,
					// blob or arraybuffer. Default is blob
					dataType = options.responseType || "blob",
					data = options.data || null,
					username = options.username || null,
					password = options.password || null;

				xhr.addEventListener('load', function () {
					var data = {};
					data[options.dataType] = xhr.response;
					// make callback and send data
					callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
				});

				xhr.open(type, url, async, username, password);

				// setup custom headers
				for (var i in headers) {
					xhr.setRequestHeader(i, headers[i]);
				}

				xhr.responseType = dataType;
				xhr.send(data);
			},
			abort: function () {
				jqXHR.abort();
			}
		};
	}
});

export const utility = {
	generateUUID,
	statistics,
	consoleFuncs,
	repeatChar,
	fetchFuncs,
};
export default utility;
