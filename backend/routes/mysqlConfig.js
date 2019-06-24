let mysql = require('mysql');

let conn = mysql.createConnection({
	host: '10.76.0.193',
	user: 'username',
	password: 'password',
	database: 'rsatree',
	port: 3306,
});

module.exports = conn;