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
colorList = ["#ff4d4d", "#ffa64d", "#ffff4d", "#79ff4d", "#4dffff", "#4d79ff", "#a64dff", "#ff4dd2"];

var Player = function(id) {
    var self = {
        x: 240,
        y: 240,
        id: id,
        number: 0,
        right: false,
        left: false,
        up: false,
        down: false,
        cantRight: false,
        cantLeft: false,
        cantUp: false,
        cantDown: false,
        speed: 3,
        color: colorList[Math.floor(Math.random()*7)]
    }
    self.updatePosition = function() {
        if (self.right && !self.cantRight) self.x += self.speed;
        if (self.left && !self.cantLeft) self.x -= self.speed;
        if (self.up && !self.cantUp) self.y -= self.speed;
        if (self.down && !self.cantDown) self.y += self.speed;
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
        if (data.inputId === "cantRight")
            playerList[data.playerId].cantRight = data.state;
        if (data.inputId === "cantLeft") {
            playerList[data.playerId].cantLeft = data.state;
            console.log(playerList[data.playerId]);
        }
        if (data.inputId === "cantUp")
            playerList[data.playerId].cantUp = data.state;
        if (data.inputId === "cantDown")
            playerList[data.playerId].cantDown = data.state;
    });
});

setInterval(function() {
    var pack = [];
    for(var i in playerList) {
        var player = playerList[i];
        player.updatePosition();
        player.number = pack.length;

        pack.push({
            x: player.x,
            y: player.y,
            id: player.id,
            color: player.color
        });
    }

    for(var i in socketList) {
        var socket = socketList[i];
        socket.emit("newPosition", pack);
    }
}, 1000/60);

// < >