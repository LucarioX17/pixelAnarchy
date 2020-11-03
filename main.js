var express = require("express");
var game = express();
var server = require("http").Server(game);

game.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
game.use("/client", express.static(__dirname + "/client"));
server.listen(process.env.PORT || 2000);
console.log("Server started");
console.log("");

var socketList = {};
var playerList = {};

var Player = function(id) {
    var self = {
        x: 250,
        y: 250,
        id: id,
        number: 0,
        right: false,
        left: false,
        up: false,
        down: false,
        speed: 5
    }
    self.updatePosition = function() {
        if (self.right) self.x += self.speed;
        if (self.left) self.x -= self.speed;
        if (self.up) self.y -= self.speed;
        if (self.down) self.y += self.speed;
    }
    return self;
}

var io = require("socket.io") (server, {});
io.sockets.on("connection", function(socket){
    socket.id = Math.random() * (1000 - 1) + 1;
    socketList[socket.id] = socket;

    var player = Player(socket.id);
    playerList[socket.id] = player;

    console.log("\x1b[0m\x1b[32m", "Player " + socket.id + " connected");
    console.log("\x1b[0m", "");

    socket.on("disconnect", function(data) {
        delete socketList[socket.id];
        delete playerList[socket.id];

        console.log("\x1b[0m\x1b[31m", "Player " + socket.id + " disconnected");
        console.log("\x1b[0m", "");
    });

    socket.on("keyPress", function(data) {
        if (data.inputId === "right")
            player.right = data.state;
        if (data.inputId === "left")
            player.left = data.state;
        if (data.inputId === "up")
            player.up = data.state;
        if (data.inputId === "down")
            player.down = data.state;
    });
});

setInterval(function() {
    var pack = [];
    for(var i in playerList) {
        var player = playerList[i];
        player.updatePosition();
        player.number = pack.length + 1;

        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }

    for(var i in socketList) {
        var socket = socketList[i];
        socket.emit("newPosition", pack);
    }
}, 1000/30);

// < >