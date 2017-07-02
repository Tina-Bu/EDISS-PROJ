/**
 * Created by Tina on 6/10/17.
 */

var express = require('express');
var bodyParser = require('body-parser'); // a middleware used to parse URL encoded input parameters as json
var cookieParser = require('cookie-parser');
var DB = require('../DB.js');

var router = express.Router();
var config = require('../config.json');
var auth = require('./authenticator.js');

// Parse JSON body and store result in req.body
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false}));
router.use(cookieParser());

router.post('/addProducts', auth.ensureAdmin, auth.ensureValidInput, function(req, res, next) {
    // If not all fields are provided
    if(Object.keys(req.body).length !== 4) {
        res.send({"message": "The input you provided is not valid"});
        console.log("Not all required information is provided");
    } else {
        // Check if ASIN already existed
        var query = `SELECT * FROM ${config.prdct_table} WHERE ASIN = "${req.body.asin}"`;
        DB.query(query, function(err, rows){
            if(err) console.log(err);
            else {
                var string = JSON.stringify(rows);
                var json = JSON.parse(string);
                if(json.length === 0) {
                    // If no conflict asin
                    var col = "(asin, productName, productDescription, productGroup)";
                    var values = `("${req.body.asin}", "${req.body.productName}", "${req.body.productDescription}", "${req.body.group}")`;
                    var sql = `INSERT INTO ${config.prdct_table} ${col} VALUES ${values};`;

                    // Create new product into db
                    DB.insert(sql, function(err, result) {
                        if(err) console.log(err);
                        else if(result.affectedRows === 1){
                            res.send({"message": `${req.body.productName} was successfully added to the system`});
                            console.log(`1 new product entered, ASIN and name are ${req.body.asin} ${req.body.productName}`);
                        }
                    });
                } else if (json.length === 1) {
                    // If ASIN already existed
                    res.json({"message": "The input you provided is not valid"});
                    console.log("The ASIN you provided already existed");
                }
            }
        });
    }
});

router.post('/modifyProduct', auth.ensureAdmin, auth.ensureValidInput, function(req, res, next) {
    var sess = req.session;

    if(Object.keys(req.body).length === 4) {
        // Construct the SQL query
        var set = `productName = "${req.body.productName}", productDescription = "${req.body.productDescription}", productGroup = "${req.body.group}"`;

        var update = `UPDATE ${config.prdct_table} SET ${set} WHERE asin = "${req.body.asin}";`

        DB.insert(update, function(err, result) {
            if (err) console.log(err);
            else if (result.affectedRows === 1) {
                var select = `SELECT productName FROM ${config.prdct_table} WHERE asin = "${req.body.asin}";`;
                DB.query(select, function (err, rows) {
                    if (err) console.log(err);
                    else {
                        var string = JSON.stringify(rows);
                        var json = JSON.parse(string);
                        console.log(json.length);
                        if (json.length === 1) {
                            res.send({"message": `${json[0].productName} was successfully updated`});
                            console.log(`Product ${json[0].productName} was successfully updated`);
                        }
                    }
                });
            }
        });
    } else {
        // no parameters passed
        console.log("Not all required input is provided");
        res.send({"message": "The information you provided is not valid"});
    }
});

router.post('/viewProducts', auth.ensureValidInput, function(req, res, next) {
    var sess = req.session;

    // query db for product info
    var query = `SELECT asin, productName FROM ${config.prdct_table} WHERE`;
    if(typeof req.body.asin !== "undefined") {
        query += ` asin = "${req.body.asin}"`;
        if (typeof req.body.group !== "undefined") query += ` AND productGroup = "${req.body.group}"`;
        if (typeof req.body.keyword !== "undefined") {
            var newQuery = `${query} AND productName LIKE '%${req.body.keyword}%' UNION ${query} AND productDescription LIKE '%${req.body.keyword}%';`;
            query = newQuery;
        } else query += ';';
    } else {
        if(typeof req.body.group !== "undefined") {
            query += ` productGroup = "${req.body.group}"`;
            if (typeof req.body.keyword !== "undefined") {
                var newQuery = `${query} AND productName LIKE '%${req.body.keyword}%' UNION ${query} AND productDescription LIKE '%${req.body.keyword}%';`;
                query = newQuery;
            } else query += ';';
        } else if (typeof req.body.keyword !== "undefined") {
            var newQuery = `${query} productName LIKE '%${req.body.keyword}%' UNION ${query} productDescription LIKE '%${req.body.keyword}%';`;
            query = newQuery;
        } else {
            query = query.slice(0, query.length - 6);
            query += ';';
        }
    }
    // console.log(query);
    DB.query(query, function (err, rows) {
        if (err) console.log(err)
        else {
            var string = JSON.stringify(rows);
            var json = JSON.parse(string);
            console.log(json.length);
            if (json.length === 0) {
                res.send({"message": "There are no products that match that criteria"});
                console.log("There are no products that match that criteria");
            } else {
                res.send({"product": json});
                console.log(`${json.length} products matched the criteria`);
            }
        }
    });
});

module.exports = router;