const fs = require('fs');
const {extensionConfigs} = require(__dirname + "/../tests/test_utils");
const ratings = require(__dirname + "/../../store/ratings.json");

const generateExtensionsList = () => {
    const dir = __dirname + '/../../.auto-generated';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const ratingForTitle = new Map(ratings.map(r => [r.extension, r.rating]));
    const authorsData = new Map();

    const allExtensionConfigs = extensionConfigs();
    for(const config of allExtensionConfigs) {
        const rating = config.rating = ratingForTitle.get(config.title);
        config.rating = rating === undefined ? 0 : rating;

        for (const author of config.authors) {
            if (!authorsData.has(author.name)) authorsData.set(author.name, {extCount: 0, reputation: 0});
            authorsData.get(author.name).extCount += 1;
            authorsData.get(author.name).reputation += config.rating;
        }
    }

    for(const config of allExtensionConfigs) {
        for (const author of config.authors) {
            author.extensionsCount = authorsData.get(author.name).extCount;
            author.reputation = authorsData.get(author.name).reputation;
        }
    }


    fs.writeFileSync(
        `${dir}/extensions.json`,
        JSON.stringify(extensionConfigs(), null, 2)
    );
}

module.exports = {
    generateExtensionsList
}
