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
	5: (table, x0i, x0t, x1i, x1t, x2i, x2t, x3i, x3t, x4i, x4t) => {
		offset = table.index(x0i, x1i, x2i, x3i, x4i);
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
		v10000 = v00000 + temp4;
		v10001 = v10000 + temp0;
		v10010 = v10000 + temp1;
		v10011 = v10010 + temp0;
		v10100 = v10000 + temp2;
		v10101 = v10100 + temp0;
		v10110 = v10100 + temp1;
		v10111 = v10110 + temp0;
		v11000 = v10000 + temp3;
		v11001 = v11000 + temp0;
		v11010 = v11000 + temp1;
		v11011 = v11010 + temp0;
		v11100 = v11000 + temp2;
		v11101 = v11100 + temp0;
		v11110 = v11100 + temp1;
		v11111 = v11110 + temp0;
		return (1 - x0t) * (1 - x1t) * (1 - x2t) * (1 - x3t) * (1 - x4t) * data[v00000]
			+ (1 - x0t) * (1 - x1t) * (1 - x2t) * (1 - x3t) * (x4t) * data[v00001]
			+ (1 - x0t) * (1 - x1t) * (1 - x2t) * (x3t) * (1 - x4t) * data[v00010]
			+ (1 - x0t) * (1 - x1t) * (1 - x2t) * (x3t) * (x4t) * data[v00011]
			+ (1 - x0t) * (1 - x1t) * (x2t) * (1 - x3t) * (1 - x4t) * data[v00100]
			+ (1 - x0t) * (1 - x1t) * (x2t) * (1 - x3t) * (x4t) * data[v00101]
			+ (1 - x0t) * (1 - x1t) * (x2t) * (x3t) * (1 - x4t) * data[v00110]
			+ (1 - x0t) * (1 - x1t) * (x2t) * (x3t) * (x4t) * data[v00111]
			+ (1 - x0t) * (x1t) * (1 - x2t) * (1 - x3t) * (1 - x4t) * data[v01000]
			+ (1 - x0t) * (x1t) * (1 - x2t) * (1 - x3t) * (x4t) * data[v01001]
			+ (1 - x0t) * (x1t) * (1 - x2t) * (x3t) * (1 - x4t) * data[v01010]
			+ (1 - x0t) * (x1t) * (1 - x2t) * (x3t) * (x4t) * data[v01011]
			+ (1 - x0t) * (x1t) * (x2t) * (1 - x3t) * (1 - x4t) * data[v01100]
			+ (1 - x0t) * (x1t) * (x2t) * (1 - x3t) * (x4t) * data[v01101]
			+ (1 - x0t) * (x1t) * (x2t) * (x3t) * (1 - x4t) * data[v01110]
			+ (1 - x0t) * (x1t) * (x2t) * (x3t) * (x4t) * data[v01111]
			+ (x0t) * (1 - x1t) * (1 - x2t) * (1 - x3t) * (1 - x4t) * data[v10000]
			+ (x0t) * (1 - x1t) * (1 - x2t) * (1 - x3t) * (x4t) * data[v10001]
			+ (x0t) * (1 - x1t) * (1 - x2t) * (x3t) * (1 - x4t) * data[v10010]
			+ (x0t) * (1 - x1t) * (1 - x2t) * (x3t) * (x4t) * data[v10011]
			+ (x0t) * (1 - x1t) * (x2t) * (1 - x3t) * (1 - x4t) * data[v10100]
			+ (x0t) * (1 - x1t) * (x2t) * (1 - x3t) * (x4t) * data[v10101]
			+ (x0t) * (1 - x1t) * (x2t) * (x3t) * (1 - x4t) * data[v10110]
			+ (x0t) * (1 - x1t) * (x2t) * (x3t) * (x4t) * data[v10111]
			+ (x0t) * (x1t) * (1 - x2t) * (1 - x3t) * (1 - x4t) * data[v11000]
			+ (x0t) * (x1t) * (1 - x2t) * (1 - x3t) * (x4t) * data[v11001]
			+ (x0t) * (x1t) * (1 - x2t) * (x3t) * (1 - x4t) * data[v11010]
			+ (x0t) * (x1t) * (1 - x2t) * (x3t) * (x4t) * data[v11011]
			+ (x0t) * (x1t) * (x2t) * (1 - x3t) * (1 - x4t) * data[v11100]
			+ (x0t) * (x1t) * (x2t) * (1 - x3t) * (x4t) * data[v11101]
			+ (x0t) * (x1t) * (x2t) * (x3t) * (1 - x4t) * data[v11110]
			+ (x0t) * (x1t) * (x2t) * (x3t) * (x4t) * data[v11111];
	}
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

function sat_calculate(d) {
	let str = '';
	str += `
let interp = interp_funcs.interp_funcs[${d}];
k = queries.length;
while (k--) {
	idx = queries[k].idx;
	rect = queries[k].rect;
	table = tables[idx];
	// domain = tablesInfo[idx].domain;
	domain = table.domain;
	tableData = table.data;
	binNums = table.binNums;
	binWidths = table.binWidths;
	interp_funcs.set(tables, dim, binNums, ${d});

	xRange = [${Array.from(Array(d)).map((_, i) => `
			(Math.max(domain[${i}][0], rect[${i}][0]) - domain[${i}][0]) / binWidths[${i}],
			(Math.min(domain[${i}][1], rect[${i}][1]) - domain[${i}][0]) / binWidths[${i}],`).join('\n')}
	];

	xi = [${Array.from(Array(d * 2)).map((_, i) => `Math.floor(xRange[${i}])`).join(', ')}];
	xt = [${Array.from(Array(d * 2)).map((_, i) => `xRange[${i}] - xi[${i}]`).join(', ')}];
	xi_ = xi.map((d, i) => xt[i] === 0 ? d : d + 1);

	let upper =${Array.from(Array(2 ** d)).map((_, i) => {
			let zeros = Array.from(Array(d)).map(() => 0),
				pow2 = zeros.map((_, ii) => 1 << (d - ii - 1)),
				p = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
			p = p.map((_, ii) => Math.sign(i & pow2[ii]));
			return `
		${(d - p.reduce((a, b) => a + b, 0)) % 2 === 0 ? '+' : '-'} tableData.get(${Array.from(Array(d)).map((_, ii) => `xi${p[ii]?'_':''}[${ii * 2 + p[ii]}]`).join(', ')})`
		}).join('')};

	let lower = ${Array.from(Array(d)).map((_, i) => `xi_[${i * 2}] >= xi[${i * 2 + 1}]`).join(' || ')}
	? 0 :${Array.from(Array(2 ** d)).map((_, i) => {
			let zeros = Array.from(Array(d)).map(() => 0),
				pow2 = zeros.map((_, ii) => 1 << (d - ii - 1)),
				p = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
			p = p.map((_, ii) => Math.sign(i & pow2[ii]));
			return `
		${(d - p.reduce((a, b) => a + b, 0)) % 2 === 0 ? '+' : '-'} tableData.get(${Array.from(Array(d)).map((_, ii) => `xi${p[ii]?'':'_'}[${ii * 2 + p[ii]}]`).join(', ')})`
		}).join('')};

	let value =${Array.from(Array(2 ** d)).map((_, i) => {
			let zeros = Array.from(Array(d)).map(() => 0),
				pow2 = zeros.map((_, ii) => 1 << (d - ii - 1)),
				p = (zeros + (i).toString(2)).slice(-d).split('').map(d => parseInt(d, 2));
			p = p.map((_, ii) => Math.sign(i & pow2[ii]));
			return `
		${(d - p.reduce((a, b) => a + b, 0)) % 2 === 0 ? '+' : '-'} interp(tableData, ${Array.from(Array(d)).map((_, ii) => `xi[${ii * 2 + p[ii]}], xt[${ii * 2 + p[ii]}]`).join(', ')})`
		}).join('')};

	value = Math.round(value);

	uncertainty += upper - lower;// / value;
	uncertaintyU += upper - value;
	uncertaintyD += value - lower;
	retValue += value;
}
	`
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


		// temp0 = 1;
		// temp1 = temp0 * (binNum + 2);
		// temp2 = temp1 * (binNum + 2);
		// temp3 = temp2 * (binNum + 2);
		// temp4 = temp3 * (binNum + 2);
		// temp0 = 1;
		// temp1 = temp0 * binNums[dim - 1];
		// temp2 = temp1 * binNums[dim - 2];
		// temp3 = temp2 * binNums[dim - 3];
		// temp4 = temp3 * binNums[dim - 4];
		temp0 = 1;
		temp1 = temp0 * (binNums[dim - 1] + 2);
		temp2 = temp1 * (binNums[dim - 2] + 2);
		temp3 = temp2 * (binNums[dim - 3] + 2);
		temp4 = temp3 * (binNums[dim - 4] + 2);

	}
}