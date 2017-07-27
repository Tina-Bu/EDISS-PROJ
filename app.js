/*
* 17648 - EDISS
* Project 4 - SCALABILITY
*
* Author: Tina Bu
*/

var express = require('express');
var session = require('cookie-session');
var cookieParser = require('cookie-parser');
var app = express();

const CONFIG = require('./config.json');

app.set('port', process.env.PORT || 3000);
// Set up view engines
app.set('view engine', 'ejs');
app.set('views', 'app/views');
// Add cookie parsing functionality
app.use(cookieParser());
// Specify session
app.use(session({
    secret: CONFIG.session_secret,
    name: 'session',
    cookie: {maxAge: 15 * 60 * 1000}
}));
// Set up all the routes
app.use(require('./routes/login'));
app.use(require('./routes/user'));
app.use(require('./routes/product'));
app.use(require('./routes/viewproduct'));


app.listen(app.get('port'), function() {
    console.log('Listening on port ' + app.get('port'));
});

app.get('/health', function(req, res){
    res.send({"message": "Instance is alive"});
});

/*
DEVELOPER NOTES:
- after install Nodemon, run the app using "upm start" instead of "node app"
- do npm init to create the package.json in the new app folder
 */
