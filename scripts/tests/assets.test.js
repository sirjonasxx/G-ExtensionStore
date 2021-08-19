const {readdirSync, readFileSync} = require("fs");
const imageType = require('image-type');
const sizeOf = require('image-size')

it.each(readdirSync('./assets/icons/'))('is a valid icon', (icon) => {

    expect(icon.endsWith(".png")).toBe(true);

    const path = `./assets/icons/${icon}`;
    const buffer = readFileSync(path);
    const imgType = imageType(buffer);
    expect(imgType.ext).toBe('png');
    const dim = sizeOf(path);

    // will be rescaled to 40x40
    expect(dim.width).toBeLessThanOrEqual(80);
    expect(dim.height).toBeLessThanOrEqual(80);
    expect(dim.width).toBeGreaterThanOrEqual(20);
    expect(dim.height).toBeGreaterThanOrEqual(20);

});
