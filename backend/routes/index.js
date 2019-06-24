"use strict";

let express = require('express');
let fs = require('fs');
let serialize = require('serialize-javascript');
let d3 = require('d3');
let conn = require('./mysqlConfig');
let sscanf = require('sscanf');
const waitUntil = require('async-wait-until');
const { performance } = require('perf_hooks');
let { statistics, consoleFuncs } = require('../public/javascripts/utility/utility');
let Timer = require('../public/javascripts/test/timer');

let router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
	res.render('index', { title: 'Express' });
});

/* ==== OLD - fetch files ==== */

router.post('/fetchParameter', (req, res) => {
	let name = req.body.name,
		extra = req.body.extra || '';

	let filename = `${name}Parameter${extra}.json`, path = './data/' + filename;
	console.log('fetchParameter', path);

	fs.readFile(path, 'utf8', function (err, data) {
		if (err) {
			res.status(404).send('File not found.');
			throw err;
		}

		let parameter = JSON.parse(data);
		console.log(parameter);

		let result = {
			dim: parameter.dimCoordinate, resultDim: parameter.dimInnNum,
			dataDomain: parameter.originRange,
			scaleDomain: parameter.converseRange,
		}

		res.setHeader('Access-Control-Allow-Origin', '*');
		res.json(result);
	});
});

/**
 * 取出预处理结果，Rtree，SAT等
 */
router.post('/fetchPreprocess', (req, res) => {
	let name = req.body.name,
		type = req.body.type,
		extra = req.body.extra || '';

	let filename;
	switch (type) {
		case 'rtree':
			filename = `${name}Rtree${extra}`; break;
		case 'sat':
			filename = `${name}SAT${extra}`; break;
		default:
			console.log('fetchPreprocess', 'query type not supported', type);
	}

	// filename = `${name}Struct_new_64x64`, path = './data/' + filename;
	let path = './data/' + filename;
	console.log('fetchPreprocess', path);
	let data = fs.readFileSync(path);
	console.log(data.slice(0, 48));

	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/octet-stream',
		'Content-disposition': 'attachment;filename=' + filename,
		'Content-Length': data.length
	});
	res.end(new Buffer(data), 'binary');
});

/**
 * 取出原始数据（二进制）
 */
router.post('/fetchOrigin', (req, res) => {
	let name = req.body.name,
		extra = req.body.extra || '';

	let filename = `${name}Data${extra}`, path = './data/' + filename;
	let data = fs.readFileSync(path);
	console.log(data.slice(0, 48));

	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/octet-stream',
		'Content-disposition': 'attachment;filename=' + filename,
		'Content-Length': data.length
	});
	res.end(new Buffer(data), 'binary');
});

/**
 * 取出taxi-traj的数据，处理时间维度
 */
router.get('/getTaxiTraj_test', (req, res) => {
	let sql = 'SELECT `latitude`,`longitude`,`time` FROM taxi_traj WHERE `latitude`>27.95 AND `latitude`<28.05 AND `longitude`>120.59 AND `longitude`<120.75 LIMIT 10000';
	conn.query(sql, (err, data, fields) => {
		let result = [];
		for (let row of data) {
			let { date, hour, dayOfWeek } = parseDataTime(row.time)
			result.push({
				date, hour, dayOfWeek,
				lat: row.latitude,
				lon: row.longitude,
			});
		}
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.json(result);
	});
});

/**
 * 取出brightkite的数据，处理时间维度
 */
router.get('/getBrightkite_test', (req, res) => {
	let sql = 'SELECT `latitude`,`longitude`,`check_in_time` FROM brightkite LIMIT 10000';
	conn.query(sql, (err, data, fields) => {
		let result = [];
		for (let row of data) {
			let { date, hour, dayOfWeek } = parseDataTime(row.check_in_time)
			result.push({
				date, hour, dayOfWeek,
				lat: row.latitude,
				lon: row.longitude,
			});
		}
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.json(result);
	});
});

/* ==== NEW - construct RSATree at backend ==== */
let RSATree = require('../public/javascripts/rsatree');
// let generateUUID = require('../public/javascripts/utility/utility').generateUUID;

let rsatreePool = new Map();
// let rsatree;

router.post('/constructRSATree', (req, res) => {
	let uuid = req.body.uuid,
		path = req.body.path,
		name = req.body.name,
		extra = req.body.extra || '',
		satNumPerFile = +req.body.satNumPerFile;

	// let uuid = generateUUID({ prefix: 'RSATREE' }),
	if (rsatreePool.has(uuid)) {
		let rsatree = rsatreePool.get(uuid);
		// let rsatree;
		// waitUntil(() => (rsatree = rsatreePool.get(uuid)) != null, 500)
		// .then(() => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.json(rsatree.parameters);
		// });
	} else {
		// rsatreePool.set(uuid, null);

		let rsatree = new RSATree({
			path, name, extra, satNumPerFile,
		}, () => {
			let result = rsatree.parameters;

			rsatreePool.set(uuid, rsatree);

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.json(result);
		});
	}
});

let times_all = {}, errors_all = {}, aligned_all = {};

router.post('/requestRSATree', (req, res) => {
	let uuid = req.body.uuid,
		name = req.body.name || '',
		query = JSON.parse(req.body.query || 'false') || [],
		options = JSON.parse(req.body.options || 'false') || {},
		checkIntersects = JSON.parse(req.body.checkIntersects || 'false') || false,
		checkError = JSON.parse(req.body.checkError || 'false') || false,
		checkTime = JSON.parse(req.body.checkTime || 'false') || false,
		checkTime_loop = req.body.checkTime_loop == undefined ? 0 : +req.body.checkTime_loop; // query: [ [ x0, binWidth, binNum ] * dim ]

	console.log('/requestRSATree', `${name}`);

	let rsatree = rsatreePool.get(uuid);

	let results = rsatree.query(query, options);

	if (checkIntersects) {
		let stat_intersects = statistics(results.map(d => d.result.intersects),
			['count', 'mean', 'min', 'max', 'median', 'histogram'], {
				histogram_binNumber: 11,
				histogram_logBase: 10,
				histogram_logOffset: 0.0001,
			});
		console.log('\x1b[33m', `intersects (${name})`, "\x1b[0m", stat_intersects);
		consoleFuncs.drawHistogram(stat_intersects.histogram, {
			title: `Intersects distribution (${name})`,
		});
		aligned_all[name] = aligned_all[name] || [];
		aligned_all[name].push(results.map(d => d.result.aligned).reduce((a, b) => ({ all: a.all + b.all, accurate: a.accurate + b.accurate }), { all: 0, accurate: 0 }));

		console.log('points number (all):', results.reduce((a, b) => a + b.result.value, 0));
	}

	if (checkTime) {
		new Promise((resolve, reject) => {
			let timer = new Timer({ name: `${name}` });
			for (let l = 0; l < checkTime_loop; l += 1) {
				let timerName = `${l}`;
				// timer.start(timerName);
				rsatree.query(query, Object.assign({}, options, {
					timer, timerName,
				}));
				// timer.stop(timerName);
			}
			let timer_stats = timer.print();

			times_all[name] = times_all[name] || [];
			times_all[name].push(timer_stats.min);

			resolve();
		});
	}

	if (checkError) {
		// let answers_origin = rsatree.query_origin(query);
		rsatree.query_origin(query).then((answers_origin) => {
			let errors = results.map(d => {
				let a = d.value,
					b = answers_origin.get(...d.index);
				// if (d.result.uncertainty.all == 0 && a !== b) {
				// if (b - a > d.result.uncertainty.up || a - b > d.result.uncertainty.down) {
				// 	debugger;
				// 	console.log(d.index, a, b, d.result.uncertainty);
				// }
				// if (Math.abs(d.index[0] - 387) <= 1 && Math.abs(d.index[1] - 179) <= 1) {
				// 	console.log(d.index, a, b);
				// }
				return {
					a,
					b,
					error_relative: a === 0 && b === 0 ? 0 : Math.abs(a - b) / Math.max(a, b),
					error_absolute: Math.abs(a - b),
				};
			});
			// .filter(d => !isNaN(d.error))
			let errors_statistics_absolute = statistics(errors.map(d => d.error_absolute),
				['count', 'mean', 'min', 'max', 'median']);
			console.log('\x1b[33m', `error (${name}) (absolute)`, "\x1b[0m", errors_statistics_absolute);
			let errors_statistics_relative = statistics(errors.map(d => d.error_relative),
				['count', 'mean', 'min', 'max', 'median', 'histogram'], {
					histogram_binNumber: 11,
					histogram_logBase: 10,
					histogram_logOffset: 0.0001,
				});
			console.log('\x1b[33m', `error (${name}) (relative)`, "\x1b[0m", errors_statistics_relative);
			consoleFuncs.drawHistogram(errors_statistics_relative.histogram, {
				title: `Errors distribution (${name}) (relative)`,
			});

			errors_all[name] = errors_all[name] || [];
			errors_all[name].push(errors_statistics_relative.mean);

			// write errors to file
			// fs.writeFile(`.\\results\\${name}_errors.csv`, errors.map((d, i) => `${results[i].index.join(',')},${d.a}, ${d.b}`).join('\n'), (err) => {
			// 	if (err) console.log(err);
			// 	console.log("Successfully Written to File.");
			// });
		});
	}

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.json(results.filter(d => d.value != 0));
});

router.post('/requestRSATree_log', (req, res) => {
	let uuid = req.body.uuid,
		name = req.body.name || '',
		query = JSON.parse(req.body.query || 'false') || [],
		options = JSON.parse(req.body.options || 'false') || {},
		checkError = JSON.parse(req.body.checkError || 'false') || false,
		checkTime = JSON.parse(req.body.checkTime || 'false') || false,
		checkTime_loop = req.body.checkTime_loop == undefined ? 0 : +req.body.checkTime_loop; // query: [ [ x0, binWidth, binNum ] * dim ]

	console.log('/requestRSATree', `${name}`);

	let rsatree = rsatreePool.get(uuid);

	let results = rsatree.query_list(query, options);

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.json(results);
});

router.post('/requestRSATree_nodes', (req, res) => {
	let uuid = req.body.uuid,
		name = req.body.name || '';

	console.log('/requestRSATree_nodes', `${name}`);

	let rsatree = rsatreePool.get(uuid),
		tree = rsatree.rtree.tree();

	// copy tree structure


	res.setHeader('Access-Control-Allow-Origin', '*');
	res.json(tree);
});

router.post('/requestRSATree_all', (req, res) => {
	let uuid = req.body.uuid,
		name = req.body.name || '';

	console.log('/requestRSATree_all', `${name}`);

	let result = {
		times: times_all,
		errors: errors_all,
		aligned: aligned_all,
	};


	res.setHeader('Access-Control-Allow-Origin', '*');
	res.json(result);
});

router.post('/requestRSATree_all_clear', (req, res) => {
	let uuid = req.body.uuid,
		name = req.body.name || '';

	console.log('/requestRSATree_all_clear', `${name}`);

	times_all = {};
	errors_all = {};
	aligned_all = {};

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.json({});
});

/* ==== utilities ==== */

const DAYOFWEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
function parseDataTime(datetimeStr) {
	let datetime = new Date(Date.parse(datetimeStr));
	return {
		year: datetime.getFullYear(),
		month: datetime.getMonth() + 1,
		date: datetime.getDate(),
		dayOfWeek: DAYOFWEEK[datetime.getDay()],
		hour: datetime.getHours(),
		minute: datetime.getMinutes(),
		second: datetime.getSeconds(),
		millisecond: datetime.getMilliseconds(),
	}
}

module.exports = router;
