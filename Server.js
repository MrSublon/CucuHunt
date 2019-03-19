const express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const proSet = require('./propertySettings');
const maths = require('./Maths');
const collision = require('./CollisionDetection');
const barks = ["bark1.wav","bark2.wav","bark3.wav","sniff1.wav"];
//relative positions
var players = {};
var particles = [];
var resolution = {x:1600,y:900};

//------------PHYSICS-------------
const G = 9.81;


//wird einmal ausgeführt beim Erstellen eines neuen Sockets
io.on('connection', function(socket){

    newPlayer(socket.id);
    newParticle();

    console.log('user connected: ID: ' + socket.id);

    //Funktionen werden verfügbar gemacht
    socket.on('sent values', function(posVector){
        console.log("Received relative shiba position for Shiba-ID: ", socket.id, {x:posVector.x,y:posVector.y});
        players[socket.id].posVector = posVector;

    });
    socket.on('arf',function(){
        var index = Math.floor(Math.random() * barks.length);
        var bark = barks[index];
        let iterations = 0;
        let maxIterations = 10;
        let timeout = 20;

        var myVar = setInterval(function (){
            io.emit('someArf', bark, socket.id);
            console.log(timeout);
            iterations++;
            //setTimeout(myFunction, timeout);
            if (iterations >= maxIterations){
                clearInterval(myVar);
            }
        }, timeout);
    });

    //declares user as disconnected and removes his ID
    socket.on('disconnect', function(){
        delete players[socket.id];
        socket.emit('removePlayer',socket.id);
    });
    io.emit('onconnect');
});

//Framerate
setInterval(function(){
    io.emit('sendCoordinates',players,"otherPlayers");
    moveCucumbers();
    io.emit('sendCoordinates',particles,"cucumbers");
},1000 / 200);

app.use(express.static('public'));

http.listen(3001, function(){
    console.log("My socket server is running");
});

function moveCucumbers(){
    for (let i = 0;i<particles.length;i++) {
        let particle = particles[i];
        particle.posVector = maths.addVectors(particle.posVector,particle.velVector);
        particle.velVector = maths.addVectors(particle.velVector,particle.accVector);
    }
}
function newParticle(x=0,y=0){
    io.emit('test123');
    particles[particles.length] = {
        posVector:proSet.newVector(x,y),
        velVector:proSet.newVector(10,1),
        accVector:proSet.newVector(1/200,10/200),
        container:proSet.newContainer("cucumber"),
        mass:5,
        attractedTo:getSockets()
    };
    console.log("created particle with index: "+(particles.length-1));

}

function newPlayer(socketID){
    players[socketID] = {
        posVector:proSet.newVector(100,100),
        velVector:proSet.newVector(0,0),
        container:proSet.newContainer("shiba"),
        mass:5,
        name:"xXxTremGamerxXx",
        health:3,
        maxSpeed:10
    };
    console.log(players[socketID].container);
}

function getSockets(){
    return Object.keys(players);
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
        end = new Date().getTime();
    }
}

function myFunction(maxi,curri,timeout,funkTion) {
    funkTion();
    if (curri<maxi){
        curri++;
        setTimeout(myFunction(maxi,curri,timeout,funkTion), timeout);
    }
}

function sendArfs(destination, bark, socketid){
    io.emit(destination, bark, socketid);
}
