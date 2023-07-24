"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const fs = require("fs");
const path = require("path");
const io_utils_1 = require("./io-utils");
const signing_1 = require("./signing");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (process.env.DEBUG_ACTION === 'true') {
                core.debug("DEBUG FLAG DETECTED, SHORTCUTTING ACTION.");
                return;
            }
            const releaseDir = core.getInput('releaseDirectory');
            const signingKeyBase64 = core.getInput('signingKeyBase64');
            const alias = core.getInput('alias');
            const keyStorePassword = core.getInput('keyStorePassword');
            const keyPassword = core.getInput('keyPassword');
            console.log(`Preparing to sign key @ ${releaseDir} with signing key`);
            // 1. Find release files
            const releaseFiles = (0, io_utils_1.findReleaseFiles)(releaseDir);
            if (releaseFiles !== undefined && releaseFiles.length !== 0) {
                // 3. Now that we have a release files, decode and save the signing key
                const signingKey = path.join(releaseDir, 'signingKey.jks');
                fs.writeFileSync(signingKey, signingKeyBase64, 'base64');
                // 4. Now zipalign and sign each one of the the release files
                let signedReleaseFiles = [];
                let index = 0;
                for (let releaseFile of releaseFiles) {
                    core.debug(`Found release to sign: ${releaseFile.name}`);
                    const releaseFilePath = path.join(releaseDir, releaseFile.name);
                    let signedReleaseFile = '';
                    if (releaseFile.name.endsWith('.apk')) {
                        signedReleaseFile = yield (0, signing_1.signApkFile)(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
                    }
                    else if (releaseFile.name.endsWith('.aab')) {
                        signedReleaseFile = yield (0, signing_1.signAabFile)(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
                    }
                    else {
                        core.error('No valid release file to sign, abort.');
                        core.setFailed('No valid release file to sign.');
                    }
                    // Each signed release file is stored in a separate variable + output.
                    core.exportVariable(`SIGNED_RELEASE_FILE_${index}`, signedReleaseFile);
                    core.setOutput(`signedReleaseFile${index}`, signedReleaseFile);
                    signedReleaseFiles.push(signedReleaseFile);
                    ++index;
                }
                // All signed release files are stored in a merged variable + output.
                core.exportVariable(`SIGNED_RELEASE_FILES`, signedReleaseFiles.join(":"));
                core.setOutput('signedReleaseFiles', signedReleaseFiles.join(":"));
                core.exportVariable(`NOF_SIGNED_RELEASE_FILES`, `${signedReleaseFiles.length}`);
                core.setOutput(`nofSignedReleaseFiles`, `${signedReleaseFiles.length}`);
                // When there is one and only one signed release file, stoire it in a specific variable + output.
                if (signedReleaseFiles.length == 1) {
                    core.exportVariable(`SIGNED_RELEASE_FILE`, signedReleaseFiles[0]);
                    core.setOutput('signedReleaseFile', signedReleaseFiles[0]);
                }
                console.log('Releases signed!');
            }
            else {
                core.error("No release files (.apk or .aab) could be found. Abort.");
                core.setFailed('No release files (.apk or .aab) could be found.');
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
