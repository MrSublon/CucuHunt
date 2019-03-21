const express = require('express');

var i = 1;
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const proSet = require('./propertySettings');
const maths = require('./Maths');
const collision = require('./CollisionDetection');

const parentSFX = "SFX/";
const barks = ["bark1.mp3","bark2.mp3","bark3.mp3","sniff1.mp3"];
//relative positions
var players = {};
var particles = [];
var resolution = {x:1600,y:900};

//testing
var past = {};
//------------PHYSICS-------------
const GConstant = 667408 * 0.00000001;
const g = 9.81; //Gravitational force on earth


//wird einmal ausgeführt beim Erstellen eines neuen Sockets
io.on('connection', function(socket){

    newPlayer(socket.id);
    /*
    * newParticle(0.5,0.5);
    * console.log(particles[particles.length-1]);
    */
    console.log('user connected: ID: ' + socket.id);

    //Funktionen werden verfügbar gemacht
    socket.on('sent values', function(posVector){
        //console.log("Received relative shiba position for Shiba-ID: ", socket.id, {x:posVector.x,y:posVector.y});
        players[socket.id].posVector = posVector;

        //console.log(players[socket.id]);
        let keys = Object.keys(players);
        //console.log(keys);
    });

    socket.on('arf',function(){
        var index = Math.floor(Math.random() * barks.length);
        var bark = barks[index];
        let iterations = 0;
        let maxIterations = 0;
        let timeout = 20;

        var myVar = setInterval(function (){
            let directoryBark = parentSFX + bark;
            io.emit('someArf', directoryBark, socket.id);
            //console.log(timeout);
            iterations++;
            //setTimeout(myFunction, timeout);
            if (iterations >= maxIterations){
                clearInterval(myVar);
            }
        }, timeout);
    });

    socket.on('placeCucumber',function(vector){ //x and y needed
        if (particles.length<30){
            newParticle(vector.x,vector.y);
        }
    });

    socket.on('dropChildNode',function(parentID){
        if (parentID === "cucumbers") {
            cutCucumber();

        }
    });

    socket.on('isHunting',function(isHunting){
        players[socket.id].isHunting = isHunting;
    });
    //declares user as disconnected and removes his ID
    socket.on('disconnect', function(){
        delete players[socket.id];
        io.emit('removePlayer',socket.id);
        console.log("disconnected");
    });
    //io.emit('onconnect');
});
//move cucu

//Framerate
setInterval(function(){
    moveCucumbers();

    let haveCollided = checkCollision(players,particles);

    for (let col in haveCollided){
        cutCucumber(col.el1)
    }

    io.emit('sendCoordinates',players,"otherPlayers");

    io.emit('sendCoordinates',particles,"cucumbers");

},1000 / 200);

app.use(express.static('public'));

http.listen(3001, function(){
    console.log("My socket server is running");
});

function moveCucumbers(){
    particles.forEach(function(cucumber) {
        cucumber.accVector = calcAcceleration(cucumber);
        //console.log(cucumber.accVector);

        cucumber.posVector = maths.addVectors(cucumber.posVector, cucumber.velVector);
        cucumber.velVector = calcVelocity(cucumber.velVector, cucumber.accVector,true);
        //cucumber.velVector = maths.addVectors(cucumber.velVector, cucumber.accVector);
        //cucumber.velVector =

        cucumber.posVector = moduloVector(0,0,1,1,cucumber.posVector);

        //console.log(cucumber);
    });

}

function cutCucumber(id="last"){
    if (id === "last"){id = particles.length - 1;}
    particles.splice((id), 1);
    io.emit('dropLastChild',"cucumbers");
}

function checkCollision(group1,group2){
    let collided = [];
    for (let el1 in group1){
        for (let el2 in group2){
            if (collision.detectCollision(el1,el2)){
                collided.push({el1:el1,el2:el2});

            }
        }
    }
    return collided;
}

function newParticle(x=0,y=0){
    io.emit('test123');
    particles[particles.length] = {
        posVector:proSet.newVector(x,y),
        velVector:proSet.newVector(0/200000,0/200000),
        accVector:proSet.newVector(1/200000,10/2000000),
        container:proSet.newContainer("cucumber"),
        mass:0.000001,
    };
    console.log("created particle with index: "+(particles.length-1));

}

function newPlayer(socketID){
    players[socketID] = {
        posVector:proSet.newVector(0,0),
        velVector:proSet.newVector(0,0),
        container:proSet.newContainer("shiba"),
        mass:0.01,
        name:"xXxTremGamerxXx",
        health:3,
        maxSpeed:10,
        isHunting:true
    };
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

function calcAcceleration(element) {

    let accVec = {x:0,y:0};
    getSockets().forEach(function(playerID){

        if (playerID === "undefined") return;
        if (players[playerID].isHunting === false) return;
        //console.log(players[playerID]);
        //console.log(players[playerID]);

        let dist = distanceOfVectors(players[playerID].posVector,element.posVector);

        let strength = attractionForce(players[playerID].mass,element.mass,dist,GConstant)*(-1);

        let difVec = maths.subVectors(players[playerID].posVector,element.posVector);
        if (dist<0.4) {
            accVec = maths.addVectors(accVec, maths.factorVector(difVec, strength));
        }


    });
    element.accVector = accVec;
    return element.accVector;
}

function distanceOfVectors(vector1, vector2){
    return Math.sqrt(Math.pow(vector2.y-vector1.y,2)+Math.pow(vector2.x-vector1.x,2));
}

function attractionForce(m1,m2,d,G){
    return (G*(m1+m2))/(d*d);
}

function multiplyVectors(vector1,vector2){
    let x = vector1.x * vector2.x;
    let y = vector1.y * vector2.y;
    return {x:x,y:y};
}

function vektorBetrag(vector){
    return Math.sqrt(vector.x*vector.x+vector.y*vector.y);
}

function skalarProdukt(vector1,vector2){
    return (vector1.x * vector2.x + vector1.y*vector2.y);
}

function calcDirectionVector(degree){
    let x = Math.cos(degree);
    let y = Math.sin(degree);
    //console.log(x,y);
    return {x:x,y:y};
}

function moduloVector(x1,y1,x2,y2,vector){
    let moduloX = x2-x1;
    let moduloY = y2-y1;

    let x = vector.x % moduloX + x1;
    let y = vector.y % moduloY + y1;

    if (x<0){
        x = moduloX + x;
    }
    if (y<0){
        y = moduloY + y;
    }
    vector = {x:x,y:y};

    return vector;
}

function calcVelocity(vector1,vector2,friction=false){
    let velocityVector;

    velocityVector = maths.addVectors(vector1, vector2);

    if (friction){
        var fricVec = maths.factorVector(velocityVector,0.015);
        velocityVector = maths.subVectors(velocityVector,fricVec);
    }
    return velocityVector;
}