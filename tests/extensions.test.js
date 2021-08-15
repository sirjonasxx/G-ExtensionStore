const extensions = require('../extensions.json');
const config = require('../config.json');
const fs = require('fs');
const moment = require("moment");
const { exists, validURL, isVersion } = require('./test_utils');

const countryCodes = new Set([".com.br", ".de", ".nl", ".es", ".fi", ".fr", ".it", ".com.tr", ".com"]);
const OSes = new Set(["Linux", "Windows", "Mac"]);
const clients = new Set(["Unity", "Flash"]);
const allCategories = new Set(config.categories.map(c => c.name));
const frameworks = new Map(config.frameworks.map((f) => [f.name, {... f, languages: new Set(f.languages)}]));



it('has unique extension titles', () => {
    const allNames = new Set(extensions.map(extension => extension.title));
    expect(allNames.size === extensions.length);
})

for(const e of extensions) {

    describe('extension config syntax & validity', () => {
        it('has a title', () => {
            expect(typeof e.title).toBe("string");
        });

        it('has a description', () => {
            expect(typeof e.description).toBe("string");
        });

        it('has a valid author', () => {
            expect(typeof e.author.name).toBe("string");
            expect(!exists(e.author.discord) || e.author.discord.match(".*#[0-9]{4}$")).not.toBe(null);
            expect(!exists(e.author.hotel) || countryCodes.has(e.author.hotel)).toBe(true);
            expect(!exists(e.author.username) || typeof e.author.username === "string").toBe(true);
        });

        it('has a valid version', () => {
            expect(isVersion(e.version)).toBe(true);
        });

        it('has at least one category', () => {
            expect(e.categories.length >= 1).toBe(true);
        });

        it.each(e.categories)("has a valid category", (category) => {
            expect(allCategories.has(category)).toBe(true);
        })

        it('has a source which is an URL', () => {
            expect(validURL(e.source)).toBe(true);
        });

        it('may have a readme which is an URL', () => {
            expect(!exists(e.readme) || validURL(e.readme)).toBe(true);
        });

        it('is stable or unstable', () => {
            expect(typeof e.stable).toBe("boolean");
        });

        it('has a framework', () => {
            expect(frameworks.has(e.framework.name)).toBe(true);
            expect(isVersion(e.framework.version));
        });

        it('has a language that matches the framework', () => {
            expect(frameworks.get(e.framework.name).languages.has(e.language)).toBe(true);
        });

        it('uses the cookie, port and filename in the command', () => {
            expect(e.command).toContain("{cookie}");
            expect(e.command).toContain("{port}");
            expect(e.command).toContain("{filename}");
        });

        it('has valid compatibilities', () => {
            expect(e.compatibility.systems.length > 0).toBe(true);
            expect(e.compatibility.clients.length > 0).toBe(true);
            expect(e.compatibility.systems.every((system) => OSes.has(system))).toBe(true);
            expect(e.compatibility.clients.every((client) => clients.has(client))).toBe(true);
        });

        it('has valid submission date', () => {
            const submission = moment(e.submissionDate, "DD-MM-YYYY hh:mm:ss");
            expect(submission.isValid()).toBe(true);
            expect(submission < moment().add(1, 'days')).toBe(true);
        });

        it('has valid submission date', () => {
            const update = moment(e.updateDate, "DD-MM-YYYY hh:mm:ss");
            expect(update.isValid()).toBe(true);
            expect(update < moment().add(1, 'days')).toBe(true);

            const submission = moment(e.submissionDate, "DD-MM-YYYY hh:mm:ss");
            expect(update >= submission).toBe(true);
        });
    });

    it('exists in store', () => {
        // validity of store stuff happens in store.test.js, only check existence here

        expect(fs.existsSync(`./store/${e.title}/`)).toBe(true);
    });

}

