// Taken from https://github.com/jcmellado/js-aruco and modified for Fiducial FEZ

/*
Copyright (c) 2011 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "ArUco: a minimal library for Augmented Reality applications based on OpenCv"
  http://www.uco.es/investiga/grupos/ava/node/26
*/

var AR = AR || {};

var hammingDistTolerance = 2;
var colorSamplesPerSquare = 10;
var colorSampleMoveInFrac = 0.25 / 2;
var colorSampleThreshold = 0.5;
var symbolIDsThatUseColor = { 10: true, 19: true };
var allSymbolBits = [
  [ [0,0,0,0,0], [1,1,0,1,1], [0,1,1,1,0], [0,0,0,0,0], [0,0,0,0,0] ], //  0 A
  [ [0,0,0,0,0], [0,1,1,1,0], [0,1,0,1,0], [1,1,1,1,0], [0,0,0,0,0] ], //  1 B
  [ [0,0,0,0,0], [0,0,0,1,1], [0,0,0,1,0], [0,0,0,1,1], [0,0,0,0,0] ], //  2 C
  [ [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [1,1,0,0,0], [0,1,0,0,0] ], //  3 D
  [ [0,0,0,0,0], [1,1,0,0,0], [0,1,0,0,0], [0,1,1,1,1], [0,0,0,0,0] ], //  4 E
  [ [0,0,0,0,0], [0,1,0,1,0], [1,1,1,1,0], [0,1,0,1,0], [0,0,0,0,0] ], //  5 F
  [ [0,0,0,1,0], [0,0,1,1,0], [0,0,1,0,0], [0,0,1,1,0], [0,0,0,1,0] ], //  6 G
  [ [0,0,0,0,0], [0,1,1,1,0], [0,1,0,1,0], [0,1,1,1,0], [0,0,0,1,0] ], //  7 H
  [ [0,1,0,1,0], [0,1,1,1,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0] ], //  8 I
  [ [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,1,1], [0,0,0,1,0] ], //  9 J
  [ [0,0,0,1,0], [0,0,0,1,0], [0,0,0,1,0], [0,1,1,1,0], [0,1,0,0,0] ], // 10 KQ
  [ [0,0,0,0,0], [0,1,1,1,0], [0,0,1,0,0], [0,1,1,1,0], [0,0,1,0,0] ], // 11 L
  [ [0,0,0,0,0], [0,0,0,0,0], [0,1,1,1,0], [1,1,0,1,1], [0,0,0,0,0] ], // 12 M
  [ [0,0,0,0,0], [0,1,1,1,1], [0,1,0,1,0], [0,1,1,1,0], [0,0,0,0,0] ], // 13 N
  [ [0,0,0,0,0], [1,1,0,0,0], [0,1,0,0,0], [1,1,0,0,0], [0,0,0,0,0] ], // 14 O
  [ [0,0,0,1,0], [0,0,0,1,1], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0] ], // 15 P
  [ [0,0,0,0,0], [0,1,0,1,0], [0,1,1,1,1], [0,1,0,1,0], [0,0,0,0,0] ], // 16 R
  [ [0,1,0,0,0], [0,1,1,0,0], [0,0,1,0,0], [0,1,1,0,0], [0,1,0,0,0] ], // 17 S
  [ [0,1,0,0,0], [0,1,1,1,0], [0,1,0,1,0], [0,1,1,1,0], [0,0,0,0,0] ], // 18 T
  [ [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,1,1,1,0], [0,1,0,1,0] ], // 19 UV
  [ [0,1,0,0,0], [1,1,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0] ], // 20 W
  [ [0,0,0,1,0], [0,1,1,1,0], [0,1,0,0,0], [0,1,0,0,0], [0,1,0,0,0] ], // 21 X
  [ [0,0,1,0,0], [0,1,1,1,0], [0,0,1,0,0], [0,1,1,1,0], [0,0,0,0,0] ], // 22 Y
  [ [0,0,0,0,0], [1,1,1,1,0], [0,0,0,1,0], [0,0,0,1,1], [0,0,0,0,0] ], // 23 Z
  [ [0,0,1,0,0], [0,1,1,0,0], [0,0,1,1,0], [0,1,0,1,0], [0,1,1,0,0] ], // 24 cornerTL
  [ [0,0,1,0,0], [0,0,1,1,0], [0,1,0,1,0], [0,0,1,0,0], [0,0,1,1,0] ], // 25 cornerTR
  [ [0,1,1,0,0], [0,0,1,0,0], [0,0,1,1,0], [1,1,0,0,0], [0,1,0,1,0] ], // 26 cornerBL
  [ [0,0,1,1,0], [0,0,1,0,0], [0,1,0,1,0], [0,1,0,0,0], [0,0,0,1,0] ], // 27 cornerBR
];

AR.Marker = function(id, corners, colorState=0) {
  var sumX = 0, sumY = 0;
  var maxX = 0, maxY = 0, minX = 100000, minY = 100000;

  for (var i = 0; i < corners.length; i++) {
    let corner = corners[i];
    let x = corner.x;
    let y = corner.y;

    sumX += x;
    sumY += y;

    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }

  this.id = id;
  this.corners = corners;
  this.colorState = colorState; // 0 = white, 1 = red, 2 = blue
  this.center = { x: sumX / 4, y: sumY / 4 };
  this.width = maxX - minX;
  this.height = maxY - minY;
};

AR.Detector = function() {
  this.imageOG = new CV.Image();
  this.imageGrey = new CV.Image();
  this.thres = new CV.Image();
  this.homographyGrey = new CV.Image();
  this.binary = [];
  this.contours = [];
  this.polys = [];
  this.candidates = [];
};

AR.Detector.prototype.detect = function(image) {
  this.imageOG = image;

  CV.grayscale(image, this.imageGrey);
  CV.adaptiveThreshold(this.imageGrey, this.thres, 2, 7);

  this.contours = CV.findContours(this.thres, this.binary);

  let minContourSize = Math.min(Math.max(image.width * 0.20, 7), 20);

  this.candidates = this.findCandidates(this.contours, minContourSize, 0.05, 10);
  this.candidates = this.clockwiseCorners(this.candidates);
  this.candidates = this.notTooNear(this.candidates, 10);

  return this.findMarkers(this.candidates, 49);
};

AR.Detector.prototype.findCandidates = function(contours, minSize, epsilon, minLength) {
  var candidates = [], len = contours.length, contour, poly, i;

  this.polys = [];

  for (i = 0; i < len; ++ i) {
    contour = contours[i];

    if (contour.length >= minSize) {
      poly = CV.approxPolyDP(contour, contour.length * epsilon);

      this.polys.push(poly);

      if ((4 === poly.length) && (CV.isContourConvex(poly))) {

        if (CV.minEdgeLength(poly) >= minLength) {
          candidates.push(poly);
        }
      }
    }
  }

  return candidates;
};

AR.Detector.prototype.clockwiseCorners = function(candidates) {
  var len = candidates.length, dx1, dx2, dy1, dy2, swap, i;

  for (i = 0; i < len; ++ i) {
    dx1 = candidates[i][1].x - candidates[i][0].x;
    dy1 = candidates[i][1].y - candidates[i][0].y;
    dx2 = candidates[i][2].x - candidates[i][0].x;
    dy2 = candidates[i][2].y - candidates[i][0].y;

    if ((dx1 * dy2 - dy1 * dx2) < 0) {
      swap = candidates[i][1];
      candidates[i][1] = candidates[i][3];
      candidates[i][3] = swap;
    }

    // Fix candidate sometimes being rotated 90 degrees clockwise
    dx1 = candidates[i][1].x - candidates[i][0].x;
    dy1 = candidates[i][1].y - candidates[i][0].y;

    if (Math.abs(dx1) < Math.abs(dy1)) {
      swap = candidates[i][0];
      candidates[i][0] = candidates[i][3];
      candidates[i][3] = candidates[i][2];
      candidates[i][2] = candidates[i][1];
      candidates[i][1] = swap;
    }
  }

  return candidates;
};

AR.Detector.prototype.notTooNear = function(candidates, minDist) {
  var notTooNear = [], len = candidates.length, dist, dx, dy, i, j, k;

  for (i = 0; i < len; ++ i) {

    for (j = i + 1; j < len; ++ j) {
      dist = 0;

      for (k = 0; k < 4; ++ k) {
        dx = candidates[i][k].x - candidates[j][k].x;
        dy = candidates[i][k].y - candidates[j][k].y;

        dist += dx * dx + dy * dy;
      }

      if ((dist / 4) < (minDist * minDist)) {

        if (CV.perimeter(candidates[i]) < CV.perimeter(candidates[j])) {
          candidates[i].tooNear = true;
        }else{
          candidates[j].tooNear = true;
        }
      }
    }
  }

  for (i = 0; i < len; ++ i) {
    if (!candidates[i].tooNear) {
      notTooNear.push(candidates[i]);
    }
  }

  return notTooNear;
};

AR.Detector.prototype.findMarkers = function(candidates, warpSize) {
  var markers = [], len = candidates.length, candidate, marker, i;

  for (i = 0; i < len; ++ i) {
    candidate = candidates[i];

    CV.warp(this.imageGrey, this.homographyGrey, candidate, warpSize);
    CV.threshold(this.homographyGrey, this.homographyGrey, CV.otsu(this.homographyGrey));

    marker = this.getMarker(this.homographyGrey, candidate);

    if (marker) {
      marker.colorState = this.getColorState(marker, candidate, warpSize);
      markers.push(marker);
    }
  }

  return markers;
};

AR.Detector.prototype.readPixel = function(img, x, y) {
  x = Math.floor(x);
  y = Math.floor(y);

  var data = img.data;
  var index = ((y * img.width) + x) * 4;
  var r = data[index];
  var g = data[index + 1];
  var b = data[index + 2];

  return [r, g, b];
}

AR.Detector.prototype.getColorState = function(marker, candidate, warpSize) {
  var markerID = marker.id;

  if (symbolIDsThatUseColor[markerID] == undefined) {
    return 0; // White
  }

  var img = this.imageOG;
  var bitRows = allSymbolBits[markerID];
  var markerWidth = marker.width;
  var markerHeight = marker.height;
  var moveInX = markerWidth * colorSampleMoveInFrac;
  var moveInY = markerHeight * colorSampleMoveInFrac;
  var x0 = candidate[0].x + moveInX;
  var y0 = candidate[0].y + moveInY;
  var x1 = candidate[2].x - moveInX;
  var y1 = candidate[2].y - moveInY;

  var redScore = 0;
  var blueScore = 0;
  var coloredSquares = 0;

  // Sample the colored (bit value of 1) squares in the marker
  for (let r = 0; r < 5; r++) {
    let bitRow = bitRows[r];

    for (let c = 0; c < 5; c++) {
      let bit = bitRow[c];

      if (bit == 0) continue;

      let cFrac = (c + 1) / 6;
      let rFrac = (r + 1) / 6;

      coloredSquares++;

      for (let i = 0; i < colorSamplesPerSquare; i++) {
        let x = lerp(x0, x1, cFrac + Math.random() * 0.2 - 0.1);
        let y = lerp(y0, y1, rFrac + Math.random() * 0.2 - 0.1);
        let [R, G, B] = this.readPixel(img, x, y);
        let [h, s, v] = rgb2hsv(R, G, B);

        if (s / v > 0.4) {
          if (h < 30 || h > 330) {
            redScore++;
          } else if (h > 150 && h < 270) {
            blueScore++;
          }
        }
      }
    }
  }

  redScore /= (colorSamplesPerSquare * coloredSquares);
  blueScore /= (colorSamplesPerSquare * coloredSquares);

  if (redScore > blueScore) {
    if (redScore > colorSampleThreshold) return 1; // Red
  } else if (blueScore > colorSampleThreshold) {
    return 2; // Blue
  }

  return 0; // White
}

AR.Detector.prototype.getMarker = function(imageSrc, candidate) {
  var width = (imageSrc.width / 7) >>> 0,
      minZero = (width * width) >> 1,
      bits = [], rotations = [], distances = [],
      square, pair, inc, i, j;

  for (i = 0; i < 7; ++ i) {
    inc = (0 === i || 6 === i)? 1: 6;

    for (j = 0; j < 7; j += inc) {
      square = {x: j * width, y: i * width, width: width, height: width};
      if (CV.countNonZero(imageSrc, square) > minZero) {
        return null;
      }
    }
  }

  for (i = 0; i < 5; ++ i) {
    bits[i] = [];

    for (j = 0; j < 5; ++ j) {
      square = {x: (j + 1) * width, y: (i + 1) * width, width: width, height: width};

      bits[i][j] = CV.countNonZero(imageSrc, square) > minZero? 1: 0;
    }
  }

  bestDist = 100000;
  bestID = -1;

  for (i = 0; i < allSymbolBits.length; i++) {
    dist = this.hammingDistance(bits, allSymbolBits[i]);

    if (dist < bestDist) {
      bestDist = dist;
      bestID = i;
    }
  }

  if (bestDist > hammingDistTolerance) {
    return null;
  }

  return new AR.Marker(bestID, candidate);
};

AR.Detector.prototype.hammingDistance = function(bits1, bits2) {
  var dist = 0;

  for (i = 0; i < 5; i++) {
    for (j = 0; j < 5; j++) {
      dist += bits1[i][j] === bits2[i][j]? 0: 1;
    }
  }

  return dist;
};

AR.Detector.prototype.mat2id = function(bits) {
  var id = 0, i;

  for (i = 0; i < 5; ++ i) {
    id <<= 1;
    id |= bits[i][1];
    id <<= 1;
    id |= bits[i][3];
  }

  return id;
};

AR.Detector.prototype.rotate = function(src) {
  var dst = [], len = src.length, i, j;

  for (i = 0; i < len; ++ i) {
    dst[i] = [];
    for (j = 0; j < src[i].length; ++ j) {
      dst[i][j] = src[src[i].length - j - 1][i];
    }
  }

  return dst;
};

AR.Detector.prototype.rotate2 = function(src, rotation) {
  var dst = [], len = src.length, i;

  for (i = 0; i < len; ++ i) {
    dst[i] = src[ (rotation + i) % len ];
  }

  return dst;
};
