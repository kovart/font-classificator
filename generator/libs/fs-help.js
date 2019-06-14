const fs = require('fs')
const path = require('path')

/**
 *
 * @param {string} directory
 * @returns {string[]}
 */
function getFiles(directory){
    let files = fs.readdirSync(directory).filter(f => fs.statSync(path.resolve(directory, f)).isFile()).map(f => path.resolve(directory, f))
    return files
}

/**
 *
 * @param {string} directory
 * @returns {string[]}
 */
function getDirectories(directory){
    let directories = fs.readdirSync(directory).filter(f => fs.statSync(path.resolve(directory, f)).isDirectory()).map(f => path.resolve(directory, f))
    return directories
}

function createDirIfNotExists(dirPath) {
    try { fs.mkdirSync(dirPath) } catch (err) { if (err.code !== 'EEXIST') throw err }
}

function createDirRecursively(dir){
    fs.mkdirSync(dir, { recursive: true });
    // mkDirByPathSync(dir)
}

function mkDirByPathSync(targetDir, {isRelativeToScript = false} = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }

        return curDir;
    }, initDir);
}

module.exports = {
    getFiles,
    getDirectories,
    createDirIfNotExists,
    createDirRecursively
}
