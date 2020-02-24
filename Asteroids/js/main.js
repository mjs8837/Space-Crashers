"use strict";
const app = new PIXI.Application(window.innerWidth - 25, window.innerHeight - 25, { antialias: true });
const screenWidth = app.view.width;
const screenHeight = app.view.height;
document.body.appendChild(app.view);

window.addEventListener("resize", function () {
    app.renderer.resize(window.innerWidth, window.innerHeight);
})

PIXI.loader.
    add(["images/ship.png", "images/asteroid.png", "images/bullet.png"]).
    on("progress", e => { console.log(`progress=${e.progress}`) }).
    load(setup);

let stage;

let ship, speed = 0, angle = 0;
let keys = {};
let asteroids = [], smallAsteroids = [];
let bullets = [], bulletTimer = 0.35, canFire = true;
let takeDamage = false, lives = 3;
let score = 0, previousScore = 0;
let paused = false;

let shootSound, collisionSound, explosionSound;

let startLifeTimer = false, lifeTimer = 0.5;
let startDisappearTimer = false, disappearTimer = 5;
let immuneTimer = 5, startImmuneTimer = false;
let inMenu = true;

let startPageTitle, controlPageTitle;

let startButton, controlButton, backButton;

let previousScoreLabel;
let shootControl, forwardControl, leftControl, rightControl, ability1, ability2;
let lifeLabel, scoreLabel, abilityCost1, abilityCost2;
let pauseLabel, unPause, menuButton;
let gameOverLabel, gameOverMenu, finalScoreLabel;

let startScene, controlScene, gameScene, gameOverScene, pauseScene;

window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

//Creating a setup function to get the game started
function setup() {
    stage = app.stage;

    startScene = new PIXI.Container();
    stage.addChild(startScene);

    controlScene = new PIXI.Container();
    controlScene.visible = false;
    stage.addChild(controlScene);

    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    pauseScene = new PIXI.Container();
    pauseScene.visible = false;
    stage.addChild(pauseScene);

    shootSound = new Howl({
        src: ['sounds/shotSound.wav']
    });

    collisionSound = new Howl({
        src: ['sounds/collision.wav']
    });

    explosionSound = new Howl({
        src: ['sounds/explosion.wav']
    });

    ship = new Ship(screenWidth / 2, screenHeight / 2);

    for (let i = 0; i < 10; i++) {
        asteroids[i] = new Asteroid(Math.random() * screenWidth / 2, Math.random() * screenHeight);
        gameScene.addChild(asteroids[i]);
    }

    gameScene.addChild(ship);

    createUI();

    app.ticker.add(gameLoop);
}

//Creating a function that takes care of placing all of the labels and buttons, as well as styling them
function createUI() {

    //Creating styles for commonly used types of text
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xadd8e6,
        fontSize: 48,
        fontFamily: "Arial",
        fontStyle: "Italic"
    });

    let labelStyle = new PIXI.TextStyle({
        fill: 0xadd8e6,
        fontSize: 48,
        fontFamily: "Arial",
    });

    let titleStyle = new PIXI.TextStyle({
        fill: 0x0000FF,
        fontSize: 90,
        fontFamily: 'Verdana',
        stroke: 0xFFFFFF,
        strokeThickness: 4
    });

    //Creating labels and buttons for the starting page

    //Creating the title label
    labelCreation(startPageTitle, "Space Crashers", false, undefined, titleStyle, 0.5, 0.5, screenWidth / 2, 100, startScene);

    //Creating the start game button
    labelCreation(startButton, "Start Game", true, startGame, buttonStyle, 0.5, 0.5, screenWidth / 2, screenHeight / 2, startScene);

    //Creating the controls menu button
    labelCreation(controlButton, "Controls", true, checkControls, buttonStyle, 0.5, 0.5, screenWidth / 2, screenHeight / 3.2, startScene);

    //Creating a label for the previous high score using local storage
    //When using the labelCreation method local storage didn't seem to be working properly, so I just went with this
    previousScoreLabel = new PIXI.Text(`High score: ${localStorage.getItem(previousScore)}`);
    previousScoreLabel.style = labelStyle;

    previousScoreLabel.anchor.set(0.5, 0.5);
    previousScoreLabel.x = screenWidth / 2;
    previousScoreLabel.y = screenHeight - screenHeight / 3.3;
    startScene.addChild(previousScoreLabel);

    //Creating labels and buttons for the controls page

    //Creating the label for the controls page title
    labelCreation(controlPageTitle, "Controls", false, undefined, titleStyle, 0.5, 0.5, screenWidth / 2, 150, controlScene);

    //Creating a label for the shoot control
    labelCreation(shootControl, "Shoot: Spacebar", false, undefined, labelStyle, 0, 0, screenWidth / 10, screenHeight / 3, controlScene);

    //Creating a label for the move control
    labelCreation(forwardControl, "Move Forward: W", false, undefined, labelStyle, 0, 0, screenWidth / 10, screenHeight / 2, controlScene);

    //Creating a label for the rotate left control
    labelCreation(leftControl, "Rotate Left: A", false, undefined, labelStyle, 0, 0, screenWidth / 10, screenHeight - screenHeight / 3, controlScene);

    //Creating a label for the rotate right control
    labelCreation(rightControl, "Rotate Right: D", false, undefined, labelStyle, 0, 0, screenWidth / 10, screenHeight - 150, controlScene);

    //Creating a button to go back to the main menu
    labelCreation(backButton, "<-- Back to the main menu", true, mainMenu, buttonStyle, 0, 0, 50, 25, controlScene);

    //Creating a label for the first ability
    labelCreation(ability1, "Gain A Life: Press 1", false, undefined, labelStyle, 0, 0, screenWidth / 2 + 50, screenHeight / 2 - 100, controlScene);

    //Creating a label for the second ability
    labelCreation(ability2, "Invincibility: Press 2", false, undefined, labelStyle, 0, 0, screenWidth / 2 + 50, 3 * screenHeight / 4, controlScene)


    //Creating labels for during the main game

    //Had to leave score and life labels like this so they don't break the game
    //Creating a label to display the lives of the player
    lifeLabel = new PIXI.Text(`Lives: ${lives}`);
    lifeLabel.style = labelStyle;

    lifeLabel.x = 50;
    lifeLabel.y = 50;
    gameScene.addChild(lifeLabel);

    //Creating a label to display the score to the user
    scoreLabel = new PIXI.Text(`Score: ${score}`);
    scoreLabel.style = labelStyle;

    scoreLabel.x = screenWidth - 250;
    scoreLabel.y = 50;
    gameScene.addChild(scoreLabel);

    //Creating a label to display the first ability and its cost to the user
    labelCreation(abilityCost1, "Gain a life: 1000", false, undefined, labelStyle, 0, 0, 50, screenHeight - 100, gameScene);

    //Creating a label to display the second ability and its cost to the user
    labelCreation(abilityCost2, "Invincibility: 500", false, undefined, labelStyle, 1, 0, screenWidth - 50, screenHeight - 100, gameScene);

    //Creating labels for during the pause menu

    //Creating a title label for the pause menu
    labelCreation(pauseLabel, "Paused", false, undefined, titleStyle, 0.5, 0.5, screenWidth / 2, 100, pauseScene);

    //Creating a button to unpause the game
    labelCreation(unPause, "Back to the game", true, resumeGame, buttonStyle, 0.5, 0.5, screenWidth / 2, screenHeight / 3, pauseScene);

    //Creating a button to go back to the main menu
    labelCreation(menuButton, "Main Menu", true, mainMenu, buttonStyle, 0.5, 0.5, screenWidth / 2, screenHeight / 2, pauseScene);


    //Creating labels and buttons for the game over scene

    //Creating a title label for the game over screen
    labelCreation(gameOverLabel, "GAME OVER", false, undefined, titleStyle, 0.5, 0.5, screenWidth / 2, 100, gameOverScene);

    //Creating a button to go back to the main menu from the game over screen
    labelCreation(gameOverMenu, "Main Menu", true, mainMenu, buttonStyle, 0.5, 0.5, screenWidth / 2, screenHeight / 2, gameOverScene);

    //Leaving final score label like this so it doesn't break the game
    //Creating a label for the score
    finalScoreLabel = new PIXI.Text(`Final Score: ${score}`);
    finalScoreLabel.style = labelStyle;

    finalScoreLabel.anchor.set(0.5, 0.5);
    finalScoreLabel.x = screenWidth / 2;
    finalScoreLabel.y = screenHeight / 2 - 200;
    gameOverScene.addChild(finalScoreLabel);
}

//Creating a function that makes a basic label by taking in all necessary information
function labelCreation(name, text, isButton, func, style, anchorX, anchorY, x, y, scene) {
    name = new PIXI.Text(text);
    name.style = style;

    if (isButton) {
        if (func !== undefined) {
            buttonCreation(name, func)
        }
    }
    name.anchor.set(anchorX, anchorY);
    name.x = x;
    name.y = y;
    scene.addChild(name);
}

//Creating a function that makes buttons function in the appropriate way by executing a passed in function when clicked
function buttonCreation(button, func) {
    button.interactive = true;
    button.buttonMode = true;
    button.on("pointerup", func);
    button.on('pointerover', e => e.target.alpha = 0.7);
    button.on('pointerout', e => e.currentTarget.alpha = 1.0);
}

//Creating a function to go to the controls screen when the Controls button is clicked
function checkControls() {
    canFire = false;
    gameScene.visible = false;
    controlScene.visible = true;
    startScene.visible = false;
    gameOverScene.visible = false;
    pauseScene.visible = false;
}

//Creating a function to go back to the main menu when the back to main menu button is clicked
function mainMenu() {
    inMenu = true;
    lives = 3;
    immuneTimer = 3;
    disappearTimer = 3;
    score = 0;
    paused = false;
    takeDamage = false;

    asteroids.length = 0;
    smallAsteroids.length = 0;

    gameScene.visible = false;
    controlScene.visible = false;
    startScene.visible = true;
    gameOverScene.visible = false;
    pauseScene.visible = false;

    canFire = false;
}

//Creating a function to start the game when the Start Game button is clicked
function startGame() {
    inMenu = false;
    startImmuneTimer = true;
    gameScene.visible = true;
    controlScene.visible = false;
    startScene.visible = false;
    gameOverScene.visible = false;
    pauseScene.visible = false;

    immuneTimer = 3;
    disappearTimer = 3;
    lives = 3;
    lifeLabel.text = `Lives: ${lives}`;
    score = 0;
    scoreLabel.text = `Score: ${score}`;
    angle = 0;
    ship.x = screenWidth / 2;
    ship.y = screenHeight / 2;
}

//Creating a function that after being paused, resumes the game
function resumeGame() {
    paused = false;
    startImmuneTimer = true;

    for (let asteroid of asteroids) {
        asteroid.speed = 2;
    }

    for (let smallAsteroid of smallAsteroids) {
        smallAsteroid.speed = 3;
    }

    gameScene.visible = true;
    controlScene.visible = false;
    startScene.visible = false;
    gameOverScene.visible = false;
    pauseScene.visible = false;
}

//Creating a function to go to the game over scene once you run out of lives
function gameOver() {
    if (lives <= 0) {
        ship.isAlive = false;
        gameScene.visible = false;
        controlScene.visible = false;
        startScene.visible = false;
        gameOverScene.visible = true;
        pauseScene.visible = false;
        canFire = false;
        finalScoreLabel.text = `Final Score: ${score}`;

        takeDamage = false;

        //Setting a high score using local storage
        if (score > localStorage.getItem(previousScore)) {
            localStorage.setItem(previousScore, score);
            previousScoreLabel.text = `High score: ${localStorage.getItem(previousScore)}`;
        }

        for (let asteroid of asteroids) {
            asteroid.isAlive = false;
            gameScene.removeChild(asteroid);
            asteroid.speed = 0;
        }

        for (let smallAsteroid of smallAsteroids) {
            smallAsteroid.isAlive = false;
            gameScene.removeChild(smallAsteroid);
            smallAsteroid.speed = 0;
        }
    }
}

//Keyboard functions
function keysDown(e) {
    keys[e.keyCode] = true;
}

function keysUp(e) {
    keys[e.keyCode] = false;
}

//Creating a function to move the ship around the screen
function movement() {
    const maxSpeed = 10;

    // W
    if (keys["87"]) {
        speed += 0.25;
    }

    if (speed > 0) {
        speed -= 0.15;
    }

    if (speed < 0) {
        speed = 0;
    }

    if (speed >= maxSpeed) {
        speed = maxSpeed;
    }

    if (keys["65"]) {
        angle -= 1.75;
    }

    if (keys["68"]) {
        angle += 1.75;
    }

    ship.rotate(angle);

    ship.rotation = (angle * (Math.PI / 180));
    ship.x += ship.directionX * speed;
    ship.y += ship.directionY * speed;
}

//Creating a function to keep the ship in the bounds of the screen
function bounds() {
    if (ship.x > screenWidth) {
        ship.x = 0;
    }

    if (ship.x < 0) {
        ship.x = screenWidth;
    }

    if (ship.y > screenHeight) {
        ship.y = 0;
    }

    if (ship.y < 0) {
        ship.y = screenHeight;
    }
}

//Creating a function to move the asteroids (big and small) and keep them within the screen
function asteroidMove() {
    for (let i = 0; i < asteroids.length; i++) {

        asteroids[i].x += asteroids[i].speed * asteroids[i].fwd.x;
        asteroids[i].y += asteroids[i].speed * asteroids[i].fwd.y;

        if (asteroids[i].x > screenWidth) {
            asteroids[i].fwd.x = -asteroids[i].fwd.x;
        }

        if (asteroids[i].x < 0) {
            asteroids[i].fwd.x = -asteroids[i].fwd.x;
        }

        if (asteroids[i].y > screenHeight) {
            asteroids[i].fwd.y = -asteroids[i].fwd.y;
        }

        if (asteroids[i].y < 0) {
            asteroids[i].fwd.y = -asteroids[i].fwd.y;
        }

        if (asteroids[i].x > screenWidth + 5 || asteroids[i].x < -5 || asteroids[i].y > screenHeight + 5 || asteroids[i].y < - 5) {
            asteroids[i].isAlive = false;
            gameScene.removeChild(asteroids[i]);
        }
    }

    for (let i = 0; i < smallAsteroids.length; i++) {

        smallAsteroids[i].x += smallAsteroids[i].speed * smallAsteroids[i].fwd.x;
        smallAsteroids[i].y += smallAsteroids[i].speed * smallAsteroids[i].fwd.y;

        if (smallAsteroids[i].x > screenWidth) {
            smallAsteroids[i].fwd.x = -smallAsteroids[i].fwd.x;
        }

        if (smallAsteroids[i].x < 0) {
            smallAsteroids[i].fwd.x = -smallAsteroids[i].fwd.x;
        }

        if (smallAsteroids[i].y > screenHeight) {
            smallAsteroids[i].fwd.y = -smallAsteroids[i].fwd.y;
        }

        if (smallAsteroids[i].y < 0) {
            smallAsteroids[i].fwd.y = -smallAsteroids[i].fwd.y;
        }

        if (smallAsteroids[i].x > screenWidth + 5 || smallAsteroids[i].x < -5 || smallAsteroids[i].y > screenHeight + 5 || smallAsteroids[i].y < -5) {
            smallAsteroids[i].isAlive = false;
            gameScene.removeChild(smallAsteroids[i]);
        }
    }
}

//Creating a function to create the bullets just in front of the ship
function fireBullets() {
    if (canFire) {
        if (keys["32"]) {
            let bullet = new Bullet(ship.x, ship.y + ship.directionY, ship.directionX, ship.directionY);
            bullets.push(bullet);
            gameScene.addChild(bullet);
            shootSound.play();
            canFire = false;
        }
    }

    else {
        bulletTime();
    }
}

//Creating a function to move bullets up the screen using the bullet class move method
function moveBullets() {
    let dt = 1 / app.ticker.FPS;

    for (let bullet of bullets) {
        bullet.move(dt);
    }
}

//Creating a function to use the helper collision detection method in utility.js
function checkBulletCollisions() {
    for (let asteroid of asteroids) {
        for (let bullet of bullets) {
            if (rectsIntersect(asteroid, bullet)) {
                let smallAsteroid1 = new SmallAsteroid(asteroid.x, asteroid.y);
                smallAsteroids.push(smallAsteroid1);
                smallAsteroid1.isAlive = true;
                gameScene.addChild(smallAsteroid1);

                let smallAsteroid2 = new SmallAsteroid(asteroid.x, asteroid.y);
                smallAsteroids.push(smallAsteroid2);
                smallAsteroid2.isAlive = true;
                gameScene.addChild(smallAsteroid2);

                gameScene.removeChild(asteroid);
                asteroid.isAlive = false;

                gameScene.removeChild(bullet);
                bullet.isAlive = false;

                explosionSound.play();

                increaseScoreBy(50);
            }
        }
    }

    for (let smallAsteroid of smallAsteroids) {
        for (let bullet of bullets) {
            if (rectsIntersect(smallAsteroid, bullet)) {
                gameScene.removeChild(smallAsteroid);
                smallAsteroid.isAlive = false;

                gameScene.removeChild(bullet);
                bullet.isAlive = false;

                explosionSound.play();

                increaseScoreBy(100);
            }
        }
    }
}

function checkShipCollisions() {
    for (let asteroid of asteroids) {
        if (rectsIntersect(ship, asteroid)) {
            if (!inMenu) {
                gameScene.removeChild(asteroid);
                asteroid.isAlive = false;
                ship.x -= 50 * ship.directionX;
                ship.y -= 50 * ship.directionY;
                speed = 0;
                collisionSound.play();
                decreaseLifeBy(1);
                startImmuneTimer = true;
            }
        }
    }

    for (let smallAsteroid of smallAsteroids) {
        if (rectsIntersect(ship, smallAsteroid)) {
            if (!inMenu) {
                gameScene.removeChild(smallAsteroid);
                smallAsteroid.isAlive = false;
                ship.x -= 25 * ship.directionX;
                ship.y -= 25 * ship.directionY;
                speed = 0;
                collisionSound.play();
                decreaseLifeBy(1);
                startImmuneTimer = true;
            }
        }
    }
}

//Creating a cleanup function to remove any "dead" objects from the screen or remove bullets off the screen
function cleanup() {
    for (let bullet of bullets) {
        if (bullet.x > screenWidth || bullet.y > screenHeight) {
            gameScene.removeChild(bullet);
            bullet.isAlive = false;
        }
    }

    bullets = bullets.filter(bullet => bullet.isAlive);
    asteroids = asteroids.filter(asteroid => asteroid.isAlive);
    smallAsteroids = smallAsteroids.filter(smallAsteroid => smallAsteroid.isAlive);

    if (inMenu) {
        for (let asteroid of asteroids) {
            gameScene.removeChild(asteroid);
            asteroid.isAlive = false;
        }

        for (let smallAsteroid of asteroids) {
            gameScene.removeChild(smallAsteroid);
            smallAsteroid.isAlive = false;
        }
    }
}

//Creating a function that adds asteroids back to the screen if there are not enough on the screen
function addAsteroids() {
    if (asteroids.length < 10) {
        let asteroid = new Asteroid(Math.random() * screenWidth, Math.random() * screenHeight);
        asteroids.push(asteroid);
        gameScene.addChild(asteroid);
    }
}

//Creating a function that limits the user from spamming the fire key
function bulletTime() {
    bulletTimer -= 1 / app.ticker.FPS;

    if (bulletTimer <= 0) {
        bulletTimer = 0.35;
        canFire = true;
    }
}

//Creating a function to manage the loss of lives
function decreaseLifeBy(value) {
    lives -= value;
    lives = parseInt(lives);
    lifeLabel.text = `Lives: ${lives}`;
}

//Creating a function to add lives back
function increaseLifeBy(value) {
    lives += value;
    lives = parseInt(lives);
    lifeLabel.text = `Lives: ${lives}`;
}

//Creating a function to add to score
function increaseScoreBy(value) {
    score += value;
    score = parseInt(score);
    scoreLabel.text = `Score: ${score}`;
}

//Creating a function to decrease score
function decreaseScoreBy(value) {
    score -= value;
    score = parseInt(score);
    scoreLabel.text = `Score: ${score}`;
}

//Creating a function that takes care of pausing the game
function pauseGame() {
    if (!startScene.visible && !controlScene.visible) {
        if (keys["27"]) {
            paused = true;
        }

        if (paused) {
            canFire = false;
            speed = 0;
            angle = angle;
            startImmuneTimer = false;

            for (let asteroid of asteroids) {
                asteroid.speed = 0;
            }

            for (let smallAsteroid of smallAsteroids) {
                smallAsteroid.speed = 0;
            }

            for (let bullet of bullets) {
                bullet.speed = 0;
            }

            gameScene.visible = false;
            controlScene.visible = false;
            startScene.visible = false;
            gameOverScene.visible = false;
            pauseScene.visible = true;
        }
    }

    else {
        paused = false;
        canFire = false;
    }
}

//Creating a function to add a life to the user if their score permits it
function gainALife() {
    if (score >= 1000) {
        if (keys["49"]) {
            startLifeTimer = true;
        }
    }

    if (startLifeTimer) {
        lifeTimer -= 1 / app.ticker.FPS;

        if (lifeTimer <= 0) {
            increaseLifeBy(1);
            decreaseScoreBy(1000);
            startLifeTimer = false;
            lifeTimer = 0.5;
        }
    }
}

//Creating a function to add the ability to become invincible if their score permits it
function invincibility() {
    if (score >= 500) {
        if (keys["50"]) {
            if (!startLifeTimer && !startImmuneTimer) {
                ship.alpha = 0.5;
                startDisappearTimer = true;
                angle = angle;
                takeDamage = false;
                canFire = false;
            }
        }
    }

    if (startDisappearTimer) {
        disappearTimer -= 1 / app.ticker.FPS;

        if (disappearTimer <= 0) {
            ship.alpha = 1.0;
            decreaseScoreBy(500);
            startDisappearTimer = false;
            disappearTimer = 3;
            takeDamage = true;
            canFire = true;
        }
    }
}

//Creating a function to start off with invincibility and get it after you die
function startInvincibility() {
    if (startImmuneTimer) {
        ship.alpha = 0.5;
        angle = angle;
        takeDamage = false;
        canFire = false;
        immuneTimer -= 1 / app.ticker.FPS;

        if (immuneTimer <= 0) {
            ship.alpha = 1.0;
            startImmuneTimer = false;
            immuneTimer = 3;
            takeDamage = true;
            canFire = true;
        }
    }
}

//Creating a gameLoop to run through the main game
function gameLoop() {
    movement();
    bounds();
    asteroidMove();
    fireBullets();
    moveBullets();
    checkBulletCollisions();

    if (takeDamage) {
        checkShipCollisions();
    }

    cleanup();
    addAsteroids();
    pauseGame();
    gameOver();
    gainALife();
    invincibility();
    startInvincibility();
}