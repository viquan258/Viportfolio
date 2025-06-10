let blobs = [];
let smoothedZoom = 1;
let variationIndex = 0;
let bgMode = 0;
let toggleButton;

let pulseSpeed = 0.6;
let pulseRangeMin = 0.5;
let pulseRangeMax = 2.5;

function setup() {
  const canvas = createCanvas(windowWidth, 500);
  canvas.parent("p5-wrapper");

  for (let i = 0; i < 5; i++) {
    blobs.push(new SymmetricBlob(
      random(width * 0.25, width * 0.75),
      random(height * 0.25, height * 0.75)
    ));
  }

  //toggleButton = createButton("🎨 Toggle BG");
  //toggleButton.parent("p5-wrapper");
  //toggleButton.style("margin-top", "1em");
  //toggleButton.mousePressed(() => bgMode = (bgMode + 1) % 2);
  

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

  let mouseInfluence = map(mouseX, 0, width, 0.5, 2);
  smoothedZoom = lerp(smoothedZoom, mouseInfluence, 0.05);

  if (frameCount % 300 === 0) {
    variationIndex = (variationIndex + 1) % 4;
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
    blob.update();
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

  update() {
    let pulse = sin(millis() * pulseSpeed) * 0.5 + 0.5;
    let pulseEffect = map(pulse, 0, 1, pulseRangeMin, pulseRangeMax);
    let mouseMapped = map(mouseY, 0, height, -this.baseRadius * 0.5, this.baseRadius * 1.0);
    let target = constrain(this.baseRadius + mouseMapped * pulseEffect, this.baseRadius * 0.05, this.baseRadius * 2);
    this.currentRadius = lerp(this.currentRadius, target, 0.75);

    let jitter = p5.Vector.random2D().mult(0.3);
    this.pos.add(p5.Vector.add(this.vel, jitter));

    let center = createVector(width / 2, height / 2);
    let offset = p5.Vector.sub(this.pos, center);
    if (offset.mag() > min(width, height) * 0.25) {
      offset.setMag(min(width, height) * 0.25);
      this.pos = p5.Vector.add(center, offset);
      this.vel.mult(-1);
    }

    this.rotation += 0.005;
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
