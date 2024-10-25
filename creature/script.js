//This version is the updated version after getting feedback from presentation day
//I use a lot of arrow functions and short if statement to make the code more concise and readable
//for more advanced grammars, I've added comments to explain some of the code
let eyeRadius = 150;
let eyeCenterX, eyeCenterY;
let irisRadius = 50;
let chaosFactor = 0;
let maxChaosFactor = 2;
let pupilCircles = [];
let splitThreshold = 15;
let splitSpeed = 0.01;
let routerWidth, routerHeight, routerX, routerY;
let servers = [];
let minPupilSize = 3;
let maxPupilSize = 20;
let maxPupilCount = 20;
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
  createServers();
  pupilCircles.push(new PupilCircle(eyeCenterX, eyeCenterY, 25, 0, 0));
  updateServerConnections();
}
function draw() {
  drawServerRoomBackground();
  updateChaosFactor();
  updatePupils();
  drawRouter();
  drawEye();
  drawServers();
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
  pupilCircles.forEach(pc => { //this is the first forEach loop I use, which is a loop that iterates over each element in an array
    pc.update(irisOffsetX, irisOffsetY); 
    pc.display(); 
  });
  pop();
}
function createServers() {
  servers = []; 
  let serverCount = 4;
  let serverSize = min(width, height) * 0.05;
  for (let i = 0; i < serverCount; i++) {
    let x = width * (i + 1) / (serverCount + 1);
    let y = height * (i + 1) / (serverCount + 1);
    servers.push(new Server(x - serverSize / 2, 0, x, routerY, serverSize));
    servers.push(new Server(x - serverSize / 2, height - serverSize, x, routerY + routerHeight, serverSize));
    servers.push(new Server(0, y - serverSize / 2, routerX, y, serverSize));
    servers.push(new Server(width - serverSize, y - serverSize / 2, routerX + routerWidth, y, serverSize));
  }
}
function drawServers(){
  servers.forEach(s => s.draw());
  let frameInterval = Math.round(map(chaosFactor, 0, maxChaosFactor, 60, 10)  ); 
  if (frameCount % frameInterval === 0) {
    let attachedServers = servers.filter(s => s.isAttached);
    if (attachedServers.length >= 2) {
      let sourceServer = random(attachedServers);
      let targetServer;
      do {//this makes sure that the targetServer always is assigned a variable
        targetServer = random(attachedServers);
      } while (targetServer === sourceServer);//if targetServer is sourceServer, then do not add beam
      sourceServer.addBeam(targetServer);//if targetServer is not sourceServer, then add beam
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
    updateServerConnections();
    return; 
  }
  servers.forEach(s => {
    if (s.isPointInside(mouseX, mouseY)) {
      s.toggleAttach();
      updateChaosFactor(); 
    }
  });
}
function updateServerConnections() {
  servers.forEach(server => {
    if (isRouterOn && !server.isAttached) {
      server.toggleAttach();
    } else if (!isRouterOn && server.isAttached) {
      server.toggleAttach();
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
class Server {
  constructor(x, y, routerX, routerY, size) {
    this.baseX = x;
    this.baseY = y;
    this.size = size;
    this.contactX = routerX;
    this.contactY = routerY;
    this.wireEndX = x + size / 2;
    this.wireEndY = y + size / 2;
    this.isAttached = false;
    this.beams = [];  
  }

  addBeam(targetServer) {
    if (this.beams.length < 3) {
      this.beams.push([
        targetServer.wireEndX,  
        targetServer.wireEndY, 
        0                       
      ]);
    }
  }
  draw() {
    const targetX = this.isAttached ? this.contactX : this.baseX + this.size / 2;
    const targetY = this.isAttached ? this.contactY : this.baseY + this.size / 2;
    this.wireEndX = lerp(this.wireEndX, targetX, 0.1);
    this.wireEndY = lerp(this.wireEndY, targetY, 0.1);
    fill('gray');
    rect(this.baseX, this.baseY, this.size, this.size);
    stroke('black');
    line(this.baseX + this.size / 2, this.baseY + this.size / 2, this.wireEndX, this.wireEndY);
    fill(this.isAttached ? 'green' : 'red');
    ellipse(this.wireEndX, this.wireEndY, this.size * 0.5);
    for (let i = this.beams.length - 1; i >= 0; i--) {
      let [targetX, targetY, progress] = this.beams[i];//destructuring assignment
      let beamX = lerp(this.wireEndX, targetX, progress);
      let beamY = lerp(this.wireEndY, targetY, progress);
      for (let j = 0; j < 6; j++) {
        let trailProgress = progress - (j * 0.05);
        if (trailProgress > 0) {
          let trailX = lerp(this.wireEndX, targetX, trailProgress);
          let trailY = lerp(this.wireEndY, targetY, trailProgress);
          let alpha = map(j, 0, 6, 150, 0);
          noStroke();
          fill(0, 255, 0, alpha);
          ellipse(trailX, trailY, 5 - j * 0.5);
        }
      }
      this.beams[i][2] += map(chaosFactor, 0, maxChaosFactor, 0.02, 0.08);
      if (this.beams[i][2] >= 1) {
        this.beams.splice(i, 1);
      }
    }
  }
  toggleAttach() {
    this.isAttached = !this.isAttached;
  }
  isPointInside(x, y) {
    return dist(x, y, this.wireEndX, this.wireEndY) <= this.size * 0.25;
  }
}
function updateChaosFactor() {
  let attachedServers = servers.filter(s => s.isAttached).length;
  chaosFactor = map(attachedServers, 0, servers.length, 0, maxChaosFactor);
}
function updatePupils() {
  let attachedServers = servers.filter(s => s.isAttached).length;
  let targetPupilCount = map(attachedServers, 0, servers.length, 1, maxPupilCount);
  targetPupilCount = Math.round(targetPupilCount);
  while (pupilCircles.length < targetPupilCount) {
    let largestPupil = pupilCircles.reduce((a, b) => a.r > b.r ? a : b);//the reason I write this is because I know reduce() functions as accumulator, which will return the first element that satisfies the condition
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
    let smallestPupils = pupilCircles.sort((a, b) => a.r - b.r).slice(0, 2);//the reason I write this is because I know sort() sort elements based on the return value of comparions
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
  const WIRE_COUNT = 50;
  const WIRE_COLOR = '#4a4a4a';
  background(220); 
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

