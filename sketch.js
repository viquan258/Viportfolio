function setup() {
    let canvas = createCanvas(800, 400);      // create the canvas
    canvas.parent("p5-wrapper");              // attach it to the <section id="p5-wrapper">
    background(30);                           // dark background
    fill(255);                                // white text
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Hello from p5.js", width / 2, height / 2); // draw centered message
  }
  