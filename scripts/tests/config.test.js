const config = require('../../store/config.json');
const {fileExists, validURL, exists} = require("./test_utils");

const categoryNames = new Set(config.categories.map(c => c.name));
it("has unique category names", () => {
    expect(categoryNames.size === config.categories.length).toBe(true);
});

it.each(config.categories)("is a valid category", category => {
    expect(typeof category.name).toBe("string");
    expect(typeof category.description).toBe("string");
    expect(category.name).not.toBe("");
    expect(category.description).not.toBe("");
    expect(fileExists(`./assets/icons/${category.icon}`)).toBe(true);
});

const frameworkNames = new Set(config.frameworks.map(c => c.name));
it("has unique framework names", () => {
    expect(frameworkNames.size === config.frameworks.length).toBe(true);
});
it.each(config.frameworks)("is a valid framework", category => {
    expect(typeof category.name).toBe("string");
    expect(typeof category.description).toBe("string");
    expect(category.developers.length).toBeGreaterThanOrEqual(1);
    expect(category.developers.every(d => typeof d === "string")).toBe(true);
    expect(category.languages.length).toBeGreaterThanOrEqual(1);
    expect(category.languages.every(d => typeof d === "string")).toBe(true);
    expect(validURL(category.source)).toBe(true);
    expect(typeof category.installation.required === "boolean").toBe(true);
    if (category.installation.required) {
        expect(validURL(category.installation.instructions)).toBe(true);
    }
    else {
        expect(!exists(category.installation.instructions) ||
            validURL(category.installation.instructions)).toBe(true);
    }

});
