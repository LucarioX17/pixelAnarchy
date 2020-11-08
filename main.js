var express = require("express");
var game = express();
var server = require("http").Server(game);

game.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
game.use("/client", express.static(__dirname + "/client"));
server.listen(process.env.PORT || 2000);
console.log("");
console.log("Server started");
console.log("");

var socketList = {},
playerList = {},
colorList = ["#0066ff", "#ff0000"];

var Player = function(id) {
    var self = {
        x: 120,
        y: 240,
        id: id,
        number: 0,
        right: false,
        left: false,
        up: false,
        down: false,
        canCollideX: false,
        shoot: 0,
        speed: 3,
        color: colorList[0],
        started: false
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
io.sockets.on("connection", function(socket) {
    socket.id = Math.random() * (1000 - 1) + 1;
    socketList[socket.id] = socket;

    var player = Player(socket.id);
    playerList[socket.id] = player;

    console.log("Player " + socket.id + " connected");
    console.log("");

    socket.on("canCollideX", function(data) {
        playerList[data.playerId].canCollideX = data.canCollideX;
    });

    socket.on("disconnect", function(data) {
        delete socketList[socket.id];
        delete playerList[socket.id];

        console.log("Player " + socket.id + " disconnected");
        console.log("");
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

    socket.on("collision", function(data) {
        if (data.change) {
            if (data.PlayerX != undefined) playerList[data.playerId].x = data.PlayerX;
            if (data.PlayerY != undefined) playerList[data.playerId].y = data.PlayerY;
        }
    });

    socket.on("started", function(data) {
        player.started = data.started;
    });
});

setInterval(function() {
    var pack = [];
    for(var i in playerList) {
        var player = playerList[i];
        player.updatePosition();
        if (player.shoot > 0) player.shoot--;

        if (!player.started) {
            if (pack.length % 2 == 0) {
                player.color = colorList[0];
                player.x = 120;
            } else {
                player.color = colorList[1];
                player.x = 360;
            }
        }
        
        pack.push({
            x: player.x,
            y: player.y,
            id: player.id,
            color: player.color,
            canCollideX: player.canCollideX,
            started: player.started
        });
    }

    for(var i in socketList) {
        var socket = socketList[i];
        socket.emit("newPosition", pack);
    }
}, 1000/60);