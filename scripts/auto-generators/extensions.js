const mkdirp = require('mkdirp');
const fs = require('fs');
const {extensionConfigs} = require("../tests/test_utils");
const getDirName = require('path').dirname;

const generateExtensionsList = () => {
    const dir = __dirname + '/../../auto-generated';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    fs.writeFileSync(
        `${dir}/extensions.json`,
        JSON.stringify(extensionConfigs(), null, 2)
    );
}

module.exports = {
    generateExtensionsList
}
