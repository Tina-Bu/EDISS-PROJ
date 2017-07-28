/**
 * Created by Tina on 6/10/17.
 */

var express      = require('express');
var bodyParser   = require('body-parser'); // a middleware used to parse URL encoded input parameters as json
var cookieParser = require('cookie-parser');
// var AWS          = require('aws-sdk');
var DB           = require('../MySQLDB.js');
// var DynamoDB     = require('../dynamoDB.js');
var router       = express.Router();
const CONFIG     = require('../config.json');
const AUTH         = require('./authenticator.js');

const INVALID_INPUT_MSG  = "The input you provided is not valid";
const INVALID_INFO_MSG   = "The information you provided is not valid";
const NO_PRODUCT_MSG     = "There are no products that match that criteria";
const ACTION_SUCCESS_MSG = "The action was successful";
const NO_USER_MSG = "There are no users that match that criteria";
const NO_REC_MSG = "There are no recommendations for that product";

// AWS.config.update({
//   region: "us-west-2",
//   endpoint: "http://localhost:8000"
// });

// Parse JSON body and store result in req.body
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false}));
router.use(cookieParser());

router.post('/addProducts', AUTH.ensureAdmin, AUTH.ensureValidInput, function(req, res, next) {
    // If not all fields are provided
    if(Object.keys(req.body).length !== 4) {
        res.send({"message": INVALID_INPUT_MSG});
    } else {
        // Check if ASIN already existed
        var query = `SELECT * FROM ${CONFIG.prdct_table} WHERE ASIN = "${req.body.asin}"`;
        DB.query(query, function(err, rows){
            if(err) console.log(err);
            else {
                var string = JSON.stringify(rows);
                var json = JSON.parse(string);
                if(json.length === 0) {
                    // If no conflict asin
                    var col = "(asin, productName, productDescription, productGroup)";
                    var values = `("${req.body.asin}", "${req.body.productName}", "${req.body.productDescription}", "${req.body.group}")`;
                    var sql = `INSERT INTO ${CONFIG.prdct_table} ${col} VALUES ${values};`;

                    // Create new product into db
                    DB.insert(sql, function(err, result) {
                        if(err) console.log(err);
                        else if(result.affectedRows === 1){
                            res.send({"message": `${req.body.productName} was successfully added to the system`});
                        }
                    });
                } else if (json.length === 1) {
                    // If ASIN already existed
                    res.json({"message": INVALID_INPUT_MSG});
                }
            }
        });
    }
});

router.post('/modifyProduct', AUTH.ensureAdmin, AUTH.ensureValidInput, function(req, res, next) {
    var sess = req.session;

    if(Object.keys(req.body).length === 4) {
        // Construct the SQL query
        var set = `productName = "${req.body.productName}", productDescription = "${req.body.productDescription}", productGroup = "${req.body.group}"`;

        var update = `UPDATE ${CONFIG.prdct_table} SET ${set} WHERE asin = "${req.body.asin}";`

        DB.insert(update, function(err, result) {
            if (err) console.log(err);
            else if (result.affectedRows === 1) {
                var select = `SELECT productName FROM ${CONFIG.prdct_table} WHERE asin = "${req.body.asin}";`;
                DB.query(select, function (err, rows) {
                    if (err) console.log(err);
                    else {
                        var string = JSON.stringify(rows);
                        var json = JSON.parse(string);
                        if (json.length === 1) {
                            res.send({"message": `${json[0].productName} was successfully updated`});
                        }
                    }
                });
            }
        });
    } else {
        // no parameters passed
        res.send({"message": INVALID_INFO_MSG});
    }
});

router.post('/buyProducts', AUTH.ensureLoggedIn, AUTH.ensureValidInput, function(req, res, next) {
    var sess = req.session;

    // query db for product info
    var query = `SELECT asin, productName FROM ${CONFIG.prdct_table} WHERE `;
    for (var i = req.body.products.length - 1; i >= 0; i--) {
        query += `asin = '${req.body.products[i].asin}' OR `;
    }
    query = query.slice(0, query.length - 4);
    query += ';';
    //console.log(query);

    DB.query(query, function(err, rows) {
        if (err) console.log(err);
        else {
            var string = JSON.stringify(rows);
            var json = JSON.parse(string);
            // console.log("json: ", json);
            // get how many distinct products were purchased
            var product_set = new Set();
            for (var i = req.body.products.length - 1; i >= 0; i--) {
                product_set.add(req.body.products[i].asin);
            }
            if(json.length !== product_set.size) {
                //console.log("sql result length:", json.length, "product_set size", product_set.size);
                // if not all asins are in the database
                res.send({"message": NO_PRODUCT_MSG});
            } else {
                res.send({"message": ACTION_SUCCESS_MSG});
                // TODO: insert the purchase info with customer username into NoSQL DB
                var order = `INSERT INTO ${CONFIG.order_table} (username, productName) VALUES ` 
                for (var i = json.length - 1; i >= 0; i--) {
                    order += `("${sess.username}", "${json[i].productName}"), `
                };
                order = order.slice(0, order.length - 2);
                order += ';';
                DB.insert(order, function(err, result) {
                    if(err) console.log(err);
                })
                // TODO: insert the purchase info of purchased together products into NoSQL DB
                var values = "";
                for (var i = req.body.products.length - 1; i >= 0; i--) {
                    values += `${req.body.products[i].asin}, `;
                }
                values = values.slice(0, values.length - 2);
                var rec = `INSERT INTO ${CONFIG.rec_table} VALUES ('${values}');`;
                DB.insert(rec, function(err, result) {
                    if(err) console.log(err);
                })
            }
        }
    });
});

router.post('/productsPurchased', AUTH.ensureAdmin, AUTH.ensureValidInput, function(req, res, next) {
    var sess = req.session;
    // query DynamoDB for customer history order info
    var query = `SELECT productName, count(*) AS quantity FROM ${CONFIG.order_table} GROUP BY username, productName HAVING username = "${req.body.username}";`

    DB.query (query, function(err, rows) {
        if(err) console.log(err);
        else {
            var string = JSON.stringify(rows);
            var json = JSON.parse(string); 
            if(json.length === 0) res.send({"message": NO_USER_MSG});
            else {
                res.send({"message": ACTION_SUCCESS_MSG, "products": json});
                // console.log("product purchased checked successfully")
            }       
        }
    })
});
router.post('/getRecommendations', AUTH.ensureLoggedIn, AUTH.ensureValidInput, function(req, res, next) {
    res.send({"message": ACTION_SUCCESS_MSG, "products": []});
});

// router.post('/getRecommendations', AUTH.ensureLoggedIn, AUTH.ensureValidInput, function(req, res, next) {
//     var sess = req.session;
//     var query = `SELECT * FROM ${CONFIG.rec_table} WHERE orderDetails LIKE '%${req.body.asin}%'`;
//     DB.query(query, function(err, rows) {
//         if(err) console.log(err);
//         else {
//             var string = JSON.stringify(rows);
//             var json = JSON.parse(string); 
//             if(json.length === 0) res.send({"message": NO_REC_MSG});
//             else {
//                 var hash = {};
//                 for (var i = json.length - 1; i >= 0; i--) {
//                     var tmp = json[i].orderDetails.split(', ');
//                     // console.log(tmp);
//                     for (var i = tmp.length - 1; i >= 0; i--) {
//                         if(hash[tmp[i]])
//                             hash[tmp[i]] += 1;
//                         else 
//                             hash[tmp[i]] = 1;
//                     }
//                 }
//                 delete hash[req.body.asin];
//                 // console.log(hash);
//                 var sortable = [];
//                 for (var x in hash) {
//                     sortable.push([x, hash[x]]);
//                 }
//                 sortable.sort(function(a, b) {
//                     return b[1] - a[1];
//                 });
//                 // console.log(sortable);
//                 if(sortable.length >= 5) {
//                     var products = [];
//                     for (var i = 4; i >= 0; i--) {
//                         products.push({"asin": sortable[i][0]});
//                     }
//                     res.send({"message": ACTION_SUCCESS_MSG, "products": products});
//                 }
//                 else{
//                     var products = [];
//                     for (var i = sortable.length - 1; i >= 0; i--) {
//                         products.push({"asin": sortable[i][0]});
//                     }
//                     res.send({"message": ACTION_SUCCESS_MSG, "products": products});
//                 }
//             }           

//         }
//     })
// });
module.exports = router;


function valid(input) {
    if(input === undefined || input === null)
        return false;
    else return true;
}
