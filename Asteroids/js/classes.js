class Ship extends PIXI.Sprite{
    constructor(x=0,y=0){
        super(PIXI.loader.resources["images/ship.png"].texture);
        this.anchor.set(.5,.5);
        this.scale.set(.65);
        this.x = x;
        this.y = y;
        this.directionX = 0;
        this.directionY = 0;
        this.isAlive = true;
    }

    rotate(angle) {
        this.directionX = Math.cos((angle - 90) * (Math.PI / 180));
        this.directionY = Math.sin((angle - 90) * (Math.PI / 180));
    }
}

class Asteroid extends PIXI.Sprite{
    constructor(x=0,y=0){
        super(PIXI.loader.resources["images/asteroid.png"].texture);
        this.anchor.set(.5,.5);
        this.scale.set(.75);
        this.x = x;
        this.y = y;

        this.speed = 2;
        this.isAlive = true;
        this.fwd = getRandomUnitVector();
    }
}

class Bullet extends PIXI.Sprite{
    constructor(x=0,y=0,shipDirectionX,shipDirectionY){
        super(PIXI.loader.resources["images/bullet.png"].texture);
        this.anchor.set(.5,.5);
        this.scale.set(0.4);
        this.x = x;
        this.y = y;

        this.speed = 20;
        this.isAlive = true;
        this.fwd = {x:shipDirectionX,y:shipDirectionY};
    }

    move(dt=1/60){
        this.x += this.fwd.x * this.speed;
        this.y += this.fwd.y * this.speed;
    }
}

class SmallAsteroid extends Asteroid{
    constructor(x=0,y=0){
        super(x, y);
        this.scale.set(.5);
        this.x = x;
        this.y = y;
        this.speed = 3;
        this.isAlive = false;
    }
}