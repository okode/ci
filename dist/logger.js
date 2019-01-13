"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    static log(level, message) {
        let output = level in ['info', 'warn', 'success'] ? console.log : console.error;
        let color = chalk_1.default.bold;
        if (level == 'warn')
            color = chalk_1.default.yellow.bold;
        if (level == 'success')
            color = chalk_1.default.green.bold;
        if (level == 'error')
            color = chalk_1.default.red.bold;
        output(`${chalk_1.default.dim('[')}${color(level.toUpperCase())}${chalk_1.default.dim(']')} ${message}`);
    }
    static info(message) {
        Logger.log('info', message);
    }
    static warn(message) {
        Logger.log('warn', message);
    }
    static error(error) {
        let message;
        if (typeof error === 'string') {
            message = error;
        }
        else {
            message = error.message.split(':').shift();
        }
        Logger.log('error', message);
    }
    static success(message) {
        Logger.log('success', message);
    }
}
exports.Logger = Logger;
