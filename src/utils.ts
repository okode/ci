import * as fs from 'fs-extra';
import * as xmljs from 'xml-js';
import { exec } from 'shelljs';
import { expect } from 'chai';

let replace: (options: {
  regex: string;
  replacement: string;
  paths: string[];
  recursive: boolean;
  silent: boolean
}) => void = require('replace');

export class Utils {

  static getAppPackageName() {
    switch (Utils.getAppNativeTechnology()) {
      case 'cordova':
        const xmlData = fs.readFileSync('config.xml').toString();
        return JSON.parse(xmljs.xml2json(xmlData, { compact: true })).widget._attributes.id as string | undefined;
      case 'capacitor':
        const jsonData = fs.readFileSync('capacitor.config.json').toString();
        return JSON.parse(jsonData).appId as string | undefined;
      default:
        return undefined;
    }
  }

  static getAppNativeTechnology(): 'cordova' | 'capacitor' | 'unknown' {
    if (fs.existsSync('config.xml')) {
      return 'cordova';
    }
    if (fs.existsSync('capacitor.config.json')) {
      return 'capacitor';
    }
    return 'unknown';
  }

  static getProvisioningInfo(type: 'debug' | 'release') {
    switch (Utils.getAppNativeTechnology()) {
      case 'cordova':
        let buildJsonPath = 'build.json';
        if (!Utils.fileExists(buildJsonPath)) {
          return undefined;
        }
        let buildJson = JSON.parse(fs.readFileSync(buildJsonPath, 'utf8'));
        let info = buildJson.ios[type];
        return {
          provisioninProfile: info.provisioningProfile as string,
          developmentTeam: info.developmentTeam as string
        };
      case 'capacitor':
        const provisioninProfile = `${Utils.getAppPackageName()} ${type === 'debug' ? 'Development' : 'Distribution'}`;
        const xcodeprojText = fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj').toString();
        const developmentTeam = xcodeprojText.match(/DEVELOPMENT_TEAM = (.*);/)![1];
        return { provisioninProfile, developmentTeam };
      default:
        return undefined;
    }
  }

  static replaceInFiles(regex: string, replacement: string, path = '.', recursive = true) {
    replace({
      regex: regex,
      replacement: replacement,
      paths: [ path ],
      recursive: recursive,
      silent: true
    });
  }

  static exec(command: string) {
    expect(exec(command).code).equals(0);
  }

  static fileExists(path: string) {
    try {
      return fs.statSync(path).isFile();
    } catch (error) {
      return false;
    }
  }

  static directoryExists(path: string) {
    try {
      return fs.statSync(path).isDirectory();
    } catch (error) {
      return false;
    }
  }

}