// A micro-lib with the bare minimum vector operations needed for this project.

function lerp(a, b, frac) {
  return a + (b - a) * frac;
}

function getDistance(p1, p2) {
  return vectorLength(vectorSub(p1, p2));
}

function isPointWithin(p1, p2, dist) {
  return getDistance(p1, p2) <= dist;
}

function vectorLength(p) {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

function vectorAdd(p1, p2) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function vectorAddPiece(p1, p2x, p2y) {
  return { x: p1.x + p2x, y: p1.y + p2y };
}

function vectorSub(p1, p2) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function vectorScale(p, s) {
  return { x: p.x * s, y: p.y * s };
}

function vectorLerp(p1, p2, frac) {
  return { x: lerp(p1.x, p2.x, frac), y: lerp(p1.y, p2.y, frac) };
}
