import { exec } from 'teen_process';
import log from '../logger.js';
import path from 'path';
import _ from 'lodash';
import {getJavaForOs} from "../helpers";

let bundletool = {};

/**
 * Check bundletool version
 *
 * @return {object} Version of bundletool. i.e., {major: 0, minor: 1, build: 0}
 * @throws {Error} If get version fails
 */
bundletool.version = async function () {
  try {
    const {stdout} = await exec(getJavaForOs(), [
      '-jar', path.resolve(this.helperJarPath, 'bundletool.jar'), 'version'
    ]);

    const versionMatcher = new RegExp(/BundleTool (\d+)\.?(\d+)?\.?(\d+)?/);
    const match = versionMatcher.exec(stdout);
    return {
      major: parseInt(match[1], 10),
      minor: match[2] ? parseInt(match[2], 10) : 0,
      build: match[3] ? parseInt(match[3], 10) : 0
    };
  } catch (e) {
    throw new Error(`Could not get bundle tool version. Original error ${e.message}`);
  }
};

/**
 * Install apks
 *
 * @param {string} apks - The full path to the local apks file.
 * @param {string} deviceId - The device serial to install the apks to.
 * @param {?Array<string>} modules - List of modules to be installed (defaults to all of them).
 *                           Note that the dependent modules will also be installed.
 *                           Ignored if the device receives a standalone APK.
 * @return {string} Command stdout
 * @throws {Error} If installation fails. e.g. INSTALL_PARSE_FAILED_NO_CERTIFICATES
 */
bundletool.installApks = async function (apks, deviceId, modules = []) {
  // TODO: Append install options after bundletool implement it.
  // https://github.com/google/bundletool/blob/f855ea639a02216780b2813ce29bd6e927ad4503/src/main/java/com/android/tools/build/bundletool/device/DdmlibDevice.java#L89-L107
  let installArgs = [
    '-jar', path.resolve(this.helperJarPath, 'bundletool.jar'), 'install-apks',
    '--apks', apks, '--device-id', deviceId
  ];

  if (!_.isEmpty(modules)) {
    installArgs.push('--modules', modules.join(','));
  }

  log.info(`Install apks with: ${installArgs}`);
  try {
    await exec(getJavaForOs(), installArgs);
  } catch (e) {
    throw new Error(`Failed to install apks. Original error ${e.message}`);
  }
};

/**
 * @typedef {object} BuildApksBuildApksOpts
 * @property {string} ks - Path to the keystore that should be used to sign the
 *                         generated APKs. If not set, the APKs will not be signed. If set, the
 *                         flag 'ks-key-alias' must also be set.
 * @property {string} ksKeyAlias - Alias of the key to use in the keystore to sign the generated APKs.
 * @property {string} ksPass - Alias of the key to use in the keystore to sign the generated APKs.
 *                             Password of the keystore to use to sign the generated APKs.
 *                             If provided, must be prefixed with either 'pass:' (if the password
 *                             is passed in clear text, e.g. 'pass:qwerty') or 'file:' (if the password
 *                             is the first line of a file, e.g. 'file:/tmp/myPassword.txt'). If this
 *                             flag is not set, the password will be requested on the prompt.
 * @property {boolean} overwrite - If set, any previous existing output will be overwritten.
 * @property {string} otherOptions - Add additional option
 */

/**
 * Check build version
 *
 * @param {string} bundle - The full path to the local `aab` file.
 * @param {string} deviceId - The device serial to install the apks to.
 * @param {string} outputApks - List of modules to be installed (defaults to all of them).
 *                           Note that the dependent modules will also be installed.
 *                           Ignored if the device receives a standalone APK.
 * @param {?BuildApksBuildApksOpts} buildApksOpts - Set of buildApks options.
 * @throws {Error} If building apks fails.
 */
bundletool.buildApks = async function (bundle, deviceId, outputApks, buildApksOpts = {}) {
  let buildApksArgs = [
    '-jar', path.resolve(this.helperJarPath, 'bundletool.jar'), 'build-apks',
    '--bundle', bundle,
    '--output', outputApks,
    '--connected-device', '--device-id', deviceId
  ];

  if (buildApksOpts.ks && buildApksOpts.ksKeyAlias) {
    buildApksArgs.push('--ks', buildApksOpts.ks);
    buildApksArgs.push('--ks-key-alias', buildApksOpts.ksKeyAlias);
  }

  if (buildApksOpts.ksPass) {
    buildApksArgs.push('--ks-pass', buildApksOpts.ksPass);
  }

  if (buildApksOpts.overwrite) {
    buildApksArgs.push('--overwrite');
  }

  if (buildApksOpts.otherOptions) {
    buildApksArgs.push(buildApksOpts.otherOptions);
  }

  log.info(`Build Apks apks with: ${buildApksArgs}`);
  try {
    await exec(getJavaForOs(), buildApksArgs);
  } catch (e) {
    throw new Error(`Failed to build apks. Original error ${e.message}`);
  }
};

export default bundletool;
