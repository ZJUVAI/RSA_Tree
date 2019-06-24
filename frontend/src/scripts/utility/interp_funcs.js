var ii;
var x0i, x0t, x1i, x1t, x2i, x2t, x3i, x3t, x4i, x4t;
var v00000, v00001, v00010, v00011, v00100, v00101, v00110, v00111, v01000, v01001, v01010, v01011, v01100, v01101, v01110, v01111,
	v10000, v10001, v10010, v10011, v10100, v10101, v10110, v10111, v11000, v11001, v11010, v11011, v11100, v11101, v11110, v11111;
var temp0, temp1, temp2, temp3, temp4;
var data, offset;
var tables, dim, binNums, histogramSize;

global.interp = 0; // 55632 => 3948
global.interp_all = 0;

var interp_funcs = {
	// 2: (nodeIdx, x0i, x0t, x1i, x1t) => {
	2: (table, x0i, x0t, x1i, x1t) => {
		global.interp_all += 1;
		if (x0t === 0 && x1t === 0) {
			// return tables.get(nodeIdx, x0i, x1i);
			return table.get(x0i, x1i);
		}
		global.interp += 1;
		// offset = tables.index(nodeIdx, x0i, x1i);
		// data = tables.data;
		offset = table.index(x0i, x1i);
		data = table.data;
		// temp0 = 1
		// temp1 = temp0 * (binNum + 2)
		v00000 = offset;
		v00001 = v00000 + temp0;
		v00010 = v00000 + temp1;
		v00011 = v00010 + temp0;
		return (1 - x0t) * (1 - x1t) * data[v00000]
			+ (1 - x0t) * (x1t) * data[v00001]
			+ (x0t) * (1 - x1t) * data[v00010]
			+ (x0t) * (x1t) * data[v00011];
	},
	3: (nodeIdx, x0i, x0t, x1i, x1t, x2i, x2t) => {
		offset = tables.index(nodeIdx, x0i, x1i, x2i);
		data = tables.data;
		// temp0 = 1
		// temp1 = temp0 * (binNum + 2)
		// temp2 = temp1 * (binNum + 2)
		v00000 = offset;
		v00001 = offset + temp0;
		v00010 = offset + temp1;
		v00011 = v00010 + temp0;
		v00100 = offset + temp2;
		v00101 = v00100 + temp0;
		v00110 = v00100 + temp1;
		v00111 = v00110 + temp0;
		return value + (1 - x0t) * (1 - x1t) * (1 - x2t) * data[v00000]
			+ (1 - x0t) * (1 - x1t) * (x2t) * data[v00001]
			+ (1 - x0t) * (x1t) * (1 - x2t) * data[v00010]
			+ (1 - x0t) * (x1t) * (x2t) * data[v00011]
			+ (x0t) * (1 - x1t) * (1 - x2t) * data[v00100]
			+ (x0t) * (1 - x1t) * (x2t) * data[v00101]
			+ (x0t) * (x1t) * (1 - x2t) * data[v00110]
			+ (x0t) * (x1t) * (x2t) * data[v00111]
			;
	},
	4: (table, x0i, x0t, x1i, x1t, x2i, x2t, x3i, x3t) => {
		offset = table.index(x0i, x1i, x2i, x3i);
		data = table.data;
		v00000 = offset;
		v00001 = v00000 + temp0;
		v00010 = v00000 + temp1;
		v00011 = v00010 + temp0;
		v00100 = v00000 + temp2;
		v00101 = v00100 + temp0;
		v00110 = v00100 + temp1;
		v00111 = v00110 + temp0;
		v01000 = v00000 + temp3;
		v01001 = v01000 + temp0;
		v01010 = v01000 + temp1;
		v01011 = v01010 + temp0;
		v01100 = v01000 + temp2;
		v01101 = v01100 + temp0;
		v01110 = v01100 + temp1;
		v01111 = v01110 + temp0;
		return (1 - x0t) * (1 - x1t) * (1 - x2t) * (1 - x3t) * data[v00000]
			+ (1 - x0t) * (1 - x1t) * (1 - x2t) * (x3t) * data[v00001]
			+ (1 - x0t) * (1 - x1t) * (x2t) * (1 - x3t) * data[v00010]
			+ (1 - x0t) * (1 - x1t) * (x2t) * (x3t) * data[v00011]
			+ (1 - x0t) * (x1t) * (1 - x2t) * (1 - x3t) * data[v00100]
			+ (1 - x0t) * (x1t) * (1 - x2t) * (x3t) * data[v00101]
			+ (1 - x0t) * (x1t) * (x2t) * (1 - x3t) * data[v00110]
			+ (1 - x0t) * (x1t) * (x2t) * (x3t) * data[v00111]
			+ (x0t) * (1 - x1t) * (1 - x2t) * (1 - x3t) * data[v01000]
			+ (x0t) * (1 - x1t) * (1 - x2t) * (x3t) * data[v01001]
			+ (x0t) * (1 - x1t) * (x2t) * (1 - x3t) * data[v01010]
			+ (x0t) * (1 - x1t) * (x2t) * (x3t) * data[v01011]
			+ (x0t) * (x1t) * (1 - x2t) * (1 - x3t) * data[v01100]
			+ (x0t) * (x1t) * (1 - x2t) * (x3t) * data[v01101]
			+ (x0t) * (x1t) * (x2t) * (1 - x3t) * data[v01110]
			+ (x0t) * (x1t) * (x2t) * (x3t) * data[v01111];
	},
};

var MAX_D = 5;
function interp_func(d) {
	var zeros = Array.from(Array(MAX_D), d => 0).join('');

	let str = '';
	for (let i = 0; i < d; ++i) {
		str += `x${i}i = Math.floor(x[${i}]); x${i}t = x[${i}] - x${i}i;\n`
	}
	str += `offset = tables.index(nodeIdx, ${Array.from(Array(d), (_, i) => `x${i}i`).join(', ')});\n`;
	str += `data = tables.data;\n`;
	// let tempStr = `1`, tempStr_step = ` * (binNum + 2)`;
	// for (let i = 0; i < d; ++i) {
	// 	str += `temp${i} = ${tempStr};\n`;
	// 	tempStr = `temp${i}` + tempStr_step;
	// }
	let vs = {};
	vs[`v${zeros.slice(-MAX_D)}`] = `offset`;
	for (let i = 1; i < 1 << d; ++i) {
		let pD = (zeros + (i).toString(2)).slice(-MAX_D).split('').map(d => parseInt(d, 2)),
			pd = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
		let j = pd.length - 1;
		while (pd[j] != 1) { --j; }
		vs[`v${pD.join('')}`] = `v${pD.slice(0, j + MAX_D - d).concat(Array.from(Array(d - j)).map(() => 0)).join('')} + temp${d - j - 1}`;
	}

	str += Object.keys(vs).map(d => `${d} = ${vs[d]};\n`).join('');

	str += `return `;
	for (let i = 0; i < 1 << d; ++i) {
		let pD = (zeros + (i).toString(2)).slice(-MAX_D).split('').map(d => parseInt(d, 2)),
			pd = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
		if (i != 0) { str += '\t+ '; }
		str += `${pd.map((d, i) => d ? `(x${i}t)` : `(1 - x${i}t)`).join(' * ')} * data[v${pD.join('')}]`
		if (i < (1 << d) - 1) { str += '\n' } else { str += ';'; }
	}

	return str;
}

module.exports = {
	interp_func,
	interp_funcs,
	// interp_funcs_histogram,
	set: function (tables_, dim_, binNums_, histogramSize_) {
		dim = dim_;
		tables = tables_;
		binNums = binNums_;
		histogramSize = histogramSize_;


		temp0 = 1;
		// temp1 = temp0 * (binNum + 2);
		// temp2 = temp1 * (binNum + 2);
		// temp3 = temp2 * (binNum + 2);
		// temp4 = temp3 * (binNum + 2);
		temp1 = temp0 * (binNums[dim - 1] + 2);
		temp2 = temp1 * (binNums[dim - 2] + 2);
		temp3 = temp2 * (binNums[dim - 3] + 2);
		temp4 = temp3 * (binNums[dim - 4] + 2);
	}
}