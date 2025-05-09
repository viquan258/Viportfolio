let mic;
let fft;
let blobs = [];
let smoothedZoom = 1;
let overlays = [];
let overlaySpawnCooldown = 0;
let lastVariationTime = 0;
let variationIndex = 0;
let bgMode = 0;
let toggleButton;

let bassThreshold = 120;
let overlayThreshold = 0.01;
let sizeBoostMin = 0.5;
let sizeBoostMax = 7;
let pulseSpeed = 0.6;
let pulseRangeMin = 0.5;
let pulseRangeMax = 2.5;

function setup() {
  const canvas = createCanvas(windowWidth, 500);
  canvas.parent("p5-wrapper");

  noLoop(); // Stop draw loop until mic permission is granted

  const startBtn = createButton("🎤 Click to Enable Microphone");
  startBtn.position(width / 2 - 120, height / 2 - 30);
  startBtn.style('font-size', '18px');
  startBtn.mousePressed(() => {
    userStartAudio(); // resume AudioContext

    mic = new p5.AudioIn();
    mic.start(
      () => {
        startBtn.remove();
        initSketch();
        loop();
      },
      () => {
        alert("Microphone permission denied. Visuals need mic input to work.");
      }
    );
  });
}

function initSketch() {
  fft = new p5.FFT();
  fft.setInput(mic);

  for (let i = 0; i < 5; i++) {
    blobs.push(new SymmetricBlob(random(width * 0.25, width * 0.75), random(height * 0.25, height * 0.75)));
  }

  toggleButton = createButton("🎨 Toggle BG");
  toggleButton.position(20, 20);
  toggleButton.mousePressed(() => bgMode = (bgMode + 1) % 2);

  noFill();
}

function draw() {
  if (bgMode === 0) {
    background(10, 10, 15, 6);
  } else {
    let hue = map(sin(millis() * 0.0001), -1, 1, 0, 255);
    colorMode(HSB);
    background(hue, 100, 50, 0.02);
    colorMode(RGB);
  }

  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");
  let mids = fft.getEnergy("mid");
  let micLevel = mic.getLevel();

  let targetZoom = map(bass, 0, 255, 1, 1.6);
  smoothedZoom = lerp(smoothedZoom, targetZoom, 0.05);

  if (micLevel > overlayThreshold && overlaySpawnCooldown <= 0) {
    overlays.push(new OverlayBlob(random(width), random(height)));
    overlaySpawnCooldown = 10;
  }
  overlaySpawnCooldown--;

  for (let i = overlays.length - 1; i >= 0; i--) {
    overlays[i].update();
    overlays[i].display();
    if (millis() - overlays[i].birthTime > 2000) {
      overlays.splice(i, 1);
    }
  }

  if (millis() - lastVariationTime > 5000) {
    variationIndex = (variationIndex + 1) % 4;
    lastVariationTime = millis();
    for (let blob of blobs) {
      blob.setThemeColor(variationIndex);
    }
  }

  push();
  translate(width / 2, height / 2);
  scale(smoothedZoom);
  translate(-width / 2, -height / 2);

  blendMode(ADD);
  for (let blob of blobs) {
    blob.update(bass, mids);
    blob.display();
  }
  blendMode(BLEND);
  pop();
}

function keyPressed() {
  if (key === ' ') {
    fullscreen(!fullscreen());
  }
}

class SymmetricBlob {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.2, 0.5));
    this.baseRadius = random(50, 600);
    this.currentRadius = this.baseRadius;
    this.seed = random(1000);
    this.petalCount = floor(random(1, 3));
    this.rotation = random(TWO_PI);
    this.setThemeColor(0);
  }

  setThemeColor(index) {
    let hueShift = [200, 55, 270, 5][index % 4];
    let saturation = random(80, 100);
    let brightness = random(90, 100);
    colorMode(HSB);
    this.color = color(hueShift, saturation, brightness, 0.4);
    colorMode(RGB);
  }

  update(bass, mids) {
    let pulse = sin(millis() * pulseSpeed) * 0.5 + 0.5;
    let pulseEffect = map(pulse, 0, 1, pulseRangeMin, pulseRangeMax);
    let dynamicBoost = map(bass, bassThreshold, 255, sizeBoostMin, sizeBoostMax, true);
    let bassMapped = map(bass, 0, 255, -this.baseRadius * 0.9, this.baseRadius * 1.0) * dynamicBoost * pulseEffect;
    let target = constrain(this.baseRadius + bassMapped, this.baseRadius * 0.05, this.baseRadius * 2);
    this.currentRadius = lerp(this.currentRadius, target, 0.75);

    let movement = map(bass, 0, 255, 0, 0.3);
    let jitter = p5.Vector.random2D().mult(movement);
    this.pos.add(p5.Vector.add(this.vel, jitter));

    let center = createVector(width / 2, height / 2);
    let offset = p5.Vector.sub(this.pos, center);
    if (offset.mag() > min(width, height) * 0.25) {
      offset.setMag(min(width, height) * 0.25);
      this.pos = p5.Vector.add(center, offset);
      this.vel.mult(-1);
    }

    let rotationSpeed = map(mids, 0, 255, 0.0005, 0.01);
    this.rotation += rotationSpeed;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    stroke(this.color);
    strokeWeight(0.7);

    for (let layer = 0; layer < 5; layer++) {
      beginShape();
      for (let a = 0; a <= PI; a += PI / 180) {
        let rNoise = noise(this.seed + cos(a) * 2, sin(a) * 2, millis() * 0.0005 + layer * 0.1);
        let petal = sin(this.petalCount * a);
        let r = this.currentRadius * petal * rNoise * (1 - layer * 0.1);
        let x = r * cos(a);
        let y = r * sin(a);
        curveVertex(x, y);
      }
      endShape();

      beginShape();
      for (let a = 0; a <= PI; a += PI / 180) {
        let rNoise = noise(this.seed + cos(a) * 2, sin(a) * 2, millis() * 0.0005 + layer * 0.1);
        let petal = sin(this.petalCount * a);
        let r = this.currentRadius * petal * rNoise * (1 - layer * 0.1);
        let x = -r * cos(a);
        let y = r * sin(a);
        curveVertex(x, y);
      }
      endShape();
    }

    pop();
  }
}

class OverlayBlob {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = random(20, 80);
    this.alpha = random(10, 100);
    this.wobbleSpeed = random(0.001, 0.005);
    this.wobbleMag = random(0.5, 2);
    this.noiseSeed = random(1000);
    this.birthTime = millis();
  }

  update() {
    let t = millis() * this.wobbleSpeed;
    this.pos.x += sin(t + this.noiseSeed) * this.wobbleMag;
    this.pos.y += cos(t + this.noiseSeed * 0.5) * this.wobbleMag;
  }

  display() {
    let fade = map(millis() - this.birthTime, 0, 2000, this.alpha, 0);
    stroke(255, fade);
    strokeWeight(1);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}
