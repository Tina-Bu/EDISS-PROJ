/**
 * Created by Tina on 6/14/17.
 */
var config = require('../config.json');

module.exports = {
    ensureLoggedIn: function (req, res, next){
        if(req.session.username === null) {
            console.log("You are not currently logged in" + req.session.username);
            return res.send({"message": "You are not currently logged in"});
        }
        next();
    },

    ensureAdmin: function (req, res, next) {
        console.log(req.session.username);
        if (req.session.username === null) {
            console.log("You are not currently logged in");
            return res.send({"message": "You are not currently logged in"});
        } else if (req.session.username !== config.username) {
            console.log("You are not an admin");
            return res.send({"message": "You must be an admin to perform this action"});
        }
        next();
    },

    ensureValidInput: function(req, res, next) {
        var flag = true;
        for(var key in req.body){
            if(!req.body[key]) flag = false;
        }
        if(!flag) {
            console.log("There are empty strings or NULL in the input");
            return res.send({"message": "The input you provided is not valid"});
        }
        next();
    }

};