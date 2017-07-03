var mysql = require('mysql');
var config = require('./config.json');
// Connect to our database and maintain the connection during the session
var pool  = mysql.createPool({
    host: config.MySQL_host,
    port: config.MySQL_port,
    user: config.MySQL_user,
    password: config.MySQL_password,
    database : config.MySQL_database
});

exports.query = function(query, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            if(typeof connection !== 'undefined' && connection) {
                connection.release(); // return the connection will return to the pool
            }
            console.log("Error getting a MySQL connection from the pool: ", err);
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
            console.log("Error getting a MySQL connection from the pool: ", err);
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


/*
Code to create the database table:
For users:

CREATE TABLE user (
  fname VARCHAR(255) NOT NULL,
  lname VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  zip VARCHAR(255),
  email VARCHAR(255),
  username VARCHAR(255) NOT NULL PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  user_type_id INT DEFAULT 1
);
ALTER TABLE user ADD CONSTRAINT UQ_Name UNIQUE (username);
INSERT INTO user (fname, lname, username, password, user_type_id) VALUES ("Jenny", "Admin", "jadmin", "admin", 2);

CREATE TABLE usertype (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
user_type ENUM('customer', 'admin')
);

INSERT INTO usertype (user_type) VALUES ('customer');
INSERT INTO usertype (user_type) VALUES ('admin');
+----+-----------+
| id | user_type |
+----+-----------+
|  1 | customer  |
|  2 | admin     |
+----+-----------+

INSERT INTO user (fname, lname, address, city, state, zip, email, username, password) VALUES ("Tina", "Bu", "732 S. Millvale Ave", "Pittsburgh", "PA", 15213, "butianhong@outlook.com", "tbu", "tbu");
INSERT INTO user (fname, lname, address, city, state, zip, email, username, password) VALUES ("Tina", "Tiiii", "Center Ave", "Pittsburgh", "PA", 15213, "tiii@outlook.com", "tita", "tita");
INSERT INTO user (fname, lname, username, password, user_type_id) VALUES ("Jenny", "Admin", "jadmin", "admin", 2);
*/

/*
 Code to create the database table:
 For products:

CREATE TABLE product(
    asin VARCHAR(255) PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    productDescription VARCHAR(255),
    productGroup VARCHAR(255)
);

 ALTER TABLE product ADD CONSTRAINT UQ_Name UNIQUE (asin);

 INSERT INTO product (asin, productName, productDescription, productGroup) VALUES (1, "Laptop", "Macbook 2015", "Electronics");
 INSERT INTO product (asin, productName, productDescription, productGroup) VALUES (2, "Zen and Motorcycle maintenance", "Best selling spiritual book", "Book");
 INSERT INTO product (asin, productName, productDescription, productGroup) VALUES (3, "Grounded Coffee", "Starbucks coffee", "Food");

 */

/*
For testing code to run, delete all from tables first.

DELETE FROM user;
DELETE FROM product;
INSERT INTO user (fname, lname, username, password, user_type_id) VALUES ("Jenny", "Admin", "jadmin", "admin", 2);

 */