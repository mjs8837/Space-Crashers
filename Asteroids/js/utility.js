//Collision detection method using AABB method
function rectsIntersect(a,b){
    let ab = a.getBounds();
    let bb = b.getBounds();
    return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
}

//Getting a random direction vector
function getRandomUnitVector(){
    let x = getRandom(-1,1);
    let y = getRandom(-1,1);
    let length = Math.sqrt(x*x + y*y);
    if(length == 0){ // very unlikely
        x=1; // point right
        y=0;
        length = 1;
    } else{
        x /= length;
        y /= length;
    }

    return {x:x, y:y};
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}