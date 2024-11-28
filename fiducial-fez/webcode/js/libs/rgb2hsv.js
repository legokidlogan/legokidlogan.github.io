
// Reference: http://en.wikipedia.org/wiki/HSL_color_space
function rgb2hsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    var v = Math.max(r, g, b)
    var s = v - Math.min(r, g, b);
    var h = s;

    if (s != 0) {
        if (v == r) {
            h = (g - b) / s;
        } else if (v == g) {
            h = 2 + (b - r) / s;
        } else if (v == b) {
            h = 4 + (r - g) / s;
        }
    }

    if (h < 0) {
        h += 6;
    }

    h *= 60;

    if (v != 0) {
        s /= v;
    }

    return [h, s, v];
}
