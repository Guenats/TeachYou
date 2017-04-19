var mysql = require("mysql");
var jwt    = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var bcrypt = require('bcryptjs');
var salt = '$2a$10$nTxpuOATRoREpRkP6.H6s.';
var morgan = require('morgan')



function REST_ROUTER(router,connection) {
    var self = this;
    self.handleRoutes(router,connection);
}

REST_ROUTER.prototype.handleRoutes= function(router,connection) {
    router.get("/",function(req,res){
        res.json({"Message" : "Hello World !"});
    });

//****************************
//*     utilisateur    *
//****************************
router.post('/utilisateur/', function(req, res) {

  // find the user
  var query = "SELECT * FROM ?? WHERE ??=? AND PasswordUtilisateur=? ";
  var table = ["utilisateur","MailUtilisateur",req.body.login, bcrypt.hashSync(req.body.password, salt)];
  query = mysql.format(query,table);
  connection.query(query,function(err,rows, rowCount){

    if(rows.length == 0) {
        res.json({
            success: false,
            //message: 'access denied'
        });
    }
    else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign({
          auth:  'magic',
          agent: req.headers['user-agent'],
          exp:   Math.floor(new Date().getTime()/1000) + 7*24*60*60// expires in 24 hours
      }, "secretOfTheWorld");

        // return the information including token as JSON
        res.json({
            success: true,
            token: token,
            user: rows[0],
        });
    }
});
});

router.post('/login/', function(req, res){
    var token = req.body.token || req.query.token;
    if (token) {
        jwt.verify(token, "secretOfTheWorld", function(err){
            if (err){
                return res.json({
                    success: false,
                    message: 'wrong token'
                });
            }else{
                return res.json({
                    success: true,
                    message: "login"

                });
            }
        });
    }else{
        return res.json({message: "Token is missing"})
    }
});




//****************************
//*        Middleware        *
//****************************

router.use("protected/*", function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token;

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token,"secretOfTheWorld", function(err, decoded) {
      if (err) {
        return res.json({
            success: false,
            message: 'Failed to authenticate token.'
            //message: 'access denied'
        });
    } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
    }
});

} else {
    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });

}
});

}
module.exports = REST_ROUTER;
