const fs = require('fs');
const path = require('path');
const { tokenizeRecursive } = require('./tokeniser.js');
const { enforceLanguageRules } = require('./ruler.js')
const { recursiveJoin } = require('./detokeniser.js')


/**
 * Reads and compiles the content of a .zl file.
 * @param {string} filePath - Path to the .zl file.
 * @returns {string} - Content of the file.
 */
function compileFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const tokens = tokenizeRecursive(fileContent)

  // Rules here
  processedTokens = enforceLanguageRules(tokens) 
  //const flatTokens = flattenTokens(tokens)
  // printTokens(tokens)

  const processedContent = recursiveJoin(tokens)
  return processedContent;
}

/**
 * Recursively copies files, compiling .zl files to .js
 * @param {string} inputPath - Path to source file or folder.
 * @param {string} distPath - Destination path.
 */
function processAndCopy(inputPath, baseDistPath) {
    const stats = fs.statSync(inputPath);

    if (stats.isFile()) {
        const distFilePath = path.join(baseDistPath, path.relative(path.resolve(inputPath, '..'), inputPath));

        const distDir = path.dirname(distFilePath);
        fs.mkdirSync(distDir, { recursive: true });

        const ext = path.extname(inputPath);
        if (ext === '.zl') {
            const compiled = compileFile(inputPath);
            const jsFilePath = distFilePath.replace(/\.zl$/, '.js');
            fs.writeFileSync(jsFilePath, compiled);
            console.log(`Compiled .zl -> .js: ${jsFilePath}`);
        } else {
            fs.copyFileSync(inputPath, distFilePath);
            console.log(`Copied file: ${distFilePath}`);
        }

    } else if (stats.isDirectory()) {
        const entries = fs.readdirSync(inputPath);
        for (const entry of entries) {
            const fullSrc = path.join(inputPath, entry);
            processAndCopy(fullSrc, baseDistPath);
        }
    }
}


/**
 * Clears or creates the dist directory, then starts processing.
 * @param {string} inputPath - File or folder to process.
 */
function compile(inputPath) {
    const resolvedInput = path.resolve(inputPath);
    if (!fs.existsSync(resolvedInput)) {
        throw new Error(`Path "${resolvedInput}" does not exist.`);
    }

    const distPath = path.resolve('./dist');

    // Clear existing dist folder
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
    }

    fs.mkdirSync(distPath);

    processAndCopy(resolvedInput, distPath);
    console.log('Successfully compiled to .js');
}

// CLI handler
if (require.main === module) {
    const inputPath = process.argv[2];
    if (!inputPath) {
        console.error('Usage: node compiler.js <path-to-file-or-folder>');
        process.exit(1);
    }

    try {
        compile(inputPath);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = { compile };