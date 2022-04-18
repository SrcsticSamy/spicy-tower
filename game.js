kaboom({
  font: "sinko",
  background: [5, 5, 5],
});

loadSprite("robbie", "sprites/robbie.png", {
  sliceX: 9,
  sliceY: 5,
  anims: {
    walk: { from: 36, to: 43 },
    run: { from: 24, to: 26 },
  },
});

scene("game", () => {
  let playerSpeed = 300;
  let camSpeed = 110;
  let jumpPower = 800;

  // load assets

  const score = add([
    text(`0`, { size: 30 }),
    pos(10, 10),
    fixed(),
    z(100),
    { value: 0 },
  ]);

  add([text(`Score`, { size: 20 }), pos(10, 50), fixed(), z(100)]);

  const speed = add([
    text(`Speed: ${camSpeed}`, { size: 30 }),
    pos(width() / 4, 10),
    fixed(),
    { value: camSpeed },
  ]);

  const player = add([
    sprite("robbie", { anime: "idle" }),
    pos(width() / 2, height()-300),
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
    pos(width() / 2, height() / 2 - 200),
    color(0, 0, 0),
    opacity(0),
    origin("center"),
  ]);

  camObj.onUpdate(() => {
    wait(3, () => {
      camObj.move(0, -camSpeed);
    });

    camPos(player.pos);
  });
  //----------------------------------------

  //----------------Borders-------------
  add([
    rect(width(), height()-200),
    pos(0, height() - 300),
    area(),
    solid(),
    color(255, 0, 0),
    origin("topleft"),
  ]);

  //left border
  add([
    rect(width() / 4, 10000 * height()),
    pos(0, height()),
    area(),
    solid(),
    color(0, 0, 0),
    origin("bot"),
    z(10),
    "wall",
  ]);
  //right border
  add([
    rect(width() / 4, 10000 * height()),
    pos(width(), height()),
    area(),
    solid(),
    color(0, 0, 0),
    origin("bot"),
    z(10),
    "wall",
  ]);
  //------------------------------------

  //------------Platforms generate--------------

  //first platform height
  let highestPlatformY = height() - 300;

  function producePlatforms() {
    const newPlatform = add([
      rect(width() / 4, 40),
      pos(
        width() / 2 + rand(-width() / 4, width() / 4), 
        highestPlatformY - 170  //space between platforms
      ),
      area(),
      color(0, 0, 0),
      origin("center"),
      color(rand(10, 255), rand(10, 255), rand(10, 255)),
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
    //makes platforms not solid unless player is above them
    plt.solid = player.pos.y < plt.pos.y;

    //handle score
    if (plt.passed === false && player.pos.y < plt.pos.y) {
      plt.passed = true;
      score.value += 10;
      score.text = score.value;
    }

    //destroy unused platforms for performance
    if (plt.pos.y > camPos().y + 500 ) {
      destroy(plt);
    }
  });

  //----------------------------------------

  const countdown = add([
    text("3", { size: 100 }),
    pos(width()/2, height()/2 - 200),
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
      if (camSpeed <= 210) {
        camSpeed = camSpeed + 20;
        speed.text = "Speed: " + camSpeed;
        playerSpeed = playerSpeed + 20;
      }
    });
  });

  onCollide("wall", "robbie", () => {
    player.doubleJump(800);
  });


  if(isTouch()){

    // const moveRightBtn = add([
    //   rect(width()/4, 50),
    //   pos(width()/2 + 100, height()-50),
    //   origin("center"),
    //   fixed(),
    //   z(1001),
    //   color(0, 0, 255),
    // ])

    // const moveLeftBtn = add([
    //   rect(width()/4, 50),
    //   pos(width()/2, height()-50),
    //   origin("center"),
    //   fixed(),
    //   z(1001),
    //   color(0, 255, 0),
    // ])

    onMouseDown(()=>{
      if(mousePos().x > camPos().x/2 && mousePos().x < camPos().x){
        debug.log("right")
      } else if(mousePos().x < width()/2 && mousePos().x > 0){
        debug.log("left")
      } else debug.log("wrong :(")
    })

  }



});

go("game");





//game over scene
scene("lost", (score) => {
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
});
