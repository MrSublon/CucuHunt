function detectCollision(object1,object2) { //lets one swap between collision types

    var obj1IsCircle = true;
    var obj2IsCircle = true;

    /*
    if (object1.hasOwnProperty("hitBoxCircle")){
        obj1IsCircle = false;
    }
    if (object2.hasOwnProperty("hitBoxCircle")){
        obj2IsCircle = false;
    }
    */

    if(typeof(object1.hitBoxCircle) === "undefined"){
        obj1IsCircle = false;
    }
    if(typeof(object2.hitBoxCircle) === "undefined"){
        obj2IsCircle = false;
    }
    
    if (obj1IsCircle) {
        if (obj2IsCircle) {
            return collisionDetectionCircle(object1, object2);
        }
        return collisionDetectionCircleWithRectangle(object1, object2);
    }
    //object 1 is not a circle
    if (obj2IsCircle) {
        return collisionDetectionCircleWithRectangle(object2, object1);
    }
    return collisionDetectionRectangles(object1, object2);
}  //calls up respective function

function collisionDetectionRectangles(rect1,rect2){  //both objects must contain: posVector with x = x and y = y, w = width, h = height

    var r1x = rect1.posVector.x-rect1.w/2;
    var r1y = rect1.posVector.y-rect1.h/2;
    var r2x = rect2.posVector.x-rect2.w/2;
    var r2y = rect2.posVector.y-rect2.h/2;

    return (r1x < (r2x + rect2.w) &&
            r2x < (r1x + rect1.w) &&
            r1y < (r2y + rect2.h) &&
            r2y < (r1y + rect1.h));
} //compares two rectangles

function collisionDetectionCircle(circle1,circle2) { //both objects must contain: posVector with x = x and y = y, r = radius

    var dx = (circle1.posVector.x - circle2.posVector.x);
    var dy = (circle1.posVector.y - circle2.posVector.y);
    var distance = Math.sqrt(dx*dx + dy * dy);

    return (distance<circle1.r+circle2.r);

} //compares two circles

function collisionDetectionCircleWithRectangle(circle,rect){

    // clamp(value, min, max) - limits value to the range min..max

// Find the closest point to the circle within the rectangle
    var closestX = Math.clamp(circle.posVector.x, rect.posVector.x-rect.w/2, rect.posVector.x+rect.w/2);
    var closestY = Math.clamp(circle.posVector.y, rect.posVector.y-rect.h/2, rect.posVector.y+rect.h/2);

// Calculate the distance between the circle's center and this closest point
    var distanceX = circle.posVector.x - closestX;
    var distanceY = circle.posVector.y - closestY;

// If the distance is less than the circle's radius, an intersection occurs
    var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.r * circle.r);
} //compares circle with rectangle

module.exports = {
    detectCollision
};