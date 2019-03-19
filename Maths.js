Math.clamp = function(value, min, max){
    if(value < min){
        return min;
    }else if(value > max){
        return max;
    }else{
        return value;
    }
}; //definition of a math function named clamp

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

function equalVector(vector1,vector2){
    return vector1.x === vector2.x && vector1.y === vector2.y;
}

module.exports = {
    addVectors,
    subVectors,
    equalVector
};