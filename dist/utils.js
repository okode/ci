"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const xmljs = __importStar(require("xml-js"));
const shelljs_1 = require("shelljs");
const chai_1 = require("chai");
let replace = require('replace');
class Utils {
    static getAppPackageName() {
        switch (Utils.getAppNativeTechnology()) {
            case 'cordova':
                const xmlData = fs.readFileSync('config.xml').toString();
                return JSON.parse(xmljs.xml2json(xmlData, { compact: true })).widget._attributes.id;
            case 'capacitor':
                const jsonData = fs.readFileSync('capacitor.config.json').toString();
                return JSON.parse(jsonData).appId;
            default:
                return undefined;
        }
    }
    static getAppNativeTechnology() {
        if (fs.existsSync('config.xml')) {
            return 'cordova';
        }
        if (fs.existsSync('capacitor.config.json')) {
            return 'capacitor';
        }
        return 'unknown';
    }
    static getProvisioningInfo(type) {
        switch (Utils.getAppNativeTechnology()) {
            case 'cordova':
                let buildJsonPath = 'build.json';
                if (!Utils.fileExists(buildJsonPath)) {
                    return undefined;
                }
                let buildJson = JSON.parse(fs.readFileSync(buildJsonPath, 'utf8'));
                let info = buildJson.ios[type];
                return {
                    provisioninProfile: info.provisioningProfile,
                    developmentTeam: info.developmentTeam
                };
            case 'capacitor':
                const provisioninProfile = `${Utils.getAppPackageName()} ${type === 'debug' ? 'Development' : 'Distribution'}`;
                const xcodeprojText = fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj').toString();
                const developmentTeam = xcodeprojText.match(/DEVELOPMENT_TEAM = (.*);/)[1];
                return { provisioninProfile, developmentTeam };
            default:
                return undefined;
        }
    }
    static replaceInFiles(regex, replacement, path = '.', recursive = true) {
        replace({
            regex: regex,
            replacement: replacement,
            paths: [path],
            recursive: recursive,
            silent: true
        });
    }
    static exec(command) {
        chai_1.expect(shelljs_1.exec(command).code).equals(0);
    }
    static fileExists(path) {
        try {
            return fs.statSync(path).isFile();
        }
        catch (error) {
            return false;
        }
    }
    static directoryExists(path) {
        try {
            return fs.statSync(path).isDirectory();
        }
        catch (error) {
            return false;
        }
    }
}
exports.Utils = Utils;
