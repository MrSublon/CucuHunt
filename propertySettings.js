const imageProperties = {cucumber:{w:995,h:256,src:"cucumber.png",ratio2Screen:0.2},errorShibe:{w:352,h:346,src:"errorShibe.png",ratio2Screen:0.2},
    shiba:{w:321,h:412,src:"shiba.png",ratio2Screen:0.3},shibaWithCucu:{w:321,h:412,src:"shibaWithCucu.png",ratio2Screen:0.2}};

function newVector(x=0,y=0){
    return {x:x,y:y};
}

function newContainer(imageName){ //return definition of image and hit box properties
    let imgvalues;
    try {
        imgvalues = imageProperties[imageName];
    } catch (e){
        imgvalues = imageProperties["errorShibe"];
    }
    let imgWidth= imgvalues.w;
    let imgHeight = imgvalues.h;

    if (Math.max((imgWidth/imgHeight),(imgHeight/imgWidth))>1.5){
        return {img:imgvalues,hitBoxRect:{h:imgHeight,w:imgWidth}}
    } else {
        let radius = Math.min(imgWidth,imgHeight)/2;
        return {img:imgvalues,hitBoxCircle:{r:radius}}
    }
}
function newImage(src,height,width){
    return {src:src,h:height,w:width};
}

module.exports = {
    newImage,
    newContainer,
    newVector
};