/**
 * 
 * @param {*} operatorType 
 * @param {*} dataObj 数据格式 [[x,y,z],[],[],...]
 * @param {*} binSize 格子的数量 [xCount, yCount]
 * @param {*} domain 最初始的最大最小值 [[x1,x2],[y1,y2],[z1,z2]]
 */
const getAccurateResult = (operatorType, dataObj, binNum, domain) => {
	let result;

	let width = domain[0][1] - domain[0][0],
		height = domain[1][1] - domain[1][0];
	let xBinSize = width / binNum,
		yBinSize = height / binNum;
	// let xCount = Math.ceil(width / xBinSize),
	// 	yCount = Math.ceil(height / yBinSize);
	let xCount = binNum,
		yCount = binNum;
	let countArray = [];
	switch (operatorType) {
		case 'count':
			// Init
			initArray(countArray, binNum, binNum);
			// 先计算每一个格子的 count
			for (let i = 0; i < dataObj.length; i += 1) {
				let x0 = dataObj[i][0],
					y0 = dataObj[i][1];
				let x = computePosition(x0, domain[0], xCount);
				let y = computePosition(domain[1][1] - domain[1][0] - y0, domain[1], yCount);
				countArray[y][x] += 1;
			}
			result = countArray;
			break;
		case 'min':
			let minArray = initArray(minArray);
			for (let i = 0; i < dataObj.length; i += 1) {
				let x0 = dataObj[i][0],
					y0 = dataObj[i][1];
				let x = computePosition(x0, domain[0], xCount);
				let y = computePosition(y0, domain[1], yCount);
				if (i === 0) minArray[y][x] = dataObj[i][2];
				else {
					if (dataObj[i][2] < minArray[y][x]) minArray[y][x] = dataObj[i][2];
				}
			}
			result = minArray;
			break;
		case 'max':
			let maxArray = [];
			initArray(maxArray);
			for (let i = 0; i < dataObj.length; i += 1) {
				let x0 = dataObj[i][0],
					y0 = dataObj[i][1];
				let x = computePosition(x0, domain[0], xCount);
				let y = computePosition(y0, domain[1], yCount);
				if (i === 0) maxArray[y][x] = dataObj[i][2];
				else {
					if (dataObj[i][2] > maxArray[y][x]) maxArray[y][x] = dataObj[i][2];
				}
			}
			result = maxArray;
			break;
		case 'average':
			let sumArray = []; // 每个格子的和，用于求均值
			initArray(sumArray);
			initArray(countArray);
			for (let i = 0; i < dataObj.length; i += 1) {
				let x0 = dataObj[i][0],
					y0 = dataObj[i][1];
				let x = computePosition(x0, domain[0], xCount);
				let y = computePosition(y0, domain[1], yCount);
				countArray[y][x] += 1;
				sumArray += dataObj[i][2];
			}
			for (let i = 0; i < countArray.length; i += 1) {
				for (let j = 0; j < countArray[0].length; j += 1) {
					sumArray[i][j] = sumArray[i][j] / countArray[i][j]; // sumArray重复利用，用来存求出的均值
				}
			}
			result = sumArray;
			break;
		default:
			break;
	}

	return result;
};

const computePosition = (x, domain, count) => {
	let result = Math.floor((x - domain[0]) / (domain[1] - domain[0]) * count);
	if (result >= count) {
		result = count - 1;
	}
	return result;
};

const initArray = (array, xCount, yCount) => {
	let arrayItem = [];
	for (let i = 0; i < yCount; i += 1) {
		if (arrayItem.length !== 0) arrayItem = [];
		for (let j = 0; j < xCount; j += 1) {
			arrayItem.push(0);
		}
		array.push(arrayItem);
	}
};

export default {
	getAccurateResult,
};