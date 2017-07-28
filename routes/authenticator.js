/**
 * Created by Tina on 6/14/17.
 */
var config = require('../config.json');

const NOT_LOGGED_IN_MSG = "You are not currently logged in";
const NOT_ADMIN_MSG = "You must be an admin to perform this action";
const INVALID_INPUT_MSG  = "The input you provided is not valid";

module.exports = {
    ensureLoggedIn: function (req, res, next){
        if(req.session.username === undefined || req.session.username === null) {
            // console.log("You are not currently logged in " + req.session.username);
            return res.send({"message": NOT_LOGGED_IN_MSG});
        }
        next();
    },

    ensureAdmin: function (req, res, next) {
        if (req.session.username === undefined || req.session.username === null) {
            // console.log("You are not currently logged in");
            return res.send({"message": NOT_LOGGED_IN_MSG});
        } else if (req.session.username !== config.username) {
            // console.log("You are not an admin");
            return res.send({"message": NOT_ADMIN_MSG});
        }
        next();
    },

    ensureValidInput: function(req, res, next) {
        var flag = true;
        for(var key in req.body){
            if(req.body[key] === undefined || req.body[key] === null) flag = false;
        }
        if(!flag) {
            // console.log("There are empty strings or NULL in the input");
            return res.send({"message": INVALID_INPUT_MSG});
        }
        next();
    }

};