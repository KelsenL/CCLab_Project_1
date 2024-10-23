let eyeRadius = 150;
let eyeCenterX, eyeCenterY;
let irisRadius = 50;
let chaosFactor = 0;
let maxChaosFactor = 1;
let pupilCircles = [];
let splitThreshold = 15;
let splitSpeed = 0.01;
let maxMatters = 200;
let routerWidth, routerHeight, routerX, routerY;
let antennas = [];
let minPupilSize = 5;
let maxPupilSize = 25;
let maxPupilCount = 10;
const WIRE_COUNT = 50;
const WIRE_COLOR = '#4a4a4a';
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
}
function draw() {
  background(220); 
  drawServerRoomBackground();
  updateChaosFactor();
  updatePupils();
  drawRouter();
  drawEye();
  drawAntennas();
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
  pop();
}
function drawEye() {
  push();
  fill(250, 250, 255);
  stroke(200, 200, 220);
  strokeWeight(2);
  ellipse(eyeCenterX, eyeCenterY, eyeRadius * 2, eyeRadius);
  let maxOffset = eyeRadius - irisRadius;
  let irisOffsetX = map(noise(frameCount * 0.01, 0), 0, 1, -maxOffset, maxOffset) * chaosFactor;
  let irisOffsetY = map(noise(frameCount * 0.01, 100), 0, 1, -maxOffset/2, maxOffset/2) * chaosFactor;
  let irisX = eyeCenterX + irisOffsetX;
  let irisY = eyeCenterY + irisOffsetY;
  drawIris(irisX, irisY, irisRadius);
  pupilCircles.forEach(pc => { 
    pc.update(irisOffsetX, irisOffsetY); 
    pc.display(); 
  });
  pop();
}
function drawIris(x, y, radius) {
  let irisColor = color(100, 150, 200);
  noStroke();
  fill(irisColor);
  ellipse(x, y, radius * 2);
  for (let i = 0; i < 360; i += 10) {
    let angle = radians(i);
    let lineLength = random(radius * 0.5, radius * 0.9);
    stroke(red(irisColor) - 20, green(irisColor) - 20, blue(irisColor) - 20, 100);
    strokeWeight(1);
    line(x + cos(angle) * radius * 0.5, y + sin(angle) * radius * 0.5,
         x + cos(angle) * lineLength, y + sin(angle) * lineLength);
  }
  noFill();
  for (let r = radius; r > radius * 0.6; r -= 3) {
    stroke(0, 0, 0, 5);
    ellipse(x, y, r * 2);
  }
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
function mousePressed(){
  antennas.forEach(a => {
    if(a.isPointInside(mouseX, mouseY)){
      a.attach();
    }
  });
}
class PupilCircle {
  constructor(x, y, r, angle, distance) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.angle = angle;
    this.distance = distance;
    this.baseSpeed = random(0.01, 0.05);
  }
  update(irisOffsetX, irisOffsetY) {
    let currentSpeed = this.baseSpeed * (1 + chaosFactor * 5);
    this.angle += (noise(frameCount * 0.01, this.x, this.y) - 0.5) * currentSpeed;
    this.distance = constrain(this.distance + random(-1, 1) * chaosFactor, 0, irisRadius - this.r);
    this.x = eyeCenterX + irisOffsetX + cos(this.angle) * this.distance;
    this.y = eyeCenterY + irisOffsetY + sin(this.angle) * this.distance;
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
}
function updateChaosFactor() {
  let attachedAntennas = antennas.filter(a => a.isAttached).length;
  chaosFactor = map(attachedAntennas, 0, antennas.length, 0, maxChaosFactor);
}
function updatePupils() {
  pupilCircles = pupilCircles.filter(p => p.r >= minPupilSize);
  let targetPupilCount = map(chaosFactor, 0, 1, 1, maxPupilCount);
  if (pupilCircles.length < targetPupilCount && random() < 0.1 * chaosFactor) {
    let pupilToSplit = random(pupilCircles);
    if (pupilToSplit.r > minPupilSize * 2) {
      let newSize = pupilToSplit.r * 0.7;
      pupilToSplit.r = newSize;
      pupilCircles.push(new PupilCircle(pupilToSplit.x, pupilToSplit.y, newSize, random(TWO_PI), random(irisRadius - newSize)));
    }
  } else if (pupilCircles.length > targetPupilCount && random() < 0.1) {
    let pupil1 = random(pupilCircles);
    let pupil2 = random(pupilCircles.filter(p => p !== pupil1));
    let newSize = min(sqrt(pupil1.r * pupil1.r + pupil2.r * pupil2.r), maxPupilSize);
    pupil1.r = newSize;
    pupilCircles = pupilCircles.filter(p => p !== pupil2);
  }
  if (pupilCircles.length === 0) {
    pupilCircles.push(new PupilCircle(eyeCenterX, eyeCenterY, 25, 0, 0));
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
