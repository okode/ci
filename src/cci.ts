import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';
import commandLineArgs from 'command-line-args';
import { Logger } from './logger';
import { exit } from 'shelljs';
import { CICommand } from './ci';
import { CordovaCommand } from './cordova';

export class CCI {

  private help() {
    const usage: commandLineUsage.Section[] = [
      {
        header: 'Usage',
        content: `${chalk.dim('$')} ${chalk.green('cci <command>')} ${chalk.green.dim('[<args>] [--help] [options]')}`
      },
      {
        header: 'Command List',
        content: [
          { name: chalk.green('ci'), summary: 'CI utilities'},
          { name: chalk.green('cordova'), summary: 'Cordova utilities' }
        ]
      }
    ];

    console.log(commandLineUsage(usage));

  }

  run() {
    let success: boolean | Promise<boolean> = true;

    const optionDefs: commandLineArgs.OptionDefinition[] = [
      { name: 'command', defaultOption: true }
    ];

    const options = commandLineArgs(optionDefs, { stopAtFirstUnknown: true });
    if (options.command == undefined) options.command = 'help';

    switch (options.command) {
      case 'help': this.help(); break;
      case 'ci':      success = new CICommand().run(options._unknown); break;
      case 'cordova': success = new CordovaCommand().run(options._unknown); break;
      default: {
        Logger.error(`Unable to find command: ${options.command}`);
        this.help();
       }; break;
    }

    return success;
  }

}

let success = new CCI().run() as boolean | Promise<boolean>;
if (typeof success == 'boolean') {
  exit(success ? 0 : 1);
} else {
  success
  .then(result => { exit(result ? 0 : 1); })
  .catch(() => { exit(1); });
}