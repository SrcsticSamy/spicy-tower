kaboom({
  font: "sinko",
});

loadSprite("robbie", "sprites/robbie.png", {
  sliceX: 9,
  sliceY: 5,
  anims: {
    walk: { from: 36, to: 43 },
    run: { from: 24, to: 26 },
    cheer: {from: 7, to: 8}
  },
});

loadSprite("leftBtn", "sprites/left.png")
loadSprite("rightBtn", "sprites/right.png")
loadSprite("jumpBtn", "sprites/jump.png")

loadSprite("wall", "sprites/wall.png")
loadSprite("platform", "sprites/platform.png")

loadSprite("bg", "sprites/bg.png")


scene("game", () => {
  let playerSpeed = 300;
  let camSpeed = 100;
  let jumpPower = 800;
  let maxSpeed = isTouch() ? 180 : 220;

  // load assets
  add([ sprite("bg", {width: width(), height: height()}), fixed() ])

  const score = add([
    text(`0`, { size: 30 }),
    pos(10, 10),
    fixed(),
    z(50),
    { value: 0 },
  ]);

  add([text(`Score`, { size: 20 }), pos(10, 50), fixed(), z(50)]);


  const speed = add([
    text(`0`, { size: 30 }),
    pos(10, 100),
    fixed(),
    z(50),
    { value: camSpeed },
  ]);

  add([text(`Speed`, { size: 20 }), pos(10, 140), fixed(), z(50)]);


  const fps = add([
    text(debug.fps(), { size: 15 }),
    pos(width()-60, 10),
    fixed(),
    z(100),
    { value: 0 },
  ]);

  const player = add([
    sprite("robbie", { anime: "idle" }),
    pos(width() / 2, height() - 110),
    area(),
    body(),
    z(1000),
    origin("bot"),
    "robbie",
  ]);

  //------------Movement-------------

  //moving right
  onKeyDown("right", () => {
    player.flipX(false);
    player.move(playerSpeed, 0);
    //play the animation so it doesn't get stuck on first fram
    if (player.curAnim() !== "run") {
      player.play("run");
    }
  });

  //return sprite to idle frame
  onKeyRelease("right", () => {
    player.frame = 0;
    player.stop();
  });

  //moving left
  onKeyDown("left", () => {
    player.flipX(true);
    player.move(-playerSpeed, 0);

    if (player.curAnim() !== "run") {
      player.play("run");
    }
  });

  //return sprite to idle frame
  onKeyRelease("left", () => {
    player.frame = 0;
    player.stop();
  });

  //jump if grounded
  onKeyPress("space", () => {
    if (player.isGrounded()) {
      player.jump(jumpPower);
    }
  });

  //reset to idle animation
  player.onGround(() => {
    if (player.curAnim() !== "run") {
      player.frame = 0;
      player.stop();
    }
  });

  //handle jump and fall animation
  player.onUpdate(() => {
    //check if falling to play animation
    if (player.isFalling() && !player.isGrounded()) {
      player.frame = 13;
      player.stop();
    }

    if (!player.isFalling() && !player.isGrounded()) {
      player.frame = 20;
      player.stop();
    }

    if (player.pos.y - 150 > camPos().y + height() / 2) {
      if (score.value > getData("highScore", 0)) {
        setData("highScore", score.value);
      }
      go("lost", score);
    }
  });

  //------------------------------------

  //------------Camera control--------------

  //to make the camera move upwards
  const camObj = add([
    rect(10, 10),
    pos(center()),
    color(0, 0, 0),
    opacity(0),
    origin("center"),
  ]);

  camObj.onUpdate(() => {
    wait(3, () => {
      camObj.move(0, -camSpeed);
    });

    camPos(camObj.pos);
  });
  //----------------------------------------

  //----------------Borders-------------
  //floor

  add([
    rect(width(), 100),
    pos(width()/2, height()),
    area(),
    solid(),
    color(0, 0, 0),
    z(5),
    origin("bot"),
  ]);

  //left border
  add([
    rect(width() / 4, 10000 * height()),
    pos(0, height()),
    area(),
    solid(),
    color(0, 0, 0),
    origin(isTouch() ? "botright" : "bot"),
    z(10000),
    "wall",
  ]);
  //right border
  add([
    rect(width() / 4, 10000 * height()),
    pos(width(), height()),
    area(),
    solid(),
    color(0, 0, 0),
    origin(isTouch() ? "botleft" : "bot"),
    z(10000),
    "wall",
  ]);
  //------------------------------------

  //------------Platforms generate--------------

  //first platform height
  let highestPlatformY = height()-50 ;

  function producePlatforms() {
    const newPlatform = add([
      rect(isTouch()? width()/4 : width()/4 + 50 , 40),
      pos(
        width() / 2 + rand(-width() / 4, width() / 4),
        highestPlatformY - 180 //space between platforms
      ),
      color(randi(10,200), randi(10,200), randi(10,200)),
      area(),
      origin("center"),
      z(100),
      { passed: false },
      "platform",
    ]);

    if (newPlatform.pos.y < highestPlatformY) {
      highestPlatformY = newPlatform.pos.y;
    }
  }

  //create first 10 platforms
  for (let i = 0; i <= 10; i++) {
    producePlatforms();
  }

  onUpdate("platform", (plt) => {

    //display an FPS counter
    fps.text = debug.fps() + "FPS"

    //makes platforms not solid unless player is above them
    plt.solid = player.pos.y < plt.pos.y - 15;

    //handle score
    if (plt.passed === false && player.pos.y < plt.pos.y) {
      plt.passed = true;
      score.value += 10;
      score.text = score.value;
    }

    //destroy unused platforms for performance
    if (plt.pos.y > camPos().y + 500) {
      destroy(plt);
    }
  });

  //----------------------------------------

  const countdown = add([
    text("3", { size: 100 }),
    pos(width() / 2, height() / 2 - 200),
    origin("center"),
    { value: 3 },
  ]);

  loop(1, () => {
    if (countdown.value === 0) {
      destroy(countdown);
    } else {
      countdown.text = countdown.value;
      countdown.value--;
    }
  });

  wait(3, () => {
    loop(0.75, () => {
      producePlatforms();
    });

    loop(10, () => {
      //max speed is 230
      if (camSpeed <= maxSpeed) {
        camSpeed = camSpeed + 20;
        speed.text = camSpeed;
        playerSpeed = playerSpeed + 20;
      }
    });
  });

  onCollide("wall", "robbie", () => {
    // if (!isTouch()) {
      player.doubleJump(800);
    // } else {
    //   player.move(0, 0);
    //   player.frame = 0;
    //   player.stop();
    // }
  });

  //handle touch devices (WIP)
  if (isTouch()) {

    add([
      sprite("jumpBtn"),
      pos(50, height()-10),
      origin("bot"),
      color(WHITE),
      fixed(),
      z(101)
    ])

    add([
      sprite("jumpBtn"),
      pos(width() - 50, height()-10),
      origin("bot"),
      color(WHITE),
      fixed(),
      z(101)

    ])

    const cntrl = add([
      circle(20),
      pos(width() / 2, height() - 250),
      origin("center"),
      opacity(1),
      outline(5),
      fixed(),
    ]);


    onTouchMove((id, p) => {
      if (p.x > 0 && p.x < width() && p.y < height() - 200 && p.y > 0) {
        cntrl.pos.x = p.x - 20;
      }
    });

    //handle jump when lower part of screen is pressed
    onTouchStart((id, p) => {
      if (p.y > height() - 100 && p.x < height()) {
        if (player.isGrounded()) {
          player.jump(jumpPower);
        }
      }
    });

    //reset animation and control thingy
    onTouchEnd(() => {
      cntrl.pos.x = width() / 2;
      player.frame = 0;
      player.stop();
    });

    onUpdate(() => {
      if (cntrl.pos.x > width() / 2) { //run right
        player.flipX(false);
        player.move(playerSpeed, 0);

        if (player.curAnim() !== "run") {
          player.play("run");
        }
      } else if (cntrl.pos.x < width() / 2) { //run left
        player.flipX(true);
        player.move(-playerSpeed, 0);

        if (player.curAnim() !== "run") {
          player.play("run");
        }
      }
    });
  }
});



scene("start", ()=>{
  add([
    sprite("bg", {width: width(), height: height()})
  ])
  

  add([text("SPICY TOWER", { size: isTouch()? width()/10 : 80 }), pos(center()), origin("center")]);

  add([
    text("Click any where to start playing.", { size: isTouch()? width()/20 : 30, width: width() / 1.5 }),
    pos(width() / 2, height() / 2 - 200),
    origin("center"),
  ]);

  const robbie = add([
    sprite("robbie", {anim: "cheer", animSpeed:0.35}),
    pos(center()),
    origin("bot"),
  ])

  onUpdate(()=>{
    if (robbie.curAnim() !== "cheer") {
      robbie.play("cheer");
    }
  })

  onMousePress(() => {
    go("game");
  });

  if(isTouch()){
    onTouchStart(()=>{
      go("game")
    })
  }

})



//game over scene
scene("lost", (score) => {

  add([
    sprite("bg", {width: width(), height: height()})
  ])

  let highScore = 0;

  if (getData("highScore", 0) > score.value) {
    highScore = getData("highScore", 0);
  } else {
    highScore = score.value;
    setData("highScore", score.value);
  }
  add([
    text("Click any where to play again.", { size: isTouch()? width()/20 : 30, width: width() / 2 }),
    pos(width() / 2, height() / 2 - 200),
    origin("center"),
  ]);

  add([text("Game Over", { size: isTouch()? width()/10 : 80 }), pos(center()), origin("center")]);

  add([
    text(`Score: ${score.value}`, { size: isTouch()? width()/20 : 30 }),
    pos(width() / 2, height() / 2 + 100),
    origin("center"),
  ]);

  add([
    text(`Your Highest: ${highScore}`, { size: isTouch()? width()/20 : 30 }),
    pos(width() / 2, height() / 2 + 180),
    origin("center"),
  ]);

  onMousePress(() => {
    go("game");
  });

  if(isTouch()){
    onTouchStart(()=>{
      go("game")
    })
  }
});

go("start");