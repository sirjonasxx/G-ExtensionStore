const imageType = require('image-type');
const sizeOf = require('image-size')
const { readdirSync, readFileSync } = require('fs');
const extensions = require('../store/extensions.json');
const { fileExists } = require('./test_utils');
const fs = require("fs");


const configuredExtensions = new Set(extensions.map(extension => extension.title));
const potentialFiles = new Set(["screenshot.png", "icon.png", "extension.zip"]);


readdirSync('./store/extensions/', { withFileTypes: true }).forEach((extension) => {

    it('is a directory', () => {
        expect(extension.isDirectory()).toBe(true);
    });

    it('is configured in extensions.json', () => {
        expect(configuredExtensions.has(extension.name)).toBe(true);
    });

    it('has an extension.zip file', () => {
        expect(fileExists(`./store/extensions/${extension.name}/extension.zip`)).toBe(true);
    });

    it('may have a screenshot', () => {
        const path = `./store/extensions/${extension.name}/screenshot.png`;
        if (fileExists(path)) {

            const buffer = readFileSync(path);
            const imgType = imageType(buffer);
            expect(imgType.ext).toBe('png');
            const dim = sizeOf(path);
            expect(dim.width).toBeLessThanOrEqual(800);
            expect(dim.height).toBeLessThanOrEqual(600);
            expect(dim.width).toBeGreaterThanOrEqual(300);
            expect(dim.height).toBeGreaterThanOrEqual(200);
        }
    });

    it('may have an icon', () => {
        const path = `./store/extensions/${extension.name}/icon.png`;
        if (fileExists(path)) {

            const buffer = readFileSync(path);
            const imgType = imageType(buffer);
            expect(imgType.ext).toBe('png');
            const dim = sizeOf(path);
            expect(dim.width).toEqual(40);
            expect(dim.height).toEqual(40);
        }
    });

    it('does not have other files', () => {
        fs.readdirSync(`./store/extensions/${extension.name}/`).forEach(file => {
            expect(potentialFiles.has(file)).toBe(true);
        });
    });

});

