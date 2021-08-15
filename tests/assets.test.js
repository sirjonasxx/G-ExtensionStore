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
    expect(dim.width).toEqual(40);
    expect(dim.height).toEqual(40);

});
