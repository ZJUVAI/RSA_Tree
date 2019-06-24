import RTree from '../rtree/rtree';
import SimpleSAT from '../sat/simplesat';

export default function deserialize(arrayBuffer, parameters) {

	let typeID = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer.slice(0, 4))),
		arrayBuffer_ = arrayBuffer.slice(4);

	switch (typeID) {
		case 'RTRE':
			return deserialize_RTree(arrayBuffer_, parameters);
		case 'SATA':
			return deserialize_SAT(arrayBuffer_, parameters);
		case 'ORID': case 'DATA':
			return deserialize_pointData(arrayBuffer_, parameters);
		default:
			console.warn('deserialize', `type not supported "${typeID}"`);
	}
}

function deserialize_RTree(arrayBuffer, parameters) {
	// let intArray = new Uint32Array(arrayBuffer),
	// 	floatArray = new Float32Array(arrayBuffer);

	// let dim = intArray[idx++];
	// nodeNum = intArray[idx++],
	// sat_binNum = Array.from(intArray.slice(idx, idx += dim));
	// let sat = new SimpleSAT({ dim, sat_binNum, nodeNum });
	// sat.deserialize(arrayBuffer, idx);

	let int8Array = new Uint8Array(arrayBuffer),
		useHash = int8Array.slice(0, 1) > 0,
		useDifference = int8Array.slice(1, 2) > 0,
		useLayer = int8Array.slice(2, 3) > 0,
		layerMul = new Uint32Array(int8Array.slice(3, 7))[0],
		arrayBuffer_ = arrayBuffer.slice(7);

	let rtree = new RTree({ dim: parameters.dim });
	// rtree.deserialize(arrayBuffer, idx + nodeNum * sat_binNum.reduce((a, b) => a * b, 1));
	rtree.deserialize(arrayBuffer_, 0, parameters);

	return rtree;
}

function deserialize_SAT(arrayBuffer, parameters) {
	let intArray = new Uint32Array(arrayBuffer),
		// 	floatArray = new Float32Array(arrayBuffer);
		satNum = intArray[0];

	let sat = new SimpleSAT({ dim: parameters.dim, nodeNum: satNum });

	// sat.deserialize(arrayBuffer, 1, parameters);

	return sat;
}

function deserialize_pointData(arrayBuffer, parameters) {
	let intArray = new Uint32Array(arrayBuffer),
		floatArray = new Float32Array(arrayBuffer),
		idx = 0;

	let count = intArray[idx++],
		dim = intArray[idx++],
		points = [];
	for (let i = 0; i < count; i += 1) {
		points.push(Array.from(floatArray.slice(idx, idx += dim)));
	}
	return points;
}