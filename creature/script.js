let eyeRadius = 150;
let eyeCenterX, eyeCenterY;
let irisRadius = 50;
let chaosFactor 
let pupilCircles = [];
let splitThreshold = 15;
let splitSpeed = 0.01;
let maxMatters = 200;
let routerWidth, routerHeight, routerX, routerY;
let antennas = [];

//chaosFactor 改成变量，受antenna影响
//pupil spliting受chaosFactor影响
//同时眼球的慌张程度受chaosFactor影响

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent('canvas-container');
  eyeCenterX = width / 2;
  eyeCenterY = height / 2;
  eyeRadius = min(width, height) * 0.3;
  irisRadius = eyeRadius * 0.33;
  routerWidth = width * 0.7;
  routerHeight = height * 0.6;
  routerX = (width - routerWidth) / 2;
  routerY = (height - routerHeight) / 2;
  chaosFactor = 0;
  // Update antennas
  createAntennas();
  // Initialize main pupil
  pupilCircles.push(new PupilCircle(eyeCenterX, eyeCenterY, 25, 0, 0));

}

function draw() {
  background(255);
  
  // Update chaosFactor based on attached antennas
  updateChaosFactor();

  // Handle pupil splitting
  let mainPupil = pupilCircles[0];
  if (mainPupil.r > 5 && random() < splitSpeed * chaosFactor) {
    mainPupil.r *= 0.95; // Gradually shrink main pupil
    if (mainPupil.r < splitThreshold) {
      for (let i = 0; i < int(random(2, 4)); i++) {
        pupilCircles.push(new PupilCircle(eyeCenterX, eyeCenterY, max(5, mainPupil.r * 0.5), random(TWO_PI), random(irisRadius - mainPupil.r)));
      }
    }
  }

  drawRouter();
  drawEye();
  drawAntennas();
}

function drawRouter() {
  push();
  // Main body
  fill(30, 30, 30);
  stroke(0);
  rect(routerX, routerY, routerWidth, routerHeight);
  
  // Front panel (slightly lighter)
  fill(50, 50, 50);
  rect(routerX + 10, routerY + 10, routerWidth - 20, routerHeight - 20);
  
  // LED lights
  for (let i = 0; i < 4; i++) {
    fill(0, 255, 0);
    let ledSize = 10;
    ellipse(routerX + 30 + i * 30, routerY + 20, ledSize);
  }
  
  pop();
}

function drawEye() {
  push();
  fill(255); stroke(0);
  ellipse(eyeCenterX, eyeCenterY, eyeRadius * 2, eyeRadius);

  let irisOffsetX = constrain(map(noise(chaosFactor), 0, 1, -50, 50), -eyeRadius + irisRadius, eyeRadius - irisRadius);
  let irisOffsetY = constrain(map(noise(chaosFactor + 100), 0, 1, -20, 20), -eyeRadius / 2 + irisRadius, eyeRadius / 2 - irisRadius);

  fill(0, 150, 255);
  ellipse(eyeCenterX + irisOffsetX, eyeCenterY + irisOffsetY, irisRadius * 2);

  // Update and display pupil circles
  pupilCircles.forEach(pc => { pc.update(irisOffsetX, irisOffsetY); pc.display(); });
  
  pop();
}

function createAntennas() {
  antennas = []; // Clear existing antennas
  let antennaCount = 4;
  let antennaSize = min(width, height) * 0.05; // Square base size

  // Top antennas
  for (let i = 0; i < antennaCount; i++) {
    let x = width * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(x - antennaSize / 2, 0, x, routerY, antennaSize));
  }
  
  // Bottom antennas
  for (let i = 0; i < antennaCount; i++) {
    let x = width * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(x - antennaSize / 2, height - antennaSize, x, routerY + routerHeight, antennaSize));
  }
  
  // Left antennas
  for (let i = 0; i < antennaCount; i++) {
    let y = height * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(0, y - antennaSize / 2, routerX, y, antennaSize));
  }
  
  // Right antennas
  for (let i = 0; i < antennaCount; i++) {
    let y = height * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(width - antennaSize, y - antennaSize / 2, routerX + routerWidth, y, antennaSize));
  }
}

function drawAntennas(){
  antennas.forEach(a => a.draw());
}
function mousePressed(){
  antennas.forEach(a => {
    if(a.isPointInside(mouseX, mouseY)){
      a.attach();
    }
  });
}

class PupilCircle {
  constructor(x, y, r, angle, distance) {
    this.r = r;
    this.angle = angle;
    this.distance = distance;
    this.x = x;
    this.y = y;
  }

  update(irisOffsetX, irisOffsetY) {
    this.angle += noise(frameCount * 0.01) * 0.05 * chaosFactor;
    this.distance = constrain(this.distance + random(-1, 1) * chaosFactor, 0, irisRadius - this.r);
    this.x = eyeCenterX + irisOffsetX + cos(this.angle) * this.distance;
    this.y = eyeCenterY + irisOffsetY + sin(this.angle) * this.distance;
  }

  display() {
    fill(0); noStroke();
    ellipse(this.x, this.y, this.r * 2);
  }
}

class Antenna {
  constructor(x, y, routerX, routerY, size) {
    // Base
    this.baseX = x;
    this.baseY = y;
    this.baseSize = size;
    
    // Contact point
    this.contactRadius = size * 0.25;
    this.contactX = routerX;
    this.contactY = routerY;
    
    // Wire
    this.wireStartX = this.baseX + this.baseSize / 2;
    this.wireStartY = this.baseY + this.baseSize / 2;
    this.wireEndX = this.contactX;
    this.wireEndY = this.contactY;
    
    this.isAttached = true;
    this.isAnimating = false;
  }

  draw() {
    // Draw base
    fill('gray');
    rect(this.baseX, this.baseY, this.baseSize, this.baseSize);
    
    // Draw wire
    stroke('black');
    line(this.wireStartX, this.wireStartY, this.wireEndX, this.wireEndY);
    
    // Draw contact point
    fill(this.isAttached ? 'green' : 'red');
    ellipse(this.wireEndX, this.wireEndY, this.contactRadius * 2);
  }

  attach() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const targetX = this.isAttached ? this.baseX + this.baseSize / 2 : this.contactX;
    const targetY = this.isAttached ? this.baseY + this.baseSize / 2 : this.contactY;
    
    const animate = () => {
        const dx = targetX - this.wireEndX;
        const dy = targetY - this.wireEndY;
        const distance = dist(this.wireEndX, this.wireEndY, targetX, targetY);
        
        if (distance > 1) {
            this.wireEndX += dx * 0.1;
            this.wireEndY += dy * 0.1;
        } else {
            this.wireEndX = targetX;
            this.wireEndY = targetY;
            this.isAttached = !this.isAttached;
            this.isAnimating = false;
        }
    };
    
    const animationInterval = setInterval(() => {
        animate();
        if (!this.isAnimating) {
            clearInterval(animationInterval);
        }
    }, 16); // 约60fps
  }

  isPointInside(x, y) {
    return dist(x, y, this.wireEndX, this.wireEndY) <= this.contactRadius;
  }
}

function updateChaosFactor() {
  let attachedAntennas = antennas.filter(a => a.isAttached).length;
  chaosFactor = map(attachedAntennas, 0, antennas.length, 0, maxChaosFactor);
}
