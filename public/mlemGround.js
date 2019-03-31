const socket = io();
//--------------------------------------------------Elements--------------------------------------------------//
const canvasElem = document.querySelector('#canvas');
const ctx = canvasElem.getContext('2d');
const cursorElem = document.querySelector('#cursorElem');
const shibaElem = document.querySelector('#shibas');
var clientElem; //needed to play game offline
var clientImgElem;

//game
//collision padding px
var wallCollisionPadding = 0;
var wallColSFX;

// SFX
//make yellow
const parentSFX = "SFX/";
var currentBarks = {};

const imageProperties = {cucumber:{w:995,h:256,src:"cucumber.png",ratio2Screen:0.2},errorShibe:{w:352,h:346,src:"errorShibe.png",ratio2Screen:0.2},
    shiba:{w:321,h:412,src:"shiba.png",ratio2Screen:0.2},shibaWithCucu:{w:321,h:412,src:"shibaWithCucu.png",ratio2Screen:0.2}};
const toggleText = {LMB:["Bark!","Place Cucumber"],keyM:["Mute Music","Mute SFX"]};

var i = 0; //outside variable for testing

var soundFile;
var theme = ["Athletic Theme - Super Mario World.mp3","Main Theme - Super Smash Bros. Brawl.mp3","Sonic the Hedgehog - Green Hill Zone Theme.mp3"];
var selTheme = "";
var hypelevel = 1;
var barksAccepted = true;
var shibaMoved = {lastMoved:0,isMoving:false};

var keysdown = {}; //stores false and true values of keys pressed
var particles = []; //stores all particles affected by players
var clientPlayer = {posVector:{x:0,y:0},velVector:{x:0,y:0},container:{img:imageProperties["shiba"],hitBoxCircle:{r:5}, mass:5},maxSpeed:0.01, name:"xXxTremGamerxXx", health:3};

var otherplayers = {}; //stores all players

var cursorPos = {x:0,y:0};
var field = {x:0,y:0};
const zeroVector = {x:0,y:0};
const serverResolution = {x:3,y:2};

// window.addEventListener("load", setup);
function setup(socketID){ //setup function is called when HTML was loaded successfully

    console.log("Henlo World!");

    updateCanvasSize();

    //wall Collision Settings
    wallCollisionPadding = ((field.x+field.y) / 2)/200;
    wallColSFX = document.createElement("audio");
    wallColSFX.src = parentSFX + "emerald 0007 - Wall Bump Obstruction.mp3";

    soundFile = document.createElement("audio");
    soundFile.preload = "auto";

    selTheme = theme[0];
    soundFile.src = parentSFX + selTheme;
    soundFile.autoplay = "autoplay";
    soundFile.loop = "loop";
    soundFile.playbackRate = 1;
    //soundFile.muted = true;

    setupShibeHTML(socketID,clientPlayer.name,clientPlayer.container.img.src);
    console.log("setting up.");

    clientElem = document.getElementById(socketID);
    clientImgElem = clientElem.getElementsByClassName("cursor")[0];

    socket.on('sendCoordinates',function(elements, parentDivID) {

        updatePositions(elements,parentDivID);

    });
}

socket.on('setupClient',function(id){
    setup(id);
});

function updatePositions(elem,parentDivID) { //every element must have a key with posVector:x,y and container:img:w,h

    for (let key in elem) {
        let currentElem = elem[key];
        var imgWidth = 0;
        var imgHeight = 0;

        currentElem = convertElementToClientResolution(currentElem);

        imgWidth = currentElem.container.img.w * currentElem.container.img.ratio2Screen;
        imgHeight = currentElem.container.img.h * currentElem.container.img.ratio2Screen;

        if (key === socket.id){
            //update Client Container
            clientPlayer.container = currentElem.container;
            clientImgElem.src = clientPlayer.container.img.src;
            clientImgElem.style.width = clientPlayer.container.img.w;
            clientImgElem.style.height = clientPlayer.container.img.h;
        }

        let x = (currentElem.posVector.x - (currentElem.container.img.w * currentElem.container.img.ratio2Screen / 2));
        let y = (currentElem.posVector.y - (currentElem.container.img.h * currentElem.container.img.ratio2Screen / 2));

        var elementDOM = document.getElementById(key);

        //CREATES NECESSARY ELEMENTS IF NEEDED
        if (elementDOM === null) {
            if (parentDivID === "shibas") {
                let imageSource = currentElem.container.img.src;
                setupShibeHTML(key,currentElem.name,imageSource);
            } else if (parentDivID === "cucumbers") {
                setupCucuHTML(key,currentElem.container.img.src);
            }
            elementDOM = document.getElementById(key);
        }

        if (parentDivID === "shibas"){
            let cursorImg = elementDOM.getElementsByClassName("cursor")[0];

            if (!(socket.id === key)) {
                elementDOM.style.transform = "translate(" + x + "px, " + y + "px)";
            }
            let nameElem = elementDOM.getElementsByClassName("gamerTag")[0];
            nameElem.style.transform = "translate(" + -(imgWidth/2) + "px, " + (imgHeight) + "px)";

            cursorImg.style.width = `${imgWidth}px`;
            cursorImg.style.height = `${imgHeight}px`;

            //check if dog is barking and transforms its position
            if (elementDOM.getElementsByClassName("arf").length === 1) {

                let arfElem = elementDOM.getElementsByClassName("arf")[0];

                let arfX = getRandomNumber(-2,2)+imgWidth/2;
                let arfY = getRandomNumber(-2,2)-imgHeight/2;

                console.log(arfX,arfY);

                arfElem.style.transform = "translate("+arfX+"px, " + arfY + "px)";
                // YES, the child element is inside the parent
            }
        }

        if (parentDivID === "cucumbers"){
            elementDOM.style.transform = "translate(" + x + "px, " + y + "px)";
        }
    }
}

document.addEventListener('mousedown',function(e){
    if (keysdown["ControlLeft"]){
        let fricVec = {x:e.offsetX,y:e.offsetY};
        let relVector = makeRelativeVector(fricVec);
        socket.emit('placeCucumber',relVector);
    } else {
        colorButton("LMB-tooltip",true);
        socket.emit('arf',e);
    }
});

document.addEventListener('mouseup',function(e){
    colorButton("LMB-tooltip",false);
});

document.addEventListener('keyup',function (event) {

    keysdown[event] = false;
    if (event.code === "ControlLeft"){
        colorButton("Ctrl-tooltip",false);
        toggleHTMLTooltips(false);
        keysdown[event.code] = false;
        socket.emit('isHunting',true);
    }
    if(event.code ==="KeyN"){
        colorButton("N-tooltip",false);
    }
});

document.addEventListener('keydown',function(event){

    keysdown[event.code] = !keysdown[event.code];

    if (event.code === "ControlLeft"){
        colorButton("Ctrl-tooltip",true);
        toggleHTMLTooltips(true);
        socket.emit('isHunting',false);
    }
    if (event.code === "KeyC"){
        socket.emit('dropChildNode',"cucumbers");
    }

    if (event.code === "KeyM"){ //Mute music track
        if (keysdown["ControlLeft"]) {
            colorButton("M-tooltip",barksAccepted);
            barksAccepted = !barksAccepted;
        }else {
            colorButton("M-tooltip", !soundFile.muted);
            soundFile.muted = !soundFile.muted;
        }
    }
    if (event.code === "KeyN"){ //Change music track
        colorButton("N-tooltip",true);
        let index = (theme.indexOf(selTheme)+1)%theme.length;
        selTheme = theme[index];
        soundFile.src = parentSFX + selTheme;
        soundFile.playbackRate = hypelevel;
    }
    if (event.code === "KeyS"){
        if (!keysdown[event.code]){
            console.log("1");
            changeHypeLevel(1.5,0.01,20);
        }
        else {
            console.log("2");
            changeHypeLevel(0.5,0.01,20);
        }
    }
});

function toggleHTMLTooltips(on=true){
    let index;
    if (on){
        index = 1;
        colorButton("M-tooltip",!barksAccepted);
    }
    else {
        index = 0;
        colorButton("M-tooltip",soundFile.muted);
    }
    console.log(toggleText["LMB"]);
    document.getElementById("toggle-LMB").innerText = toggleText["LMB"][index];
    document.getElementById("toggle-M").innerText = toggleText["keyM"][index];

}

canvasElem.addEventListener('touchmove',setMouseCoordinates);

canvasElem.addEventListener('mousemove',setMouseCoordinates);

window.addEventListener('resize',updateCanvasSize);


function colorButton(key,pressed){
    let keyElem = document.getElementById(key);
    if (pressed){
        keyElem.style.transitionDuration = "0.05s";
        keyElem.style.backgroundColor = "rgba(250,150,90,0.2)";
        return;
    }
    keyElem.style.transitionDuration = "0.05s";
    keyElem.style.backgroundColor = "rgba(0,0,0,0.03)";
}

function updateCanvasSize(){ //takes window properties and sets canvas to its size
    field.x = window.innerWidth;
    field.y = window.innerHeight;

    canvasElem.style.width = field.x + "px";
    canvasElem.style.height = field.y + "px";
}

socket.on('dropLastChild',function(parentID) {
    dropLastChildNode(parentID);
});

function dropLastChildNode(parentID){
    var parent = document.getElementById(parentID);
    if (parent.hasChildNodes()) {
        var lastChild = parent.lastChild;
        parent.removeChild(lastChild);
    }
}

function setMouseCoordinates(e){
    e.preventDefault();

    if (e.type === "touchmove"){

        cursorPos = {x:e.targetTouches[0].clientX,y:e.targetTouches[0].clientY};

        if (e.targetTouches[1] !== undefined){
            socket.emit('arf',e);
        }
    } else if (e.type === "mousemove"){

        cursorPos = {x:e.offsetX,y:e.offsetY};
    }
    cursorElem.style.transform = "translate(" + cursorPos.x + "px, " + cursorPos.y + "px)";
}

setInterval(moveHandler,1000/200);

function moveHandler(){

    if (equalVector(clientPlayer.posVector,cursorPos)) {
        if (shibaMoved.isMoving === true){
            var time = new Date();
            shibaMoved.isMoving = false;
            shibaMoved.lastMoved = time.getSeconds();
        }

        return;
    } //only surpasses if vectors are unequal

    let cliPos = clientPlayer.posVector;
    let distance = distanceOfVectors(cursorPos, cliPos, true);

    let maxDistance = distanceOfVectors(field,zeroVector)*clientPlayer.maxSpeed;

    if (distance<=maxDistance) {
        distance = maxDistance} //caps distance at max speed of player

    clientPlayer.velVector = subVectors(cursorPos,cliPos);
    clientPlayer.velVector = factorVector(clientPlayer.velVector,maxDistance/distance);

    cliPos = clientPlayer.posVector = addVectors(cliPos,clientPlayer.velVector);

    let imgPos = factorVector({x:clientPlayer.container.img.w,y:clientPlayer.container.img.h},clientPlayer.container.img.ratio2Screen);
    //let imgPos = {x:clientPlayer.container.img.w,y:clientPlayer.container.img.h};

    clientElem.style.transform = "translate(" + (cliPos.x - imgPos.x/2) + "px, " + (cliPos.y - imgPos.y/2)+ "px)";


    if (hasCollidedWithWall(cliPos)){
        wallColSFX.play();
    }

    let relCliPos = makeRelativeVector(cliPos);

    if (shibaMoved.isMoving === false){
        if (barksAccepted) {
            var time = new Date();
            var dif = time.getSeconds() - shibaMoved.lastMoved;
            console.log(dif);
            if (dif > 1) {
                movingSFX();
            }
        }
        shibaMoved.isMoving = true;
    }

    //console.log(relCliPos);
    socket.emit('sent values',relCliPos);
}

socket.on('removePlayer',function(socketID){

    var child = document.getElementById(socketID);
    child.parentElement.removeChild(child);

});

socket.on('someArf',function(bark,socketID){
    if (barksAccepted) {
        let audio = new Audio(bark);
        audio.playbackRate = hypelevel;

        if (currentBarks[socketID] == null) { //currentBarks[socketID]=="" || currentBarks[socketID]=='null'
            currentBarks[socketID] = {audio: audio};
        }
        if (currentBarks[socketID].audio.paused) {
            currentBarks[socketID] = {audio: audio};
            currentBarks[socketID].audio.play();

            //create image with bark
            let thisShibeBarkes = document.getElementById(socketID);

            currentBarks[socketID].audio.addEventListener('loadedmetadata', function () {
                var arfElem = document.createElement("img");
                let imageElem = thisShibeBarkes.getElementsByClassName("cursor")[0];

                arfElem.className = "arf";

                let duration = audio.duration;

                //arfElem.style.transitionTimingFunction = "ease-in-out";
                //arfElem.style.transitionDuration = `${duration}s`;
                arfElem.style.width = `${((field.x + field.y) / 2) / 10}px`;
                arfElem.style.height = "auto";

                let posX = imageElem.clientWidth/2;
                let posY = -imageElem.clientHeight/2;

                arfElem.style.transform = "translate(" + posX + "px, " + posY + "px)";
                //arfElem.style.transform = `scaleY${1.5}`;
                arfElem.src = "bark.png";

                thisShibeBarkes.appendChild(arfElem);

                var animateBark = setInterval(function () {
                    if (currentBarks[socketID].audio.currentTime >= duration) {
                        arfElem.remove();
                        clearInterval(animateBark);
                    }
                }, 10);
            });
        }
    }
});

//socket.on('onconnect',setup(id));

socket.on('test123',function(){
    console.log("test123");
});

function movingSFX(){
        let sanicSFX = new Audio();
    sanicSFX.src = "SFX/Sonic - Roll Charge sound effect.mp3";
    sanicSFX.play();
}

function hasCollidedWithWall(vector){ //checks if object collides with wall and set padding
    if (vector.x>(field.x - wallCollisionPadding) || vector.x < wallCollisionPadding){
        return true;
    }
    if (vector.y>(field.y - wallCollisionPadding) || vector.y < wallCollisionPadding){
        return true;
    }
    return false;
}

function changeHypeLevel(level,rate,timeout){
    hypelevel = level;

    var slowly = setInterval(function(){

        soundFile.playbackRate = soundFile.playbackRate-((1-hypelevel)*rate);

        if (hypelevel<1){
            if (soundFile.playbackRate<hypelevel){
                clearInterval(slowly);
                console.log("cleared1.");
            }
        } else {
            if (soundFile.playbackRate>hypelevel){
                clearInterval(slowly);
                console.log("cleared2.");
            }
        }
    },timeout)
}

function calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(y2-y1,2)+Math.pow(x2-x1,2));
}

function distanceOfVectors(vector1, vector2, calcInRelationToServer = false){

    let yMod = 1;
    let xMod = 1;
    if (calcInRelationToServer === true){
        xMod = (serverResolution.x/serverResolution.y) / (field.x/field.y);
        yMod = (serverResolution.y/serverResolution.x) / (field.y/field.x);
    }
    return Math.sqrt(Math.pow((vector2.y-vector1.y) * yMod,2)+Math.pow((vector2.x-vector1.x) * xMod,2));
}

function addVectors(vector1, vector2){
    let x = vector1.x +vector2.x;
    let y = vector1.y + vector2.y;
    return {x:x,y:y};
}

function subVectors(vector1,vector2){
    let x = vector1.x - vector2.x;
    let y = vector1.y - vector2.y;
    return {x:x,y:y};
}

function factorVector(vector, factor, factorIsVector=false){
    let x;
    let y;
    if (factorIsVector){
        x = vector.x * factor.x;
        y = vector.y * factor.y;
    } else {
        x = vector.x * factor;
        y = vector.y * factor;
    }
    //console.log("vX,vY,factor, respX,respY: ",vector.x,vector.y,factor, x,y);
    return {x:x,y:y};
}

function equalVector(vector1,vector2){
    return vector1.x === vector2.x && vector1.y === vector2.y;
}

Math.clamp = function(value, min, max){
    if(value < min){
        return min;
    }else if(value > max){
        return max;
    }else{
        return value;
    }
}; //definition of a math function named clamp

function makeRelativeVector(vector){
    let x = vector.x/field.x;
    let y = vector.y/field.y;
    return {x:x,y:y}
}

function convertElementToClientResolution(element,reverse=false){
    let fieldX = field.x;
    let fieldY = field.y;
    if (reverse){
        fieldX = 1/field.x;
        fieldY = 1/field.y;
        field = {x:fieldX,y:fieldY}; //places inverted values
    }

    if (element.hasOwnProperty("posVector")) {
        //console.log(element.posVector);
        element.posVector = factorVector(element.posVector,field,true);
        //return element;
    }
    /*
    if (element.hasOwnProperty("velVector")){
        element.velVector.x *= fieldX;
        element.velVector.y *= fieldY;
    }
    if (element.hasOwnProperty("accVector")) {
        element.accVector.x *= fieldX;
        element.accVector.y *= fieldY;
    }
    */

    //console.log(element);
    return element;
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
        end = new Date().getTime();
    }
}

function setupShibeHTML(playerID,name,imageSrc){
    var parentID = document.getElementById("shibas");
    //console.log(parentID);
    let playerDiv = document.createElement("div");
    let newImg = document.createElement("img");
    let nameDiv = document.createElement("div");

    playerDiv.appendChild(newImg);
    playerDiv.appendChild(nameDiv);
    parentID.appendChild(playerDiv);

    newImg.className = "cursor";
    newImg.alt = "cursor";
    newImg.src = imageSrc;

    nameDiv.innerText = name;
    nameDiv.className = "gamerTag";

    playerDiv.id = playerID;
}

function setupCucuHTML(cucuID,imageSrc){
    var parentID = document.getElementById("cucumbers");
    //console.log(parentID);
    let cucuDiv = document.createElement("div");
    let newImg = document.createElement("img");

    cucuDiv.appendChild(newImg);
    parentID.appendChild(cucuDiv);

    newImg.className = "cucu";
    newImg.alt = "cucu";
    newImg.src = imageSrc;
    cucuDiv.id = cucuID;
}

function getRandomNumber(min,max){
    return Math.random()*(max-min)+min;
}