/**
 * Created by Tina on 6/10/17.
 */
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var DB = require('../MySQLDB.js');

var router = express.Router();
const CONFIG = require('../config');
var auth = require('./authenticator.js');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false}));
router.use(cookieParser());

router.post('/registerUser', auth.ensureValidInput, function(req, res) {
    // If not all fields are provided
    if(Object.keys(req.body).length !== 9) {
        res.send({"message": "The input you provided is not valid"});
    } else {
        // var values = `("${req.body.fname}", "${req.body.lname}", "${req.body.address}", "${req.body.city}", "${req.body.state}", "${req.body.zip}", "${req.body.email}", "${req.body.username}", "${req.body.password}")`;
        var sql = "INSERT INTO " + CONFIG.user_table + " (fname, lname, address, city, state, zip, email, username, password) VALUES ('" 
            + req.body.fname + "', '" + req.body.lname + "', '" + req.body.address + "', '" +
            req.body.city + "', '" + req.body.state + "', '" + req.body.zip + "', '" + req.body.email + "', '" +
            req.body.username + "', '" + req.body.password + "');"

        // Create new user into db
        DB.insert(sql, function(err, result) {
            if(err){       
                if (err.code === 'ER_DUP_ENTRY') {
                    res.send({"message": "The information you provided is not valid"});
                } else console.log(err);
            }
            else if(result.affectedRows === 1){
                res.send({"message": `${req.body.fname} was registered successfully`});
            }
        });
    }
});

router.post('/updateInfo', auth.ensureLoggedIn, auth.ensureValidInput, function(req, res, next)  {
    var sess = req.session;
    var new_username = sess.user_name;

    if(Object.keys(req.body).length > 0) {
        // Construct the SQL query
        var set = "";
        Object.keys(req.body).forEach(function(key) {
            set += `${key} = "${req.body[key]}", `;
            if(key === 'username') new_username = req.body[key];
        });
        set = set.slice(0, set.length - 2);
        var update = `UPDATE ${CONFIG.user_table} SET ${set} WHERE username = "${sess.user_name}";`

        // Handle username Duplication Entry error if user wants to update to an existing username
        DB.insert(update, function(err, result) {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    res.send({"message": "The information you provided is not valid"});
                } else console.log(err);
            } else if (result.affectedRows === 1) {
                sess.user_name = new_username;
                var select = `SELECT fname FROM ${CONFIG.user_table} WHERE username = "${sess.user_name}";`;
                DB.query(select, function (err, rows) {
                    if (err) console.log(err);
                    else {
                        var string = JSON.stringify(rows);
                        var json = JSON.parse(string);
                        if (json.length === 1) {
                            res.send({"message": `${json[0].fname} your information was successfully updated`});
                        }
                    }
                });
            }
        });
    } else {
        // no parameters passed
        res.send({"message": "The information you provided is not valid"});
    }
});

router.post('/viewUsers', auth.ensureAdmin, auth.ensureValidInput, function(req, res, next){
    var sess = req.session;

    // query db for user info

    var query = `SELECT fname, lname, username FROM ${CONFIG.user_table}`;
    if(typeof req.body.fname !== "undefined") {
        query += ` WHERE fname = "${req.body.fname}"`;
        if(typeof req.body.lname !== "undefined") query += ` AND lname = "${req.body.lname}";`;
        else query += ";";
    } else {
        if(typeof req.body.lname !== "undefined") query += ` WHERE lname = "${req.body.lname}"`;
        else query += ";";
    }

    DB.query(query, function(err, rows) {
        if(err) console.log(err);
        else {
            var string = JSON.stringify(rows);
            var json = JSON.parse(string);
            if(json.length === 0) {
                res.send({"message": "There are no users that match that criteria"});
            } else if (json.length > 0) {
                res.send({"message": "The action was successful", "user": json});
            }
        }
    });
});

module.exports = router;