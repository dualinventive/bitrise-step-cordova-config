const Config = require('cordova-config');
const XmlReader = require('xml-reader');
const xmlQuery = require('xml-query');
const path = require('path');
const fs = require('fs');

const {log} = require('./lib/utils');

const SOURCE_PATH = process.env['BITRISE_SOURCE_DIR'];
const CONFIG_FILE_PATH = process.env['config_path'] || 'config.xml';

const NAME = process.env['name'];
const ID = process.env['id'];

const ANDROID_VERSION_CODE = process.env['android_version_code'];
const ANDROID_PACKAGE_NAME = process.env['android_package_name'];
const IOS_BUNDLE_VERSION = process.env['ios_bundle_version'];
const IOS_BUNDLE_IDENTIFIER = process.env['ios_bundle_identifier'];

// Load and parse the config.xml
const config = new Config(path.join(SOURCE_PATH, CONFIG_FILE_PATH));

if (NAME) {
    config.setName(NAME);

    log('name', NAME);
}

if (ID) {
    config.setID(ID);

    log('id', ID);
}

if (ANDROID_VERSION_CODE) {
    config.setAndroidVersionCode(ANDROID_VERSION_CODE);

    log('android-versionCode', ANDROID_VERSION_CODE);
}

if (ANDROID_PACKAGE_NAME) {
    config.setAndroidPackageName(ANDROID_PACKAGE_NAME);

    log('android-packageName', ANDROID_PACKAGE_NAME);
}

if (IOS_BUNDLE_VERSION) {
    config.setIOSBundleVersion(IOS_BUNDLE_VERSION);

    log('ios-CFBundleVersion', IOS_BUNDLE_VERSION);
}

if (IOS_BUNDLE_IDENTIFIER) {
    config.setIOSBundleIdentifier(IOS_BUNDLE_IDENTIFIER);

    log('ios-CFBundleIdentifier', IOS_BUNDLE_IDENTIFIER);
}

// Write the config file
config.writeSync();

// Replace the id or package name in the google-services.json files
if (ID || ANDROID_PACKAGE_NAME) {
    const pkg = ID ? ID : ANDROID_PACKAGE_NAME;
    const xml = require('fs').readFileSync(path.join(SOURCE_PATH, CONFIG_FILE_PATH)).toString().replace(/<\?xml.*\?>/, '');
    const ast = XmlReader.parseSync(xml);

    const gsJsonFiles = [];
    xmlQuery(ast).find('resource-file').each(node => {
        const src = xmlQuery(node).attr('src');

        if (/.*google-services.json/.test(src)) {
            gsJsonFiles.push(xmlQuery(node).attr('src'))
        }
    });

    gsJsonFiles.forEach(gsJsonFile => {
        const gsJsonFilePath = path.join(SOURCE_PATH, gsJsonFile);
        const gsData = JSON.stringify(fs.readFileSync(gsJsonFilePath, 'utf8')).replace(/(\\"package_name\\":(| )\\")(.*?)(\\")/, `$1${pkg}$4`);
        fs.writeFileSync(gsJsonFilePath, JSON.parse(gsData), 'utf8');
        log(`${gsJsonFilePath} package_name`, pkg);
    });
}
