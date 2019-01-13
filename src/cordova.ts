import { Command } from './command';
import { Logger } from './logger';
import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';
import commandLineArgs from 'command-line-args';
import * as fs from 'fs-extra';
import { expect } from 'chai';
import { Utils } from './utils';

export class CordovaCommand implements Command {

  private help() {
    const usage: commandLineUsage.Section[] = [
      {
        header: 'cci cordova',
        content: 'These commands integrate with Apache Cordova, which brings native functionality to your app.'
      },
      {
        header: 'Usage',
        content: `${chalk.dim('$')} ${chalk.green('cci cordova <command>')}`
      },
      {
        header: 'Command List',
        content: [
          { name: chalk.green('fetch'), summary: 'Fetch plugins' }
        ]
      },
      {
        header: 'Options',
        content: [
          { name: chalk.green('--help'), summary: 'Show help' }
        ]
      }
    ];

    console.log(commandLineUsage(usage));
  }

  run(argv?: string[]) {

    let success = true;

    const options = commandLineArgs([{ name: 'command', defaultOption: true } ], { argv: argv || [], stopAtFirstUnknown: true });

    switch (options.command) {
      case 'help': this.help(); break;
      case 'fetch': success = this.fetch(); break;
      default: {
        success = false;
        this.help();
      }; break;
    }

    return success;
  }

  private fetch() {
    try {
      expect(Utils.directoryExists('node_modules'), 'Directory node_modules not found, please run npm install before').to.be.true;
      let fetchJSONPath = 'plugins/fetch.json';
      expect(Utils.fileExists(fetchJSONPath), `File ${fetchJSONPath} not found`).to.be.true;
      let fetch = JSON.parse(fs.readFileSync(fetchJSONPath, 'utf8'));
      for (let plugin in fetch) {
        Logger.info(`Fetching plugin: ${plugin}`);
        let src = `node_modules/${plugin}`;
        if (!Utils.directoryExists(src)) {
          if (!fetch[plugin].is_top_level) {
            Logger.info(`Skipping not top level plugin ${plugin}`);
            continue;
          }
          Logger.info(`Installing plugin via npm: ${fetch[plugin].source.id}`);
          try {
            Utils.exec(`npm install "${fetch[plugin].source.id}" --no-save`);
          } catch (error) {
            Logger.info(`Skipping plugin ${plugin}`);
            continue;
          }
        } else {
          fs.copySync(src, `plugins/${plugin}`);
        }
      }
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }

}
