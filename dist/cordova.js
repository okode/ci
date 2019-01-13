"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const chalk_1 = __importDefault(require("chalk"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const command_line_args_1 = __importDefault(require("command-line-args"));
const fs = __importStar(require("fs-extra"));
const chai_1 = require("chai");
const utils_1 = require("./utils");
class CordovaCommand {
    help() {
        const usage = [
            {
                header: 'cci cordova',
                content: 'These commands integrate with Apache Cordova, which brings native functionality to your app.'
            },
            {
                header: 'Usage',
                content: `${chalk_1.default.dim('$')} ${chalk_1.default.green('cci cordova <command>')}`
            },
            {
                header: 'Command List',
                content: [
                    { name: chalk_1.default.green('fetch'), summary: 'Fetch plugins' }
                ]
            },
            {
                header: 'Options',
                content: [
                    { name: chalk_1.default.green('--help'), summary: 'Show help' }
                ]
            }
        ];
        console.log(command_line_usage_1.default(usage));
    }
    run(argv) {
        let success = true;
        const options = command_line_args_1.default([{ name: 'command', defaultOption: true }], { argv: argv || [], stopAtFirstUnknown: true });
        switch (options.command) {
            case 'help':
                this.help();
                break;
            case 'fetch':
                success = this.fetch();
                break;
            default:
                {
                    success = false;
                    this.help();
                }
                ;
                break;
        }
        return success;
    }
    fetch() {
        try {
            chai_1.expect(utils_1.Utils.directoryExists('node_modules'), 'Directory node_modules not found, please run npm install before').to.be.true;
            let fetchJSONPath = 'plugins/fetch.json';
            chai_1.expect(utils_1.Utils.fileExists(fetchJSONPath), `File ${fetchJSONPath} not found`).to.be.true;
            let fetch = JSON.parse(fs.readFileSync(fetchJSONPath, 'utf8'));
            for (let plugin in fetch) {
                logger_1.Logger.info(`Fetching plugin: ${plugin}`);
                let src = `node_modules/${plugin}`;
                if (!utils_1.Utils.directoryExists(src)) {
                    if (!fetch[plugin].is_top_level) {
                        logger_1.Logger.info(`Skipping not top level plugin ${plugin}`);
                        continue;
                    }
                    logger_1.Logger.info(`Installing plugin via npm: ${fetch[plugin].source.id}`);
                    try {
                        utils_1.Utils.exec(`npm install "${fetch[plugin].source.id}" --no-save`);
                    }
                    catch (error) {
                        logger_1.Logger.info(`Skipping plugin ${plugin}`);
                        continue;
                    }
                }
                else {
                    fs.copySync(src, `plugins/${plugin}`);
                }
            }
            return true;
        }
        catch (error) {
            logger_1.Logger.error(error);
            return false;
        }
    }
}
exports.CordovaCommand = CordovaCommand;
