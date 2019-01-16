"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const command_line_args_1 = __importDefault(require("command-line-args"));
const logger_1 = require("./logger");
const shelljs_1 = require("shelljs");
const ci_1 = require("./ci");
const cordova_1 = require("./cordova");
class CCI {
    help() {
        const usage = [
            {
                header: 'Usage',
                content: `${chalk_1.default.dim('$')} ${chalk_1.default.green('cci <command>')} ${chalk_1.default.green.dim('[<args>] [--help] [options]')}`
            },
            {
                header: 'Command List',
                content: [
                    { name: chalk_1.default.green('ci'), summary: 'CI utilities' },
                    { name: chalk_1.default.green('cordova'), summary: 'Cordova utilities' }
                ]
            }
        ];
        console.log(command_line_usage_1.default(usage));
    }
    run() {
        let success = true;
        const optionDefs = [
            { name: 'command', defaultOption: true }
        ];
        const options = command_line_args_1.default(optionDefs, { stopAtFirstUnknown: true });
        if (options.command == undefined)
            options.command = 'help';
        switch (options.command) {
            case 'help':
                this.help();
                break;
            case 'ci':
                success = new ci_1.CICommand().run(options._unknown);
                break;
            case 'cordova':
                success = new cordova_1.CordovaCommand().run(options._unknown);
                break;
            default:
                {
                    logger_1.Logger.error(`Unable to find command: ${options.command}`);
                    this.help();
                }
                ;
                break;
        }
        return success;
    }
}
exports.CCI = CCI;
let success = new CCI().run();
if (typeof success == 'boolean') {
    shelljs_1.exit(success ? 0 : 1);
}
else {
    success
        .then(result => { shelljs_1.exit(result ? 0 : 1); })
        .catch(() => { shelljs_1.exit(1); });
}
