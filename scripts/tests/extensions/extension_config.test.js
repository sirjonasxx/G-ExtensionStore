const extension_configTest = require('../../../store/config.json');
const cur_extensions = require('../../../.auto-generated/extensions.json');
const fs = require('fs');
const moment = require("moment");
const { exists, validURL, isVersion, extensionConfigs} = require('../test_utils');
const {readdirSync} = require("fs");

const extensions = extensionConfigs();
const countryCodes = new Set([".com.br", ".de", ".nl", ".es", ".fi", ".fr", ".it", ".com.tr", ".com"]);
const OSes = new Set(["Linux", "Windows", "Mac"]);
const clients = new Set(["Unity", "Flash", "Nitro", "Origins"]);
const allCategories = new Set(extension_configTest.categories.map(c => c.name));
const frameworks = new Map(extension_configTest.frameworks.map((f) => [f.name, {... f, languages: new Set(f.languages)}]));



it('has unique extension titles', () => {
    const allNames = new Set(extensions.map(extension => extension.title.toLowerCase()));
    expect(allNames.size === extensions.length);
})

for(const e of extensions) {

    describe('extension syntax & validity', () => {
        it('has a valid title', () => {
            expect(typeof e.title).toBe("string");
            expect(e.title.match("^[^_.]+$") !== null).toBe(true);
            expect(e.title.length).toBeGreaterThan(4);
        });

        it('has a description', () => {
            expect(typeof e.description).toBe("string");
        });

        it('has at least one author', () => {
            expect(e.authors.length).toBeGreaterThanOrEqual(1);
        })

        it.each(e.authors)('has a valid author', (author) => {
            expect(typeof author.name).toBe("string");
            expect(!exists(author.discord) || author.discord.match("(?:.*#[0-9]{4}|^(?:[a-z0-9_]*(?:(?:^|[a-z0-9_])\.(?:[a-z0-9_]|$))?[a-z0-9_]*)*)$")).not.toBe(null);
            expect(!exists(author.hotel) || countryCodes.has(author.hotel)).toBe(true);
            expect(!exists(author.username) || typeof author.username === "string").toBe(true);
            expect(!exists(author.twitter) || typeof author.twitter === "string").toBe(true);
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

        it('may have a releases which is an URL', () => {
            expect(!exists(e.releases) || validURL(e.releases)).toBe(true);
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

            const checkCommand = (command) => {
                expect(command).toContain("{cookie}");
                expect(command).toContain("{port}");
                expect(command).toContain("{filename}");
            }

            checkCommand(e.commands.default.join(" "));
            [... OSes].map(OS => OS.toLowerCase())
                .filter(OS => exists(e.commands[OS]))
                .forEach(OS => checkCommand(e.commands[OS].join(" ")));

        });

        it('has valid compatibilities', () => {
            expect(e.compatibility.systems.length > 0).toBe(true);
            expect(e.compatibility.clients.length > 0).toBe(true);
            expect(e.compatibility.systems.every((system) => OSes.has(system))).toBe(true);
            expect(e.compatibility.clients.every((client) => clients.has(client))).toBe(true);
        });

        it('has valid submission date', () => {
            expect(/[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}/g.test(e.submissionDate)).toBe(true);
            const submission = moment(e.submissionDate, "DD-MM-YYYY hh:mm:ss");
            expect(submission.isValid()).toBe(true);
            expect(submission < moment().add(1, 'days')).toBe(true);
            
            const cur_e = cur_extensions.find((ext) => ext.title === e.title);
            if (cur_e) {
                expect(e.submissionDate === cur_e.submissionDate).toBe(true);
            }
        });

        it('has valid update date', () => {
            expect(/[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}/g.test(e.updateDate)).toBe(true);
            const update = moment(e.updateDate, "DD-MM-YYYY hh:mm:ss");
            expect(update.isValid()).toBe(true);
            expect(update < moment().add(1, 'days')).toBe(true);

            const submission = moment(e.submissionDate, "DD-MM-YYYY hh:mm:ss");
            expect(update >= submission).toBe(true);
            
            const cur_e = cur_extensions.find((ext) => ext.title === e.title);
            if (cur_e) {
                const cur_update = moment(cur_e.updateDate, "DD-MM-YYYY hh:mm:ss");
                expect(update >= cur_update).toBe(true);
            }
        });

        it('has the isOutdated field', () => {
            expect(typeof e.isOutdated).toBe("boolean");
        });
    });

}

