var mysql = require('mysql');
const CONFIG = require('./config.json');

// Connect to our database and maintain the connection during the session
// Get a connection pool
// var pool  = mysql.createPool({
//     host: CONFIG.MySQL_host,
//     user: CONFIG.MySQL_user,
//     password: CONFIG.MySQL_password,
//     database : CONFIG.MySQL_database
// });

// For AWS RDS
var pool  = mysql.createPool({
    host: "ediss-p4.c6xzjopfczba.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: "admin",
    password: "adminadmin",
    database : "EDISS"
});

exports.query = function(query, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            if(typeof connection !== 'undefined' && connection) {
                connection.release(); // return the connection will return to the pool
            }
            // console.log("Error getting a MySQL connection from the pool: ", err);
            callback(err, null);
        } else {
            connection.query(query, function(err, rows) {
                connection.release();
                if(!err) {
                    callback(null, rows);
                } else {
                    callback(err, null);
                }
            });
        }
    });
}

exports.insert = function(query, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            // console.log("Error getting a MySQL connection from the pool: ", err);
            callback(err, null);
        } else {
            connection.query(query, function(err, result) {
                connection.release();
                if(!err) {
                    callback(null, result);
                } else {
                    callback(err, null);
                }
            });
        }
    });
}
