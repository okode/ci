import { Command } from './command';
import { Logger } from './logger';
import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';
import commandLineArgs from 'command-line-args';
import { expect } from 'chai';
import { Utils } from './utils';

export class CICommand implements Command {

  private help() {
    const usage: commandLineUsage.Section[] = [
      {
        header: 'cci ci',
        content: 'These commands integrate with CI (CircleCI), which brings continuous integration to your app.'
      },
      {
        header: 'Usage',
        content: `${chalk.dim('$')} ${chalk.green('cci ci <command>')}`
      },
      {
        header: 'Command List',
        content: [
          { name: chalk.green('install'), summary: 'Install requirements' },
          { name: chalk.green('keychain <devpass> <distpass>'), summary: 'Install iOS certificates' }
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
      case 'install': success = this.install(); break;
      case 'keychain': success = this.keychain(options._unknown); break;
      default: {
        success = false;
        this.help();
      }; break;
    }

    return success;
  }

  private install() {
    try {
      const tag = process.env.CIRCLE_TAG;
      const nativeBuild = tag != undefined;
      const distBuild = nativeBuild && tag!.endsWith('-dist');
      const cordovaVersion = '8.1.2';
      const fastlaneVersion = '2.138.0';
      switch (process.env.CIRCLE_JOB! as 'ios' | 'android') {
        case 'ios': {
          Utils.exec(`sudo gem install fastlane -v ${fastlaneVersion}`);
          Utils.exec(`npm install --quiet -g ionic firebase-tools cordova@${cordovaVersion}`);
          if (nativeBuild) {
            Utils.exec('HOMEBREW_NO_AUTO_UPDATE=1 brew install github-release');
          }
        }; break;
        case 'android': {
          Utils.exec('sudo npm install --quiet -g ionic firebase-tools');
          if (nativeBuild) {
            Utils.exec('yes | sdkmanager --licenses');
            Utils.exec('yes | sdkmanager "build-tools;28.0.3"');
            Utils.exec('yes | sdkmanager "platforms;android-28"');
            Utils.exec('yes | sdkmanager "platform-tools"');
            Utils.exec('yes | sdkmanager "tools"');
            Utils.exec(`sudo npm install --quiet -g cordova@${cordovaVersion}`);
            Utils.exec('cordova telemetry off');
            const gradleVersion = '5.0';
            Utils.exec(`curl https://downloads.gradle.org/distributions/gradle-${gradleVersion}-bin.zip > /tmp/gradle-${gradleVersion}-bin.zip`);
            Utils.exec(`sudo unzip -qq /tmp/gradle-${gradleVersion}-bin.zip -d /tmp && rm /tmp/gradle-${gradleVersion}-bin.zip`);
            Utils.exec(`sudo mv /tmp/gradle-${gradleVersion} /opt/gradle`);
            Utils.exec('sudo ln -s /opt/gradle/bin/gradle /usr/local/bin/gradle');
            Utils.exec('sudo mkdir -p /opt/github-release');
            Utils.exec('sudo curl -L https://github.com/aktau/github-release/releases/download/v0.7.2/linux-amd64-github-release.tar.bz2 | sudo tar -xjC /opt/github-release');
            Utils.exec('sudo ln -s /opt/github-release/bin/linux/amd64/github-release /usr/local/bin/github-release');
            if (distBuild) {
              Utils.exec('gem install fastlane -NV');
            }
          }
        }; break;
      };
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }

  private keychain(options?: string[]) {
    try {
      expect(options && options.length == 2, 'Invalid options: required <devpass> and <distpass>').to.be.true;
      const devPass = options![0];
      const distPass = options![1];
      const keyChain = 'ios-build.keychain';
      const keyChainPass = 'circleci';
      const certDir = 'certs';
      const tag = process.env.CIRCLE_TAG;
      const nativeBuild = tag != undefined;
      const distBuild = nativeBuild && tag!.endsWith('-dist');
      const packageName = Utils.getAppPackageName();
      const provInfoDebug = Utils.getProvisioningInfo('debug')!;
      const provInfoRelease = Utils.getProvisioningInfo('release')!;
      const teamId = provInfoDebug.developmentTeam;
      const devProvisioning = provInfoDebug.provisioninProfile;
      const distProvisioning = provInfoRelease.provisioninProfile;
      Utils.exec(`security create-keychain -p ${keyChainPass} ${keyChain}`);
      Utils.exec(`security unlock-keychain -p ${keyChainPass} ${keyChain}`);
      Utils.exec(`security set-keychain-settings -t 3600 -u ${keyChain}`);
      Utils.exec(`security list-keychains -s ${keyChain}`);
      Utils.exec(`security default-keychain -s ${keyChain}`);
      Utils.exec(`security import ${certDir}/apple-wwdcrca.cer -k ${keyChain} -T /usr/bin/codesign`);
      if (Utils.fileExists(`${certDir}/development.cer`)) {
        Utils.exec(`security import ${certDir}/development.cer -k ${keyChain} -A`);
      }
      Utils.exec(`security import ${certDir}/development.p12 -k ${keyChain} -P ${devPass} -A`);
      if (Utils.fileExists(`${certDir}/distribution.cer`)) {
        Utils.exec(`security import ${certDir}/distribution.cer -k ${keyChain} -A`);
      }
      Utils.exec(`security import ${certDir}/distribution.p12 -k ${keyChain} -P ${distPass} -A`);
      Utils.exec(`security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k ${keyChainPass} ${keyChain}`);
      let cmd = `LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8                                      \
                 fastlane sigh                                                            \
                 --force                                                                  \
                 ${distBuild ? '' : '--development'}                                      \
                 --app_identifier    "${packageName}"                                     \
                 --provisioning_name "${distBuild ? distProvisioning : devProvisioning}"  \
                 --team_id           "${teamId}"                                          \
                 ${distBuild ? '' : '--cert_owner_name "Okode Developers"'}`;
      Utils.exec(cmd);
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }

}
