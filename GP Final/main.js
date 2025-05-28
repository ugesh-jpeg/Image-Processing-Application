let video;
let snapshotImage = null; // Global snapshot image
let sliders = {};
let sliderLabels = {};
let sliderValues = {}; 
let faceEffect = 'none'; // Current face effect
let jokerMask;
let batmanMask;

var detector;
var classifier = objectdetect.frontalface;

function preload() {
  jokerMask = loadImage('images/joker.jpg', img => {
    removeBackground(img, 200);
  });
  batmanMask = loadImage('images/batman.jpg', img => {
    removeBackground(img, 200);
  });
}

function setup() {
  createCanvas(520, 660);
  noSmooth();
  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide();
  var scaleFactor = 1.2;
  detector = new objectdetect.detector(160, 120, scaleFactor, classifier);

  // Create snapshot/resume buttons and an instruction text above them
  let buttonInstruction = createP("Click for snapshot or Press s");
  buttonInstruction.position(540, 10);

  let altbuttonInstruction = createP("Click for livefeed or Press l");
  altbuttonInstruction.position(540, 60);

  let snapshotButton = createButton("Snapshot");
  snapshotButton.position(840, 25);
  snapshotButton.mousePressed(function() {
    snapshotImage = video.get();
    console.log("Snapshot taken");
  });

  let resumeButton = createButton("Resume Live");
  resumeButton.position(840, 75);
  resumeButton.mousePressed(function() {
    snapshotImage = null;
    console.log("Live video resumed");
  });

  // Create sliders for adjusting thresholds
  sliders.r = createSlider(0, 255, 80);
  sliders.g = createSlider(0, 255, 120);
  sliders.b = createSlider(0, 255, 180);
  sliders.y = createSlider(0, 255, 20);
  sliders.cmy = createSlider(0, 255, 0);

  // Position the sliders
  sliders.r.position(540, 330);
  sliders.g.position(710, 330);
  sliders.b.position(880, 330);
  sliders.y.position(540, 590);
  sliders.cmy.position(710, 590);

  // Create labels above sliders
  sliderLabels.r = createP("Red Threshold").position(540, 300);
  sliderLabels.g = createP("Green Threshold").position(710, 300);
  sliderLabels.b = createP("Blue Threshold").position(880, 300);
  sliderLabels.y = createP("YCbCr Threshold").position(540, 560);
  sliderLabels.cmy = createP("CMYK Threshold").position(710, 560);

  // Create value elements below sliders
  sliderValues.r = createP(sliders.r.value()).position(590, 340);
  sliderValues.g = createP(sliders.g.value()).position(760, 340);
  sliderValues.b = createP(sliders.b.value()).position(930, 340);
  sliderValues.y = createP(sliders.y.value()).position(590, 600);
  sliderValues.cmy = createP(sliders.cmy.value()).position(760, 600);
}

function draw() {
  background(220);
  
  // Use snapshotImage if available; otherwise use live video
  let src = snapshotImage !== null ? snapshotImage : video;
  
  if (src.loadedmetadata || snapshotImage !== null) {
    // Display images in a grid layout:
    image(src, 10, 10);  // Original webcam or snapshot image
    image(src, 10, 400);  // Copied image
    image(src, 10, 530);  // Face detection area
    
    image(grayscaleBrightness(src), 180, 10);  // Brightened grayscale
    
    // Split into channels and display
    image(extractChannel(src, 'r'), 10, 140);
    image(extractChannel(src, 'g'), 180, 140);
    image(extractChannel(src, 'b'), 350, 140);
    
    // Apply thresholds to each RGB channel using sliders
    image(thresholdImage(src, 'r', sliders.r.value()), 10, 270);
    image(thresholdImage(src, 'g', sliders.g.value()), 180, 270);
    image(thresholdImage(src, 'b', sliders.b.value()), 350, 270);
    
    // Convert to color spaces
    let ycbcrImage = convertYCbCr(src);
    let cmykImage = convertCMYK(src);
    image(ycbcrImage, 180, 400);
    image(cmykImage, 350, 400);
    
    // Apply threshold to the color space images using sliders
    image(thresholdImage(ycbcrImage, 'y', sliders.y.value()), 180, 530);
    image(thresholdImage(cmykImage, 'cmy', sliders.cmy.value()), 350, 530);
    
    // Face detection and processing (faces drawn over the designated area)
    detectAndDrawFaces(src, 10, 530);
  }

  // Update slider values dynamically below the sliders
  sliderValues.r.html(sliders.r.value());
  sliderValues.g.html(sliders.g.value());
  sliderValues.b.html(sliders.b.value());
  sliderValues.y.html(sliders.y.value());
  sliderValues.cmy.html(sliders.cmy.value());
}

function keyPressed() {
  // Change face effect based on key pressed
  if (key === 'g') faceEffect = 'grayscale';
  else if (key === 'b') faceEffect = 'blur';
  else if (key === 'c') faceEffect = 'colorConvert';
  else if (key === 'p') faceEffect = 'pixelate';
  else if (key === 'j') faceEffect = 'joker';
  else if (key === 'm') faceEffect = 'batman';
  else if (key === 'n') faceEffect = 'none';
  
  // Snapshot functionality

  // press "s" to take a snapshot
  if (key === 's') {
    snapshotImage = video.get();
    console.log("Snapshot taken");
  }
  // press "l" to revert to live video.
  if (key === 'l') {
    snapshotImage = null;
    console.log("Live video resumed");
  }
}

// Brightened grayscale conversion (with brightness increased by 20%)
function grayscaleBrightness(img) {
  let newImg = createImage(img.width, img.height);
  newImg.loadPixels();
  img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    let avg = (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
    let brightened = min(avg + 51, 255);
    newImg.pixels[i] = brightened;
    newImg.pixels[i + 1] = brightened;
    newImg.pixels[i + 2] = brightened;
    newImg.pixels[i + 3] = 255;
  }

  newImg.updatePixels();
  return newImg;
}

// Regular grayscale conversion
function grayscale(img) {
  let newImg = createImage(img.width, img.height);
  newImg.loadPixels();
  img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    let avg = (img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2]) / 3; 
    newImg.pixels[i] = avg;
    newImg.pixels[i + 1] = avg;
    newImg.pixels[i + 2] = avg;
    newImg.pixels[i + 3] = 255; 
  }

  newImg.updatePixels();
  return newImg;
}

// Apply blur effect
function applyBlur(img, blurSize) {
  let newImg = createImage(img.width, img.height);
  newImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
  newImg.filter(BLUR, blurSize);
  return newImg;
}

// Extract a single colour channel from the image
function extractChannel(img, channel) {
  let newImg = createImage(img.width, img.height);
  newImg.loadPixels();
  img.loadPixels();

  let channelIdx = { 'r': 0, 'g': 1, 'b': 2 }[channel];

  for (let i = 0; i < img.pixels.length; i += 4) {
    newImg.pixels[i] = (channelIdx === 0) ? img.pixels[i] : 0;
    newImg.pixels[i + 1] = (channelIdx === 1) ? img.pixels[i + 1] : 0;
    newImg.pixels[i + 2] = (channelIdx === 2) ? img.pixels[i + 2] : 0;
    newImg.pixels[i + 3] = 255;
  }

  newImg.updatePixels();
  return newImg;
}

// Apply thresholding to an image on a specified channel
function thresholdImage(img, space, threshold) {
  let newImg = createImage(img.width, img.height);
  newImg.loadPixels();
  img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    let value = img.pixels[i];
    let bin = value > threshold ? 255 : 0;
    newImg.pixels[i] = newImg.pixels[i + 1] = newImg.pixels[i + 2] = bin;
    newImg.pixels[i + 3] = 255;
  }

  newImg.updatePixels();
  return newImg;
}

// Convert image to YCbCr (using luminance only for simplicity)
function convertYCbCr(img) {
  let newImg = createImage(img.width, img.height);
  newImg.loadPixels();
  img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    let y = 0.299 * r + 0.587 * g + 0.114 * b;
    let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    newImg.pixels[i] = y;          // Y  channel
    newImg.pixels[i + 1] = cb;     // Cb channel
    newImg.pixels[i + 2] = cr;     // Cr channel
    newImg.pixels[i + 3] = 255;
  }

  newImg.updatePixels();
  return newImg;
}

// Convert image to CMYK using provided equations and force full opacity
function convertCMYK(img) {
  let newImg = createImage(img.width, img.height);
  newImg.loadPixels();
  img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i] / 255;
    let g = img.pixels[i + 1] / 255;
    let b = img.pixels[i + 2] / 255;

    let k = 1 - Math.max(r, g, b);
    let c = (1 - r - k) / (1 - k) || 0;
    let m = (1 - g - k) / (1 - k) || 0;
    let y = (1 - b - k) / (1 - k) || 0;

    newImg.pixels[i] = c * 255;
    newImg.pixels[i + 1] = m * 255;
    newImg.pixels[i + 2] = y * 255;
    newImg.pixels[i + 3] = 255; // Force full opacity
  }

  newImg.updatePixels();
  return newImg;
}

// Apply Joker effect
function applyjokerMask(img) {
  let newImg = createImage(img.width, img.height);
  newImg.copy(img, 0, 0, img.width, img.height, 0, 0, newImg.width, newImg.height);

  let scaleFactor = 1.2; 
  let scaledW = int(newImg.width * 2.5);
  let scaledH = int(newImg.height * scaleFactor);

  // Compute offsets so the enlarged mask is centered on the face
  let offsetX = -((scaledW - newImg.width) / 2);
  let offsetY = -((scaledH - newImg.height) / 2);

  newImg.copy(
    jokerMask,
    0, 0, jokerMask.width, jokerMask.height, // source region
    offsetX, offsetY, scaledW, scaledH         // destination region
  );

  return newImg;
}

// Apply Batman effect
function applybatmanMask(img) {
  
  let newImg = createImage(img.width, img.height);
  newImg.copy(img, 0, 0, img.width, img.height, 0, 0, newImg.width, newImg.height);

  let scaleFactor = 1.2; 
  let scaledW = int(newImg.width * 2);
  let scaledH = int(newImg.height * scaleFactor);

  let offsetX = -((scaledW - newImg.width) / 2);
  let offsetY = -((scaledH - newImg.height) * 2);

  newImg.copy(
    batmanMask,
    0, 0, batmanMask.width, batmanMask.height,
    offsetX, offsetY, scaledW, scaledH 
  );

  return newImg;
}

function removeBackground(img, threshold) {
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    let brightness = (r + g + b) / 3;
    if (brightness >= threshold) {
      img.pixels[i + 3] = 0; // make pixel transparent
    }
  }
  img.updatePixels();
}

// Pixelate an image by mapping every pixel to the color of its block's average intensity.
function pixelateFilter(faceImg, blockSize) {
  // Convert to grayscale using the grayscale function
  let grayFace = grayscale(faceImg);
  
  // Create a new image for output and load pixel arrays
  let newImg = createImage(grayFace.width, grayFace.height);
  grayFace.loadPixels();
  newImg.loadPixels();
  
  let w = grayFace.width;
  let h = grayFace.height;
  
  // Process the image in blocks
  for (let x = 0; x < w; x += blockSize) {
    for (let y = 0; y < h; y += blockSize) {
      let sum = 0;
      let count = 0;
      
      // Calculate the average intensity for the block
      for (let i = 0; i < blockSize; i++) {
        for (let j = 0; j < blockSize; j++) {
          let xx = x + i;
          let yy = y + j;
          if (xx < w && yy < h) {
            let index = (yy * w + xx) * 4;
            sum += grayFace.pixels[index]; // Grayscale: r == g == b
            count++;
          }
        }
      }
      
      let ave = sum / count;
      
      // Paint the block with the average intensity
      for (let i = 0; i < blockSize; i++) {
        for (let j = 0; j < blockSize; j++) {
          let xx = x + i;
          let yy = y + j;
          if (xx < w && yy < h) {
            let index = (yy * w + xx) * 4;
            newImg.pixels[index] = ave;
            newImg.pixels[index + 1] = ave;
            newImg.pixels[index + 2] = ave;
            newImg.pixels[index + 3] = 255;
          }
        }
      }
    }
  }
  
  newImg.updatePixels();
  return newImg;
}

// detectAndDrawFaces applies the selected face effect to detected faces in the source image.
function detectAndDrawFaces(src, xOffset, yOffset) {
  // Create a copy of the source image for face detection.
  let faceImg = createImage(src.width, src.height);
  faceImg.copy(src, 0, 0, src.width, src.height, 0, 0, src.width, src.height);
  
  let faces = detector.detect(faceImg.canvas);

  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    if (face[4] > 4) { 
      let x = Math.max(0, face[0]);
      let y = Math.max(0, face[1]);
      let w = Math.min(face[2], src.width - x);
      let h = Math.min(face[3], src.height - y);

      // Extract the face region from the source image.
      let faceRegion = src.get(x, y, w, h);

      // Apply the selected effect to the face region.
      if (faceEffect === 'grayscale') {
        faceRegion = grayscale(faceRegion);
        console.log("Your face is now in greyscale.");
      } else if (faceEffect === 'blur') {
        faceRegion = applyBlur(faceRegion, 8);
        console.log("Your face is now blurred.");
      } else if (faceEffect === 'colorConvert') {
        faceRegion = convertCMYK(faceRegion);
        console.log("Your face is now in CMYK.");
      } else if (faceEffect === 'pixelate') {
        // Downscale face region using a factor of 0.9
        faceRegion.resize(faceRegion.width * 0.9, faceRegion.height * 0.9);
        // Apply pixelation with a block size 5
        faceRegion = pixelateFilter(faceRegion, 5);
        faceRegion.resize(w, h);
        console.log("Your face is now pixelated.");
      } else if (faceEffect === 'joker') {
        faceRegion = applyjokerMask(faceRegion);
        console.log("You are now the Joker.");
      } else if (faceEffect === 'batman') {
      faceRegion = applybatmanMask(faceRegion);
      console.log("You are now the Batman.");
      }else if (faceEffect === 'none') {
        // If no effect is selected, draw a rectangle around the detected face.
        noFill();
        stroke(255);
        strokeWeight(2);
        rect(x + xOffset, y + yOffset, w, h);
        console.log("Face detected.");
      }

      // Draw the processed face region at the designated offset.
      image(faceRegion, x + xOffset, y + yOffset, w, h);
    }
  }
}