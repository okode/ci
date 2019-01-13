import chalk from 'chalk';

export class Logger {

  static log(level: 'info' | 'warn' | 'error' | 'success', message: string) {
    let output = level in [ 'info', 'warn', 'success' ] ? console.log : console.error;
    let color = chalk.bold;
    if (level == 'warn') color = chalk.yellow.bold;
    if (level == 'success') color = chalk.green.bold;
    if (level == 'error') color = chalk.red.bold;
    output(`${chalk.dim('[')}${color(level.toUpperCase())}${chalk.dim(']')} ${message}`);
  }

  static info(message: string) {
    Logger.log('info', message);
  }

  static warn(message: string) {
    Logger.log('warn', message);
  }

  static error(error: string | Error) {
    let message: string;
    if (typeof error === 'string') {
      message = error;
    } else {
      message = error.message.split(':').shift()!;
    }
    Logger.log('error', message);
  }

  static success(message: string) {
    Logger.log('success', message);
  }

}
