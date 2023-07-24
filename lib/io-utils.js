"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findReleaseFiles = void 0;
const fs = require("fs");
function findReleaseFiles(releaseDir) {
    const releaseFiles = fs.readdirSync(releaseDir, { withFileTypes: true })
        .filter(item => !item.isDirectory())
        .filter(item => item.name.endsWith(".apk") || item.name.endsWith(".aab"));
    console.log("Found " + releaseFiles.length + " release files.");
    if (releaseFiles.length > 0) {
        return releaseFiles;
    }
}
exports.findReleaseFiles = findReleaseFiles;
