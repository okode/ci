"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const chalk_1 = __importDefault(require("chalk"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const command_line_args_1 = __importDefault(require("command-line-args"));
const chai_1 = require("chai");
const utils_1 = require("./utils");
class CICommand {
    help() {
        const usage = [
            {
                header: 'cci ci',
                content: 'These commands integrate with CI (CircleCI), which brings continuous integration to your app.'
            },
            {
                header: 'Usage',
                content: `${chalk_1.default.dim('$')} ${chalk_1.default.green('cci ci <command>')}`
            },
            {
                header: 'Command List',
                content: [
                    { name: chalk_1.default.green('install'), summary: 'Install requirements' },
                    { name: chalk_1.default.green('keychain <devpass> <distpass>'), summary: 'Install iOS certificates' }
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
            case 'install':
                success = this.install();
                break;
            case 'keychain':
                success = this.keychain(options._unknown);
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
    install() {
        try {
            const tag = process.env.CIRCLE_TAG;
            const nativeBuild = tag != undefined;
            const distBuild = nativeBuild && tag.endsWith('-dist');
            const cordovaVersion = '8.1.2';
            switch (process.env.CIRCLE_JOB) {
                case 'ios':
                    {
                        utils_1.Utils.exec('source /usr/local/opt/chruby/share/chruby/chruby.sh && chruby 2.5 && sudo gem install fastlane');
                        utils_1.Utils.exec(`npm install --quiet -g ionic cordova@${cordovaVersion}`);
                        if (nativeBuild) {
                            utils_1.Utils.exec('HOMEBREW_NO_AUTO_UPDATE=1 brew install github-release');
                        }
                    }
                    ;
                    break;
                case 'android':
                    {
                        utils_1.Utils.exec('sudo npm install --quiet -g ionic');
                        if (nativeBuild) {
                            utils_1.Utils.exec('yes | sdkmanager --licenses');
                            utils_1.Utils.exec('yes | sdkmanager "build-tools;28.0.3"');
                            utils_1.Utils.exec('yes | sdkmanager "platforms;android-28"');
                            utils_1.Utils.exec('yes | sdkmanager "platform-tools"');
                            utils_1.Utils.exec('yes | sdkmanager "tools"');
                            utils_1.Utils.exec(`sudo npm install --quiet -g cordova@${cordovaVersion}`);
                            utils_1.Utils.exec('cordova telemetry off');
                            const gradleVersion = '5.0';
                            utils_1.Utils.exec(`curl https://downloads.gradle.org/distributions/gradle-${gradleVersion}-bin.zip > /tmp/gradle-${gradleVersion}-bin.zip`);
                            utils_1.Utils.exec(`sudo unzip -qq /tmp/gradle-${gradleVersion}-bin.zip -d /tmp && rm /tmp/gradle-${gradleVersion}-bin.zip`);
                            utils_1.Utils.exec(`sudo mv /tmp/gradle-${gradleVersion} /opt/gradle`);
                            utils_1.Utils.exec('sudo ln -s /opt/gradle/bin/gradle /usr/local/bin/gradle');
                            utils_1.Utils.exec('sudo mkdir -p /opt/github-release');
                            utils_1.Utils.exec('sudo curl -L https://github.com/aktau/github-release/releases/download/v0.7.2/linux-amd64-github-release.tar.bz2 | sudo tar -xjC /opt/github-release');
                            utils_1.Utils.exec('sudo ln -s /opt/github-release/bin/linux/amd64/github-release /usr/local/bin/github-release');
                            if (distBuild) {
                                utils_1.Utils.exec('gem install fastlane -NV');
                            }
                        }
                    }
                    ;
                    break;
            }
            ;
            return true;
        }
        catch (error) {
            logger_1.Logger.error(error);
            return false;
        }
    }
    keychain(options) {
        try {
            chai_1.expect(options && options.length == 2, 'Invalid options: required <devpass> and <distpass>').to.be.true;
            const devPass = options[0];
            const distPass = options[1];
            const keyChain = 'ios-build.keychain';
            const keyChainPass = 'circleci';
            const certDir = 'certs';
            const tag = process.env.CIRCLE_TAG;
            const nativeBuild = tag != undefined;
            const distBuild = nativeBuild && tag.endsWith('-dist');
            const packageName = utils_1.Utils.getAppPackageName();
            const provInfoDebug = utils_1.Utils.getProvisioningInfo('debug');
            const provInfoRelease = utils_1.Utils.getProvisioningInfo('release');
            const teamId = provInfoDebug.developmentTeam;
            const devProvisioning = provInfoDebug.provisioninProfile;
            const distProvisioning = provInfoRelease.provisioninProfile;
            utils_1.Utils.exec(`security create-keychain -p ${keyChainPass} ${keyChain}`);
            utils_1.Utils.exec(`security unlock-keychain -p ${keyChainPass} ${keyChain}`);
            utils_1.Utils.exec(`security set-keychain-settings -t 3600 -u ${keyChain}`);
            utils_1.Utils.exec(`security list-keychains -s ${keyChain}`);
            utils_1.Utils.exec(`security default-keychain -s ${keyChain}`);
            utils_1.Utils.exec(`security import ${certDir}/apple-wwdcrca.cer -k ${keyChain} -T /usr/bin/codesign`);
            if (utils_1.Utils.fileExists(`${certDir}/development.cer`)) {
                utils_1.Utils.exec(`security import ${certDir}/development.cer -k ${keyChain} -A`);
            }
            utils_1.Utils.exec(`security import ${certDir}/development.p12 -k ${keyChain} -P ${devPass} -A`);
            if (utils_1.Utils.fileExists(`${certDir}/distribution.cer`)) {
                utils_1.Utils.exec(`security import ${certDir}/distribution.cer -k ${keyChain} -A`);
            }
            utils_1.Utils.exec(`security import ${certDir}/distribution.p12 -k ${keyChain} -P ${distPass} -A`);
            utils_1.Utils.exec(`security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k ${keyChainPass} ${keyChain}`);
            let cmd = `LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8                                      \
                 fastlane sigh                                                            \
                 --force                                                                  \
                 ${distBuild ? '' : '--development'}                                      \
                 --app_identifier    "${packageName}"                                     \
                 --provisioning_name "${distBuild ? distProvisioning : devProvisioning}"  \
                 --team_id           "${teamId}"                                          \
                 ${distBuild ? '' : '--cert_owner_name "Okode Developers"'}`;
            utils_1.Utils.exec(cmd);
            return true;
        }
        catch (error) {
            logger_1.Logger.error(error);
            return false;
        }
    }
}
exports.CICommand = CICommand;
