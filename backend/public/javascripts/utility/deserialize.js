let RTree = require('../rtree/rtree');
let SimpleSAT = require('../sat/simplesat');

function deserialize(arrayBuffer, parameters) {
	let typeID = String.fromCharCode.apply(null, Array.from(Array(4)).map((d, i) => arrayBuffer.readUInt8(i)));

	switch (typeID) {
		case 'RTRE':
			return deserialize_RTree(arrayBuffer, 4, parameters);
		case 'SATA':
			return deserialize_SAT(arrayBuffer, 4, parameters);
		case 'ORID': case 'DATA':
			return deserialize_pointData(arrayBuffer, 4, parameters);
		default:
			console.warn('deserialize', `type not supported "${typeID}"`);
	}
}

function deserialize_RTree(arrayBuffer, offset, parameters) {
	// let intArray = new Uint32Array(arrayBuffer),
	// 	floatArray = new Float32Array(arrayBuffer);

	// let dim = intArray[idx++];
	// nodeNum = intArray[idx++],
	// sat_binNum = Array.from(intArray.slice(idx, idx += dim));
	// let sat = new SimpleSAT({ dim, sat_binNum, nodeNum });
	// sat.deserialize(arrayBuffer, idx);

	// let int8Array = new Uint8Array(arrayBuffer),
	// 	useHash = int8Array.slice(0, 1) > 0,
	// 	useDifference = int8Array.slice(1, 2) > 0,
	// 	useLayer = int8Array.slice(2, 3) > 0,
	// 	layerMul = new Uint32Array(int8Array.slice(3, 7))[0],
	// 	arrayBuffer_ = arrayBuffer.slice(7);

	let useHash = arrayBuffer.readUInt8(offset) > 0,
		useDifference = arrayBuffer.readUInt8(offset + 1) > 0,
		useLayer = arrayBuffer.readUInt8(offset + 2) > 0,
		layerMul = arrayBuffer.readUInt32LE(offset + 3),
		useForSplit = arrayBuffer.readUInt32LE(offset + 7);
	offset += 11;

	let rtree = new RTree({ dim: parameters.dim });
	// rtree.deserialize(arrayBuffer, idx + nodeNum * sat_binNum.reduce((a, b) => a * b, 1));
	rtree.deserialize(arrayBuffer, offset, parameters);

	return rtree;
}

function deserialize_SAT(arrayBuffer, offset, parameters) {
	let satNum = arrayBuffer.readUInt32LE(offset);
	let sat = new SimpleSAT({ dim: parameters.dim, nodeNum: satNum });
	return sat;
}

function deserialize_pointData(arrayBuffer, offset, parameters) {

	let count = arrayBuffer.readUInt32LE(offset),
		dim = arrayBuffer.readUInt32LE(offset + 4),
		x = arrayBuffer.readUInt32LE(offset + 8);
	offset += 12;

	let points = [];
	try {
		for (let i = 0; i < count; i += 1) {
			let point = [];
			for (let j = 0; j < dim; j += 1) {
				point.push(arrayBuffer.readFloatLE(offset));
				offset += 4;
			}
			points.push(point);
			offset += 4;
		}
	} catch (error) {
		console.log('deserialize_pointData', 'count error', `actual count: ${points.length}`);
	}
	return points;
}

module.exports = deserialize;