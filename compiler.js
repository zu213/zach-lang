const fs = require('fs');
const path = require('path');

/**
 * Reads and returns the content of a .zl file as a string.
 * @param {string} filePath - Path to the .zl file.
 * @returns {string} - File contents as a string.
 * @throws {Error} - If the file does not end with .zl or cannot be read.
 */
function compile(filePath) {
    if (typeof filePath !== 'string') {
        throw new Error('File path must be a string.');
    }

    if (!filePath.endsWith('.zl')) {
        throw new Error('File must have a .zl extension.');
    }

    try {
        const absolutePath = path.resolve(filePath);
        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        return fileContent;
    } catch (err) {
        throw new Error(`Failed to read file: ${err.message}`);
    }
}

// CLI handler
if (require.main === module) {
    const inputPath = process.argv[2];
    if (!inputPath) {
        console.error('Usage: node yourscript.js <path-to-file.zl>');
        process.exit(1);
    }

    try {
        const content = compile(inputPath);
        console.log('File Content:\n', content);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = { compile };
