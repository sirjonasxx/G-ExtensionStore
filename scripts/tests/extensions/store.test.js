const imageType = require('image-type');
const sizeOf = require('image-size')
const { readdirSync, readFileSync } = require('fs');
const { fileExists, extensionConfigs} = require('../test_utils');
const fs = require("fs");

const extensions = extensionConfigs();
const configuredExtensions = new Set(extensions.map(extension => extension.title));
const potentialFiles = new Set(["screenshot.png", "extension.json", "icon.png", "extension.zip"]);


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
            expect(dim.width).toBeLessThanOrEqual(960);
            expect(dim.height).toBeLessThanOrEqual(1200);
            expect(dim.width).toBeGreaterThanOrEqual(128);
            expect(dim.height).toBeGreaterThanOrEqual(64);
        }
    });

    it('has an icon', () => {
        const path = `./store/extensions/${extension.name}/icon.png`;
        expect(fileExists(path)).toBe(true);

        const buffer = readFileSync(path);
        const imgType = imageType(buffer);
        expect(imgType.ext).toBe('png');
        const dim = sizeOf(path);
        // expect(dim.width).toEqual(40);
        // expect(dim.height).toEqual(40);

        // will be rescaled to 40x40
        expect(dim.width).toBeLessThanOrEqual(80);
        expect(dim.height).toBeLessThanOrEqual(80);
        expect(dim.width).toBeGreaterThanOrEqual(20);
        expect(dim.height).toBeGreaterThanOrEqual(20);
    });

    it('has an extensions.json file', () => {
        const path = `./store/extensions/${extension.name}/extension.json`;
        expect(fileExists(path)).toBe(true);

    });

    it('does not have other files', () => {
        fs.readdirSync(`./store/extensions/${extension.name}/`).forEach(file => {
            expect(potentialFiles.has(file)).toBe(true);
        });
    });

});

