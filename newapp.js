/**
 * Created by Tina on 6/10/17.
 */
var cookieSession = require('client-sessions')
var express = require('express')
//var cookieParser = require('cookie-parser');
var app = express();
var config = require('./config.json');
 
// app.use(cookieSession({
//   name: 'session',
//   keys: [config.session_secret],
//   // Cookie Options 
//   maxAge: 15 * 60 * 1000 // valid for 15 minutes
// }))
app.use(cookieSession({
  cookieName: 'session', // cookie name dictates the key name added to the request object
  secret: 'blargadeeblargblarg', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));

app.set('port', process.env.PORT || 3000);
// routes will have access to it by req.app.get('appData')

// Set up view engines
app.set('view engine', 'ejs');
app.set('views', 'app/views');

app.post('/login', function(req, res) {
    var query = `SELECT fname FROM ${config.user_table} WHERE username = "${req.body.username}" AND password = "${req.body.password}"`;

    DB.query(query, function(err, rows) {
        if(err) console.log(err);
        else {
            var string = JSON.stringify(rows);
            var json = JSON.parse(string);
            if(json.length === 0) {
                console.log("No matching account found");
                res.send({"message": "There seems to be an issue with the username/password combination that you entered"});
            } else if (json.length === 1) {
                req.session.username = req.body.username;
                console.log("User logged in: First Name: " + json[0].fname + ", Username: " + req.session.username);
                // res.session = req.session;
                res.send({"message": `Welcome ${json[0].fname}`});
            }
        }
    });
});

app.post('/logout', ensureLoggedIn, function(req, res, next) {
    // req.session = null;
    req.session.reset();
    console.log("You have been successfully logged out");
    res.send({"message": "You have been successfully logged out"});
});

app.post('/addProducts', ensureAdmin, ensureValidInput, function(req, res, next) {
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

app.post('/modifyProduct', ensureAdmin, ensureValidInput, function(req, res, next) {
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

app.post('/viewProducts', ensureValidInput, function(req, res, next) {
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

app.post('/registerUser', ensureValidInput, function(req, res) {
    // If not all fields are provided
    if(Object.keys(req.body).length !== 9) {
        res.send({"message": "The input you provided is not valid"});
        console.log("Not all required information is provided");
    } else {
        var col = "(fname, lname, address, city, state, zip, email, username, password)";
        var values = "(";
        for (var key in req.body) {
            values += `"${req.body[key]}", `;
        }
        values = values.substring(0, values.length-2);
        values += ")";
        // var values = `("${req.body.fname}", "${req.body.lname}", "${req.body.address}", "${req.body.city}", "${req.body.state}", "${req.body.zip}", "${req.body.email}", "${req.body.username}", "${req.body.password}")`;
        var sql = `INSERT INTO ${config.user_table} ${col} VALUES ${values};`;

        // Create new user into db
        DB.insert(sql, function(err, result) {
            if(err){       
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`Duplicate username already existed, please choose another one`);
                    res.send({"message": "The information you provided is not valid"});
                } else console.log(err);
            }
            else if(result.affectedRows === 1){
                res.send({"message": `${req.body.fname} was registered successfully`});
                console.log(`1 new user registered, first name is ${req.body.fname}`);
            }
        });
    }
});

app.post('/updateInfo', ensureLoggedIn, ensureValidInput, function(req, res, next)  {
    var sess = req.session;
    var new_username = sess.user_name;
    console.log("Information to be updated: ", req.body, Object.keys(req.body).length);

    if(Object.keys(req.body).length > 0) {
        // Construct the SQL query
        var set = "";
        Object.keys(req.body).forEach(function(key) {
            set += `${key} = "${req.body[key]}", `;
            if(key === 'username') new_username = req.body[key];
        });
        set = set.slice(0, set.length - 2);
        var update = `UPDATE ${config.user_table} SET ${set} WHERE username = "${sess.user_name}";`

        // Handle username Duplication Entry error if user wants to update to an existing username
        DB.insert(update, function(err, result) {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`ER_DUP_ENTRY for username detected, your username is still: ${sess.user_name}`);
                    res.send({"message": "The information you provided is not valid"});
                } else console.log(err);
            } else if (result.affectedRows === 1) {
                sess.user_name = new_username;
                var select = `SELECT fname FROM ${config.user_table} WHERE username = "${sess.user_name}";`;
                DB.query(select, function (err, rows) {
                    if (err) console.log(err);
                    else {
                        var string = JSON.stringify(rows);
                        var json = JSON.parse(string);
                        console.log(json.length);
                        if (json.length === 1) {
                            res.send({"message": `${json[0].fname} your information was successfully updated`});
                            console.log(`${json[0].fname} your information was successfully updated`);
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

app.post('/viewUsers', ensureAdmin, ensureValidInput, function(req, res, next){
    var sess = req.session;

    // query db for user info

    var query = `SELECT fname, lname, username FROM ${config.user_table}`;
    if(typeof req.body.fname !== "undefined") {
        query += ` WHERE fname = "${req.body.fname}"`;
        if(typeof req.body.lname !== "undefined") query += ` AND lname = "${req.body.lname}";`;
        else query += ";";
    } else {
        if(typeof req.body.lname !== "undefined") query += ` WHERE lname = "${req.body.lname}"`;
        else query += ";";
    }
    console.log(query);

    DB.query(query, function(err, rows) {
        if(err) console.log(err);
        else {
            var string = JSON.stringify(rows);
            var json = JSON.parse(string);
            if(json.length === 0) {
                res.send({"message": "There are no users that match that criteria"});
            } else if (json.length > 0) {
                console.log(json.length + " users matched conditions found: " + json);
                res.send({"message": "The action was successful", "user": json});
            }
        }
    });
});

app.get('/health', function(req, res){
    res.send({"message": "Instance is alive"});
});

function ensureLoggedIn(req, res, next){
    if(req.session.username === undefined || req.session.username === null) {
        console.log("You are not currently logged in " + req.session.username);
        return res.send({"message": "You are not currently logged in"});
    }
    next();
}

function ensureAdmin(req, res, next) {
    console.log(req.session.username);
    if (req.session.username === undefined || req.session.username === null) {
        console.log("You are not currently logged in");
        return res.send({"message": "You are not currently logged in"});
    } else if (req.session.username !== config.username) {
        console.log("You are not an admin");
        return res.send({"message": "You must be an admin to perform this action"});
    }
    next();
}

function ensureValidInput(req, res, next) {
    var flag = true;
    for(var key in req.body){
        if(!req.body[key]) flag = false;
    }
    if(!flag) {
        // console.log("There are empty strings or NULL in the input");
        return res.send({"message": "The input you provided is not valid"});
    }
    next();
}

app.listen(app.get('port'), function() {
    console.log('Listening on port ' + app.get('port'));
});
/*
DEVELOPER NOTES:
- after install Nodemon, run the app using "upm start" instead of "node app"
- do npm init to create the package.json in the new app folder
 */
