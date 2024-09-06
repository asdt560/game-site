'use strict';



const levelSize = vec2(38, 19); // size of play area
let ship;
let rockHeight;
let rockCounter = 0;
let score = 0;
let rocks = []

const sound_shoot = new Sound([1.8,,205,.02,.03,,1,2.2,18,-13,,,,,,.4,.09,.91,.14])

class Ship extends EngineObject
{
    constructor(pos)
    {
        super(pos, vec2(0.75,3)); // set object position and size
        this.setCollision(); // make object collide
        this.mass = 0; // make object have static physics
        this.weapon = new Weapon(pos, this);
        
    }

    update()
    {
      this.moveInput = vec2((keyIsDown('ArrowRight') - keyIsDown('ArrowLeft'))/2, 
      (keyIsDown('ArrowUp') - keyIsDown('ArrowDown'))/2);
        this.pos = vec2(this.pos.x + this.moveInput.x, this.pos.y + this.moveInput.y)
        if (this.weapon) // update weapon trigger
            this.weapon.triggerIsDown = true;
        
    }
}

class Wall extends EngineObject
{
    constructor(pos, size)
    {
        super(pos, size); // set object position and size

        this.setCollision(); // make object collide
        this.mass = 0; // make object have static physics
        this.color = new Color(0,0,0,0); // make object invisible
    }
}

class Weapon extends EngineObject 
{
    constructor(pos, parent) 
    { 
        super(pos, vec2(.6));

        // weapon settings
        this.fireRate      = 4;
        this.bulletSpeed   = .5;
        this.bulletSpread  = .1;
        this.damage        = 1;

        // prepare to fire
        this.renderOrder = parent.renderOrder + 1;
        this.fireTimeBuffer = this.localAngle = 0;
        this.recoilTimer = new Timer;
        parent.addChild(this, vec2(.6,0));

        // shell effect
    }

    update()
    {
        super.update();

        

        // update recoil
        if (this.recoilTimer.active())
            this.localAngle = lerp(this.recoilTimer.getPercent(), this.localAngle, 0);

        this.mirror = this.parent.mirror;
        this.fireTimeBuffer += timeDelta;
        if (this.triggerIsDown)
        {
            // try to fire
            for (; this.fireTimeBuffer > 0; this.fireTimeBuffer -= 1/this.fireRate)
            {
                sound_shoot.stop()
                // create bullet
                this.localAngle = -rand(.2,.25);
                this.recoilTimer.set(.1);
                const direction = vec2(this.bulletSpeed*this.getMirrorSign(), 0);
                const velocity = direction.rotate(rand(-1,1)*this.bulletSpread);
                new Bullet(this.pos, this.parent, velocity, this.damage);
                sound_shoot.play()
                // spawn shell particle
            }
        }
        else
            this.fireTimeBuffer = min(this.fireTimeBuffer, 0);
    }
}

///////////////////////////////////////////////////////////////////////////////

class Bullet extends EngineObject 
{
    constructor(pos, attacker, velocity, damage) 
    { 
        super(pos, vec2());
        this.color = rgb(1,1,0);
        this.velocity = velocity;
        this.attacker = attacker;
        this.damage = damage;
        this.damping = 1;
        this.gravityScale = 0;
        this.renderOrder = 100;
        this.drawSize = vec2(.2,.5);
        this.range = 5;
        this.setCollision(1,0);
    }

    update()
    {
        // check if hit someone
        engineObjectsCallback(this.pos, this.size, (o)=>
        {
            if (o.isGameObject)
                this.collideWithObject(o)
        });
            
        super.update();

        this.angle = this.velocity.angle();
        this.range -= this.velocity.length();
        if (this.range < 0)
        {

            this.destroy();
        }
    }
    
    collideWithObject(o)
    {
        console.log('collidewithobject', o)
        if (o.isEnemy)
        {
            console.log('isgameobject')
            o.damage(this.damage, this);
            //o.applyForce(this.velocity.scale(.1));
        }
    
        this.kill();
        return 1; 
    }

    collideWithTile(data, pos)
    {
      console.log('collidewithtile')
        if (data <= 0)
            return 0;
            
        destroyTile(pos);
        this.kill();
        return 1; 
    }

    kill()
    {
        if (this.destroyed)
            return;
        this.destroy();

    }
}

class Rock extends EngineObject {
  constructor(pos) {
    super(pos, vec2(0.75, 0.75)); // set object position and size
    this.speed = 0.1;
    this.setCollision()
    this.health = 1
    this.isEnemy = true;
  }

  update() {
    this.pos = vec2(this.pos.x - this.speed, this.pos.y)
  }

  damage(number, source) {
    console.log("hit!")
    this.health -= number
    if(this.health <= 0) {
      this.kill()
    }
    return 1;
  }

  kill() {
    score++;
    this.destroy();
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{

  cameraPos = levelSize.scale(.5); // center camera in level
  canvasFixedSize = vec2(1280, 720); // use a 720p fixed size canvas

  ship = new Ship(vec2(0, 0))

  new Wall(vec2(-.5,levelSize.y/2),vec2(1,100)) // top
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
  
  if(rockCounter === 0 || rockCounter % 60 === 0) {
    rockHeight = Math.floor(Math.random() * (levelSize.x-20)+20)
    new Rock(vec2(levelSize.x, rockHeight))
  }
  rockCounter++
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    drawRect(cameraPos, vec2(100), new Color(.5,.5,.5)); // draw background
    drawRect(cameraPos, levelSize, new Color(.1,.1,.1)); // draw level boundary
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
  drawTextScreen("Score: " + score, vec2(mainCanvasSize.x/2, 30), 50); // show score
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);