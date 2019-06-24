import ndarray from 'ndarray';
import pool from 'typedarray-pool';

export default function LSH(d, bucketSize = 1000, bucketNum = 97, sampleNum = 5, hashFuncNum = 2, round = 11) {
	Object.assign(this, { d, bucketSize, bucketNum, sampleNum, hashFuncNum, round });
	let nd = [d, bucketNum, sampleNum, bucketSize],
		size = nd.reduce((s, x) => s * x, 1),
		tables = this.tables = ndarray(pool.malloc(size, "uint32"), nd);

	console.log(size, bucketSize * sampleNum * hashFuncNum);

	for (let i = 0; i < size; i += 1) {
		tables.data[i] = -1;
	}

	this.nullValue = tables.get(0, 0, 0, 0);

	this.functions = [];
	this.itemNum = null;

	this.sampleStep = 1 / (sampleNum - 1);
}

LSH.prototype = {
	generate: function (ranges, boundingbox) {
		let itemNum = this.itemNum = ranges.length,
			tables = this.tables,
			tablesData = tables.data,
			d = this.d,
			hashFuncNum = this.hashFuncNum,
			bucketNum = this.bucketNum,
			sampleNum = this.sampleNum,
			bucketSize = this.bucketSize,
			round = this.round;

		let nd = [d, bucketNum, sampleNum],
			size = nd.reduce((s, x) => s * x, 1),
			tableIdx_pool = pool.malloc(size, "uint32"),
			tableIdx = ndarray(tableIdx_pool, nd);

		let functions = this.functions = [];
		for (let i = 0; i < d; i += 1) {
			let functions_d = [],
				bucketWidth = (boundingbox[i][1] - boundingbox[i][0]) / (bucketNum + 1) * round,
				bucketOffset = Math.random() * bucketWidth,
				bucketStep = bucketWidth / hashFuncNum,
				bucketWidth_re = 1 / bucketWidth;

			for (let j = 0; j < hashFuncNum; j += 1) {
				let offset = bucketOffset + bucketStep * j;
				if (offset > bucketWidth) { offset -= bucketWidth; }
				offset -= boundingbox[i][0];
				functions_d.push((value) => Math.floor((value + offset) * bucketWidth_re) % bucketNum);
			}
			this.functions.push(functions_d);
		}

		for (let i = 0; i < ranges.length; i += 1) {
			let range = ranges[i];
			for (let j = 0; j < d; j += 1) {
				let interval = range[j];
				for (let k = 0; k < sampleNum; k += 1) {
					let value = interval[0] + (k / (sampleNum - 1)) * (interval[1] - interval[0]);
					for (let l = 0; l < hashFuncNum; l += 1) {
						let bucketIdx = functions[j][l](value),
							curIdx = tableIdx.get(j, bucketIdx, k);
						if (curIdx >= bucketSize) {
							if (Math.random() > 0.5) {
								tables.set(j, bucketIdx, k, Math.floor(Math.random() * bucketSize), i);
							}
						} else {
							tables.set(j, bucketIdx, k, curIdx, i);
							tableIdx.set(j, bucketIdx, k, curIdx + 1)
						}
					}
				}
			}
		}

		console.log(Math.max(...tableIdx.data), tableIdx.data.reduce((a, b) => a + b, 0) / tableIdx.data.length);

		pool.free(tableIdx_pool);
	},

	consoleRangeBuckets(idx) {
		let d = this.d,
			hashFuncNum = this.hashFuncNum,
			bucketNum = this.bucketNum,
			sampleNum = this.sampleNum,
			bucketSize = this.bucketSize,
			functions = this.functions;
		for (let i = 0; i < d; ++i) // d
			for (let k = 0; k < sampleNum; ++k) { // sample
				let buckets = [];
				for (let j = 0; j < bucketNum; ++j) // bucket
					for (let l = 0; l < bucketSize; ++l) // position
						if (this.tables.get(i, j, k, l) === idx)
							buckets.push(j);
				console.log(`d_${i}: ${buckets.join(',')} (sample: ${k})`);
			}
	},

	consolePointBuckets(point) {
		let d = this.d,
			hashFuncNum = this.hashFuncNum,
			bucketNum = this.bucketNum,
			sampleNum = this.sampleNum,
			bucketSize = this.bucketSize,
			functions = this.functions;
		for (let j = 0; j < d; j += 1) {
			let value = point[j], buckets = [];
			for (let l = 0; l < hashFuncNum; l += 1) {
				buckets.push(functions[j][l](value));
			}
			console.log(`d_${j}: ${buckets.join(',')}`);
		}
	},

	testPoint: function (point) {
		let itemNum = this.itemNum,
			tables = this.tables,
			tablesData = tables.data,
			d = this.d,
			hashFuncNum = this.hashFuncNum,
			bucketNum = this.bucketNum,
			sampleNum = this.sampleNum,
			bucketSize = this.bucketSize,
			functions = this.functions;
		// for (let i = 0; i < points.length; i += 1) {
		// 	let point = points[i];
		let set = null, candidate = new Set();
		for (let j = 0; j < d; j += 1) {
			let value = point[j];
			for (let l = 0; l < hashFuncNum; l += 1) {
				let bucketIdx = functions[j][l](value),
					offset = tables.index(j, bucketIdx, 0, 0);
				for (let k = 0; k < sampleNum * bucketSize; k += 1) {
					let temp = tablesData[offset + k];
					if (temp < itemNum && (set == null || set.has(temp))) {
						candidate.add(temp);
					}
				}
			}
			set = candidate; candidate = new Set();
		}
		// }
		return [...set];
	},

	testRange: function (range) {
		let itemNum = this.itemNum,
			tables = this.tables,
			tablesData = tables.data,
			d = this.d,
			hashFuncNum = this.hashFuncNum,
			bucketNum = this.bucketNum,
			sampleNum = this.sampleNum,
			bucketSize = this.bucketSize,
			functions = this.functions,
			sampleStep = this.sampleStep,
			nullValue = this.nullValue;
		// for (let i = 0; i < ranges.length; i += 1) {
		// 	let range = ranges[i];

		let i, j, k, l, m;
		let interval, step, value, bucketIdx, offset, temp;
		let set = null, candidate = null;

		j = d;
		while (j--) {
			set = candidate; candidate = new Set();
			interval = range[j];
			step = (interval[1] - interval[0]) * sampleStep;
			value = interval[1];
			k = sampleNum;
			while (k--) {
				l = hashFuncNum;
				while (l--) {
					bucketIdx = functions[j][l](value),
						offset = tables.index(j, bucketIdx, k, 0),
						m = offset + bucketSize;
					if (set == null) {
						for (; offset < m; offset += 1) {
							temp = tablesData[offset];
							if (temp === nullValue) { break; }
							candidate.add(temp);
						}
					} else {
						for (; offset < m; offset += 1) {
							temp = tablesData[offset];
							if (temp === nullValue) { break; }
							if (set.has(temp)) {
								candidate.add(temp);
							}
						}
					}
				}
				value -= step;
			}
		}
		// }
		// set.delete(this.nullValue);
		// return [...set];
		return set;
	},
}