function setup() {
    let canvas = createCanvas(800, 400);
    canvas.parent("p5-wrapper"); // ⬅️ anchors it properly
    background(30);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Hello from p5.js", width / 2, height / 2);
  }
  