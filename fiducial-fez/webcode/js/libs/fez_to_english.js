
var F2E = F2E || {};


F2E.findBaseplate = function(unusedMarkers, cornerMarkers, colTR, colBR, bpRadius) {
  var markerTL, markerTR, markerBL, markerBR;
  var markerTLInd, markerTRInd, markerBLInd, markerBRInd;
  var markersTL = cornerMarkers.TL, markersTR = cornerMarkers.TR, markersBL = cornerMarkers.BL, markersBR = cornerMarkers.BR;
  var movedLeft = false;

  // colTR and colBR are the top/bottom right corners of the known top/bottom baseplates of the current column.

  // Find the four baseplate corners.
  [markerTR, markerTRInd] = findClosestMarker(markersTR, colBR, bpRadius);

  if (markerTR == null) {
    // This column is done, go to the top of the next left column.
    colBR = {x: colBR.x - bpRadius * 2, y: colTR.y};
    [markerTR, markerTRInd] = findClosestMarker(markersTR, colBR, bpRadius);
    movedLeft = true;

    if (markerTR == null) return [null, colBR, bpRadius];
  }

  var posTR = markerTR.center; // TR of this baseplate.

  [markerTL, markerTLInd] = findClosestMarker(markersTL, vectorAddPiece(posTR, -bpRadius * 2, 0), bpRadius);
  if (markerTL == null) return [null, colBR, bpRadius];

  var posTL = markerTL.center; // TL of this baseplate.

  [markerBR, markerBRInd] = findClosestMarker(markersBR, vectorAddPiece(posTR, 0, bpRadius * 2), bpRadius);
  if (markerBR == null) return [null, colBR, bpRadius];

  var posBR = markerBR.center; // BR of this baseplate.

  [markerBL, markerBLInd] = findClosestMarker(markersBL, vectorAddPiece(posTL, 0, bpRadius * 2), bpRadius);
  if (markerBL == null) return [null, colBR, bpRadius];

  var posBL = markerBL.center; // BL of this baseplate.

  // Remove the four corner markers from the list.
  markersTR.splice(markerTRInd, 1);
  markersTL.splice(markerTLInd, 1);
  markersBR.splice(markerBRInd, 1);
  markersBL.splice(markerBLInd, 1);

  // Get baseplate dimensions.
  var topDiff = vectorSub(posTL, posTR); // TR -> TL
  var bottomDiff = vectorSub(posBL, posBR); // BR -> BL
  var leftDiff = vectorSub(posBL, posTL); // TL -> BL
  var rightDiff = vectorSub(posBR, posTR); // TR -> BR
  var bpWidth = (vectorLength(topDiff) + vectorLength(bottomDiff)) / 2;
  var bpHeight = (vectorLength(leftDiff) + vectorLength(rightDiff)) / 2;
  var tileCols = new Array(rowsPerPlate);

  bpRadius = (bpWidth + bpHeight) / 4;

  for (let i = 0; i < rowsPerPlate; i++) {
    tileCols[i] = new Array(rowsPerPlate);
  }

  var baseplate = {
    center: vectorLerp(posTL, posBR, 0.5),
    width: bpWidth,
    height: bpHeight,
    radius: bpRadius,
    tileCols: tileCols,
    movedLeft: movedLeft,
  }

  // Collect tiles. A bunch of lerping between edges is used to account for deformations from camera rotation and tilting.
  var [tileWidth, tileHeight] = getAverageMarkerSize([markerTL, markerTR, markerBL, markerBR]);
  var tileRadius = (tileWidth + tileHeight) / 4;
  var nPlus1 = rowsPerPlate + 1;

  for (let c = 0; c < rowsPerPlate; c++) {
    let tileRow = tileCols[c];
    let fracX = (c + 1) / nPlus1;
    let colStart = vectorLerp(posTR, posTL, fracX); // Move along the top edge, from right to left.
    let downVec = vectorLerp(rightDiff, leftDiff, fracX); // Morph between the right and left edges.

    for (let r = 0; r < rowsPerPlate; r++) {
      let fracY = (r + 1) / nPlus1;
      //let horizDiff = vectorLerp(topDiff, bottomDiff, fracY);
      //let vertDiff = vectorLerp(rightDiff, leftDiff, fracX);
      let pos = vectorAdd(colStart, vectorScale(downVec, fracY)); // Move down from the top edge by the morphed vector and fraction.
      let [marker, markerInd] = findClosestMarker(unusedMarkers, pos, tileRadius);

      if (marker != null) {
        tileRow[r] = marker;
        unusedMarkers.splice(markerInd, 1);
      }
    }
  }

  return [baseplate, posBR, bpRadius];
}

F2E.translateMarkers = function(markers, imgWidth, imgHeight) {
  var englishStr = "";
  var unusedMarkers = [];
  var baseplates = [];
  var cornerMarkers = {
    TL: [],
    TR: [],
    BL: [],
    BR: [],
  }
  //var [avgWidth, avgHeight] = getAverageMarkerSize(markers);

  // Translate markers, copy non-corner markers into unusedMarkers, and collect the corner markers.
  for (let i = 0; i < markers.length; i++) {
    let marker = markers[i];
    let translation = translateMarker(marker);

    marker.translation = translation;

    if (translation.substring(0, 6) == "corner") {
      cornerMarkers[translation.substring(6, 8)].push(marker);
    } else {
      unusedMarkers.push(marker);
    }
  }

  var imgTR = {x: imgWidth, y: 0}; // Top right of the image
  var topMarker = findClosestMarker(cornerMarkers.TR, imgTR)[0];

  if (topMarker == null) return "ERROR: No top marker found.";

  var topMarkerPos = topMarker.center;
  var bottomMarkerPos = topMarkerPos;
  var leftSteps = 0;
  var downSteps = -1;
  var maxDownSteps = -1;
  var topMarkerRadius = (topMarker.width + topMarker.height) / 4;
  var bpRadius = topMarkerRadius * (1 + tileGapFrac) * (rowsPerPlate + 2); // Approximate the radius of the first baseplate

  // Find baseplates, in order of top->bottom, right->left.
  while (true) {
    let [baseplate, newBottom, newRadius] = F2E.findBaseplate(unusedMarkers, cornerMarkers, topMarkerPos, bottomMarkerPos, bpRadius);

    if (baseplate == null) break;

    let movedLeft = baseplate.movedLeft;
    bottomMarkerPos = newBottom;
    bpRadius = newRadius;

    if (movedLeft) {
      leftSteps++;
      maxDownSteps = Math.max(maxDownSteps, downSteps);
      downSteps = 0;
    } else {
      downSteps++;
    }

    baseplate.leftSteps = leftSteps;
    baseplate.downSteps = downSteps;
    baseplates.push(baseplate);
  }

  // Collect tiles from baseplates into one complete grid.
  var totalTileCols = new Array((leftSteps + 1) * rowsPerPlate);

  for (let i = 0; i < totalTileCols.length; i++) {
    totalTileCols[i] = new Array((maxDownSteps + 1) * rowsPerPlate);
  }

  for (let i = 0; i < baseplates.length; i++) {
    let baseplate = baseplates[i];
    let tileCols = baseplate.tileCols;
    let c0 = baseplate.leftSteps * rowsPerPlate;
    let r0 = baseplate.downSteps * rowsPerPlate;

    for (let c = 0; c < tileCols.length; c++) {
      let tileCol = tileCols[c];
      let c1 = c0 + c;
      let totalTileCol = totalTileCols[c1];

      for (let r = 0; r < tileCol.length; r++) {
        let marker = tileCol[r];
        let r1 = r0 + r;

        totalTileCol[r1] = marker;
      }
    }
  }

  // Write the grid to a string.
  // [0,0] is the top right corner, so reading it by incr columns and rows is the same as rotating the grid to read normal English.
  for (let c = 0; c < totalTileCols.length; c++) {
    let tileCol = totalTileCols[c];

    for (let r = 0; r < tileCol.length; r++) {
      let marker = tileCol[r];

      if (marker == null) {
        englishStr += " ";
      } else {
        englishStr += marker.translation;
      }
    }

    englishStr += "\n";
  }

  return englishStr;
}

