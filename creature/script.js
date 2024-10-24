let eyeRadius = 150;
let eyeCenterX, eyeCenterY;
let irisRadius = 50;
let chaosFactor = 0;
let maxChaosFactor = 2;
let pupilCircles = [];
let splitThreshold = 15;
let splitSpeed = 0.01;
let maxMatters = 200;
let routerWidth, routerHeight, routerX, routerY;
let antennas = [];
let minPupilSize = 3;
let maxPupilSize = 20;
let maxPupilCount = 20;
const WIRE_COUNT = 50;
const WIRE_COLOR = '#4a4a4a';
let isRouterOn = false; 
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
  createAntennas();
  pupilCircles.push(new PupilCircle(eyeCenterX, eyeCenterY, 25, 0, 0));
  updateAntennaConnections();
}
function draw() {
  background(220); 
  drawServerRoomBackground();
  updateChaosFactor();
  updatePupils();
  drawRouter();
  drawEye();
  drawAntennas();
  drawRouterSwitch();
}
function drawRouter() {
  push();
  fill(30, 30, 30);
  stroke(0);
  rect(routerX, routerY, routerWidth, routerHeight);
  fill(50, 50, 50);
  rect(routerX + 10, routerY + 10, routerWidth - 20, routerHeight - 20);
  for (let i = 0; i < 4; i++) {
    fill(0, 255, 0);
    let ledSize = 10;
    ellipse(routerX + 30 + i * 30, routerY + 20, ledSize);
  }
  drawRouterSwitch();
  pop();
}
function drawEye() {
  push();
  let maxOffset = eyeRadius - irisRadius;
  let irisOffsetX = map(noise(frameCount * 0.01, 0), 0, 1, -maxOffset, maxOffset) * chaosFactor;
  let irisOffsetY = map(noise(frameCount * 0.01, 100), 0, 1, -maxOffset/2, maxOffset/2) * chaosFactor;
  let irisX = eyeCenterX + irisOffsetX;
  let irisY = eyeCenterY + irisOffsetY;
  fill(220, 220, 230);
  stroke(100, 100, 120);
  strokeWeight(3);
  ellipse(eyeCenterX, eyeCenterY, eyeRadius * 2, eyeRadius * 1.5);
  stroke(100, 100, 120);
  strokeWeight(1);
  fill(180);
  for (let i = 0; i < 8; i++) {
    let angle = i * TWO_PI / 8;
    let screwX = eyeCenterX + cos(angle) * (eyeRadius * 0.9);
    let screwY = eyeCenterY + sin(angle) * (eyeRadius * 0.7);
    ellipse(screwX, screwY, 10, 10);
    line(screwX - 3, screwY, screwX + 3, screwY);
    line(screwX, screwY - 3, screwX, screwY + 3);
  }
  noFill();
  for (let r = eyeRadius * 0.2; r < eyeRadius; r += eyeRadius * 0.1) {
    ellipse(eyeCenterX, eyeCenterY, r * 2, r * 1.5);
  }
  fill(50, 60, 70);
  noStroke();
  ellipse(irisX, irisY, irisRadius * 2);
  stroke(100, 120, 140, 150);
  strokeWeight(1);
  for (let i = 0; i < 360; i += 15) {
    let angle = radians(i);
    line(irisX + cos(angle) * irisRadius * 0.5, irisY + sin(angle) * irisRadius * 0.5,
         irisX + cos(angle) * irisRadius, irisY + sin(angle) * irisRadius);
  }
  noFill();
  stroke(150, 170, 190);
  strokeWeight(2);
  ellipse(irisX, irisY, irisRadius * 2);
  pupilCircles.forEach(pc => { 
    pc.update(irisOffsetX, irisOffsetY); 
    pc.display(); 
  });
  pop();
}
function createAntennas() {
  antennas = []; 
  let antennaCount = 4;
  let antennaSize = min(width, height) * 0.05;
  for (let i = 0; i < antennaCount; i++) {
    let x = width * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(x - antennaSize / 2, 0, x, routerY, antennaSize));
  }
  for (let i = 0; i < antennaCount; i++) {
    let x = width * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(x - antennaSize / 2, height - antennaSize, x, routerY + routerHeight, antennaSize));
  }
  for (let i = 0; i < antennaCount; i++) {
    let y = height * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(0, y - antennaSize / 2, routerX, y, antennaSize));
  }
  for (let i = 0; i < antennaCount; i++) {
    let y = height * (i + 1) / (antennaCount + 1);
    antennas.push(new Antenna(width - antennaSize, y - antennaSize / 2, routerX + routerWidth, y, antennaSize));
  }
}
function drawAntennas(){
  antennas.forEach(a => a.draw());
  if (frameCount % 10 === 0) {
    let attachedAntennas = antennas.filter(a => a.isAttached);
    if (attachedAntennas.length >= 2) {
      for (let i = 0; i < 3; i++) {
        let sourceAntenna = random(attachedAntennas);
        let targetAntenna;
        do {
          targetAntenna = random(attachedAntennas);
        } while (targetAntenna === sourceAntenna);
        sourceAntenna.addBeam(targetAntenna);
      }
    }
  }
}
function mousePressed() {
  let switchX = routerX + routerWidth - 50;
  let switchY = routerY + 20;
  let switchWidth = 30;
  let switchHeight = 15;
  if (mouseX > switchX && mouseX < switchX + switchWidth &&
      mouseY > switchY && mouseY < switchY + switchHeight) {
    isRouterOn = !isRouterOn;
    updateAntennaConnections();
    return; 
  }
  antennas.forEach(a => {
    if (a.isPointInside(mouseX, mouseY)) {
      a.attach();
      updateChaosFactor(); 
    }
  });
}
function updateAntennaConnections() {
  antennas.forEach(antenna => {
    if (isRouterOn && !antenna.isAttached) {
      antenna.attach();
    } else if (!isRouterOn && antenna.isAttached) {
      antenna.attach();
    }
  });
  updateChaosFactor();
}
class PupilCircle {
  constructor(x, y, r, angle, distance) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.angle = angle;
    this.distance = distance;
    this.speed = random(0.02, 0.1);
  }
  update(irisOffsetX, irisOffsetY) {
    this.angle += (noise(this.x * 0.01, this.y * 0.01, frameCount * 0.01) - 0.5) * this.speed * (1 + chaosFactor * 2);
    this.distance = constrain(
      this.distance + random(-2, 2) * chaosFactor,
      0,
      irisRadius - this.r
    );
    this.x = eyeCenterX + irisOffsetX + cos(this.angle) * this.distance;
    this.y = eyeCenterY + irisOffsetY + sin(this.angle) * this.distance;
    this.x += random(-1, 1) * chaosFactor;
    this.y += random(-1, 1) * chaosFactor;
  }
  display() {
    fill(0);
    noStroke();
    ellipse(this.x, this.y, this.r * 2);
    fill(40);
    ellipse(this.x, this.y, this.r * 1.5);
    fill(255, 255, 255, 150);
    ellipse(this.x - this.r * 0.2, this.y - this.r * 0.2, this.r * 0.5);
  }
}
class Antenna {
  constructor(x, y, routerX, routerY, size) {
    this.baseX = x;
    this.baseY = y;
    this.baseSize = size;
    this.contactRadius = size * 0.25;
    this.contactX = routerX;
    this.contactY = routerY;
    this.wireStartX = this.baseX + this.baseSize / 2;
    this.wireStartY = this.baseY + this.baseSize / 2;
    this.wireEndX = this.wireStartX;
    this.wireEndY = this.wireStartY;
    this.isAttached = false;
    this.isAnimating = false;
    this.beamTarget = null;
    this.beamProgress = 0;
    this.beamSpeed = 0.1;
    this.maxBeams = 3;
    this.beams = [];
    this.targetX = this.baseX + this.baseSize / 2;
    this.targetY = this.baseY + this.baseSize / 2;
  }
  draw() {
    fill('gray');
    rect(this.baseX, this.baseY, this.baseSize, this.baseSize);
    stroke('black');
    line(this.wireStartX, this.wireStartY, this.wireEndX, this.wireEndY);
    fill(this.isAttached ? 'green' : 'red');
    ellipse(this.wireEndX, this.wireEndY, this.contactRadius * 2);
    for (let i = this.beams.length - 1; i >= 0; i--) {
      let beam = this.beams[i];
      let beamX = lerp(this.wireEndX, beam.target.wireEndX, beam.progress);
      let beamY = lerp(this.wireEndY, beam.target.wireEndY, beam.progress);
      fill(0, 255, 0, 150);
      noStroke();
      ellipse(beamX, beamY, 5, 5);
      beam.progress += this.beamSpeed;
      if (beam.progress >= 1) {
        this.beams.splice(i, 1);
      }
    }
  }
  attach() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    if (!this.isAttached || isRouterOn) {
      this.targetX = this.contactX;
      this.targetY = this.contactY;
    } else {
      this.targetX = this.baseX + this.baseSize / 2;
      this.targetY = this.baseY + this.baseSize / 2;
    }
    const animate = () => {
      const dx = this.targetX - this.wireEndX;
      const dy = this.targetY - this.wireEndY;
      const distance = dist(this.wireEndX, this.wireEndY, this.targetX, this.targetY);
      if (distance > 1) {
        this.wireEndX += dx * 0.1;
        this.wireEndY += dy * 0.1;
      } else {
        this.wireEndX = this.targetX;
        this.wireEndY = this.targetY;
        this.isAttached = !this.isAttached;
        this.isAnimating = false;
      }
    };
    const animationInterval = setInterval(() => {
      animate();
      if (!this.isAnimating) {
        clearInterval(animationInterval);
      }
    }, 16);
  }
  isPointInside(x, y) {
    return dist(x, y, this.wireEndX, this.wireEndY) <= this.contactRadius;
  }
  setBeamTarget(target) {
    this.beamTarget = target;
    this.beamProgress = 0;
  }
  addBeam(target) {
    if (this.beams.length < this.maxBeams) {
      this.beams.push({ target: target, progress: 0 });
    }
  }
  update() {
    if (isRouterOn) {
      this.isAttached = true;
      this.attachedX = routerX;
      this.attachedY = routerY;
      this.x = lerp(this.x, this.attachedX, 0.1);
      this.y = lerp(this.y, this.attachedY, 0.1);
    } else {
      this.isAttached = false;
    }

  }
}
function updateChaosFactor() {
  let attachedAntennas = antennas.filter(a => a.isAttached).length;
  chaosFactor = map(attachedAntennas, 0, antennas.length, 0, maxChaosFactor);
}
function updatePupils() {
  let attachedAntennas = antennas.filter(a => a.isAttached).length;
  let targetPupilCount = map(attachedAntennas, 0, antennas.length, 1, maxPupilCount);
  targetPupilCount = Math.round(targetPupilCount);
  while (pupilCircles.length < targetPupilCount) {
    let largestPupil = pupilCircles.reduce((a, b) => a.r > b.r ? a : b);
    if (largestPupil.r > minPupilSize * 1.5) { 
      let newSize = largestPupil.r * 0.6; 
      largestPupil.r = newSize;
      for (let i = 0; i < 2; i++) { 
        pupilCircles.push(new PupilCircle(
          largestPupil.x + random(-15, 15),
          largestPupil.y + random(-15, 15),
          newSize,
          random(TWO_PI),
          random(irisRadius - newSize)
        ));
      }
    } else {
      break;
    }
  }
  while (pupilCircles.length > targetPupilCount && pupilCircles.length > 1) {
    let smallestPupils = pupilCircles.sort((a, b) => a.r - b.r).slice(0, 2);
    let newSize = min(sqrt(smallestPupils[0].r * smallestPupils[0].r + smallestPupils[1].r * smallestPupils[1].r), maxPupilSize);
    smallestPupils[0].r = newSize;
    smallestPupils[0].x = (smallestPupils[0].x + smallestPupils[1].x) / 2;
    smallestPupils[0].y = (smallestPupils[0].y + smallestPupils[1].y) / 2;
    pupilCircles = pupilCircles.filter(p => p !== smallestPupils[1]);
  }
  pupilCircles.forEach(p => {
    p.r = constrain(p.r, minPupilSize, maxPupilSize);
  });
  if (pupilCircles.length === 0) {
    pupilCircles.push(new PupilCircle(eyeCenterX, eyeCenterY, 15, 0, 0));
  }
}
function drawServerRoomBackground() {
  stroke(WIRE_COLOR);
  for (let i = 0; i < WIRE_COUNT; i++) {
    let x = map(i, 0, WIRE_COUNT - 1, 0, width);
    let offset = random(-50, 50);
    let thickness = random(3, 8);
    strokeWeight(thickness);
    line(x + offset, 0, x + offset, height);
  }
}
function drawRouterSwitch() {
  let switchX = routerX + routerWidth - 50; 
  let switchY = routerY + 20;
  let switchWidth = 30;
  let switchHeight = 15;
  fill(20, 20, 20);
  stroke(0);
  rect(switchX, switchY, switchWidth, switchHeight, 3);
  if (isRouterOn) {
    fill(0, 255, 0);
    rect(switchX + switchWidth / 2, switchY, switchWidth / 2, switchHeight, 0, 3, 3, 0);
  } else {
    fill(255, 0, 0);
    rect(switchX, switchY, switchWidth / 2, switchHeight, 3, 0, 0, 3);
  }
}
