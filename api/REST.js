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
//*     authentification     *
//****************************
router.post('/authentification/', function(req, res) {

  // find the user
  var query = "SELECT * FROM ?? WHERE ??=? AND password=? ";
  var table = ["users","login",req.body.login, bcrypt.hashSync(req.body.password, salt)];
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
//*****************
//*     users     *
//*****************
router.post("/users",function(req,res){
    var query = "INSERT INTO users (email,password,nom,prenom,login,telephone) VALUES (?,?,?,?,?,?)";
    var table = [req.body.email, bcrypt.hashSync(req.body.password, salt),req.body.nom,req.body.prenom,req.body.login,req.body.telephone];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "User Added !"});
        }
    });
});

router.get("/users", function(req,res){
    var query = "SELECT * FROM ??";
    var table = ["users"];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows);
        }
    });
});

router.get("/users/byname/:name",function(req,res){
    var query = "SELECT * FROM ?? WHERE ??=?";
    var table = ["users","lastname",req.params.name];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows[0]);
        }
    });
});

router.get("/users/:id",function(req,res){
    var query = "SELECT * FROM ?? WHERE ??=?";
    var table = ["users","id",req.params.id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows[0]);
        }
    });
});

router.get("/:id_devices/users",function(req,res){
    var query = "SELECT * FROM ?? WHERE ??=?";
    var table = ["users","id_devices",req.params.id_devices];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows);
        }
    });
});

router.put("/users/:id",function(req,res){
    var query = "UPDATE users SET  email = ?, login = ?, nom = ?, prenom = ?, telephone = ?  WHERE id = ?";
    var table = [req.body.email,req.body.login,req.body.nom,req.body.prenom,req.body.telephone, req.params.id];

    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Updated the password for email "+req.body.email});
        }
    });
});

router.put("/users/password/:id", function(req,res){
    var query = "UPDATE users Set password = ? WHERE id = ?"
    var table =[bcrypt.hashSync(req.body.password, salt), req.params.id]

    query = mysql.format(query, table);
    connection.query(query, function(err,rows){
        if(err){
            res.json({ "Error": true, "Message" : "Error executing MySQL query"})
        } else {
            res.json({"Error": true, "Message" : "Updated password"})
        }
    })
})

router.delete("/users/:id",function(req,res){
    var query = "DELETE from ?? WHERE ??=?";
    var table = ["users","id",req.params.id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Deleted the device with id "+req.params.id});
        }
    });
});

//*****************
//*     devices    *
//*****************
router.post("/devices",function(req,res){
    var query = "INSERT INTO ?? (??,??,??,??) VALUES (?,?,?,?)";
    var table = ["devices", "name","mac_address","type","id_user", req.body.name, req.body.mac_address, req.body.type, req.body.id_user];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "device Added !"});
        }
    });
});

router.get("/devices", function(req,res){
    var query = "SELECT * FROM ??";
    var table = ["devices"];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows);
        }
    });
});

router.get("/devices/:id",function(req,res){
    var query = "SELECT * FROM ?? WHERE ??=?";
    var table = ["devices","id",req.params.id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows[0]);
        }
    });
});

router.put("/devices/:id",function(req,res){
    var query = "UPDATE devices SET name = ? , mac_address  = ?, type = ? WHERE id = ?";
    var table = [ req.body.name, req.body.mac_address, req.body.type, req.params.id ];

    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Updated device"});
        }
    });
});

router.delete("/devices/:id",function(req,res){
    var query = "DELETE from ?? WHERE ??=?";
    var table = ["devices","id",req.params.id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Deleted the device with id: "+req.params.id});
        }
    });
});

router.get("/authDevices", function(req,res){
    var query = "SELECT * FROM users u, friends f, devices d where u.id=d.id_user and u.id=f.id_user and u.id= ?";
    var table = ["devices", req.params.id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows);
        }
    });
});

//*****************
//*     friends   *
//*****************
router.post("/friends",function(req,res){
    var query = "INSERT INTO ?? (??,??) VALUES (?,?)";
    var table = ["friends", "id_friend","id_user", req.body.id_friend, req.body.id_user];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "friend Added !"});
        }
    });
});

router.get("/friends", function(req,res){
    var query = "SELECT * FROM ??";
    var table = ["friends"];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows);
        }
    });
});

router.get("/friends/:id",function(req,res){
    var query = "SELECT * FROM ?? WHERE ??=?";
    var table = ["friends","id_user",req.params.id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json(rows[0]);
        }
    });
});

router.delete("/friends",function(req,res){
    var query = "DELETE from ?? WHERE ??=? and ??=?";
    var table = ["friends","id_user","id_friend",req.body.id_user, req.body.id_friend];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Deleted the friends with id: "+req.params.id});
        }
    });
});
}
module.exports = REST_ROUTER;
