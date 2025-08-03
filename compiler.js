const fs = require('fs');
const path = require('path');

/**
 * Reads and compiles the content of a .zl file.
 * @param {string} filePath - Path to the .zl file.
 * @returns {string} - Content of the file.
 */
function compileFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return processFile(fileContent)
}

function processFile(code){
  const tokens = tokenizeRecursive(code)

    // Rules here

  console.log(tokens)


  const processedContent = recursiveJoin(tokens)
  return processedContent;
}

function recursiveJoin(array){
  for(let i = 0; i < array.length; i++){
    if(typeof array[i] === 'string' && array[i].includes('=>')){
        array[i - 1] += array[i]
        array[i] = ''
    }
    if(Array.isArray(array[i])){
      array[i] = recursiveJoin(array[i])
    } else if(typeof array[i] === 'object') {
      const key = Object.keys(array[i])[0]
      const value = joinRespectingKey(key, Object.values(array[i])[0])
      if(key.includes('=>')){
        array[i - 1] += `${key} \n ${value} ${key.endsWith('(') ? ')' : '}'}`
        array[i] = ''
      } else {
        array[i] = `${key} \n ${value} \n ${key.endsWith('(') ? ')' : '}'}`
      }
    }
  }
  return array.join('\n')
}

function joinRespectingKey(key, value){
    if(key.includes('for')) return value.join(';')
    return recursiveJoin(value)
}

function extractBlock(code, start) {
  const openChar = code[start];
  const closeChar = openChar === '{' ? '}' : ')';
  let depth = 1;
  let i = start + 1;

  while (i < code.length) {
    const char = code[i];

    if (char === openChar) depth++;
    else if (char === closeChar) depth--;

    if (depth === 0) {
      return {
        block: code.slice(start + 1, i),
        endIndex: i
      };
    }

    i++;
  }

  throw new Error(`Unmatched ${openChar} at position ${start}`);
}

function tokenizeRecursive(code, startIndex = 0) {
  const tokens = [];
  let current = '';
  let i = startIndex;
  const len = code.length;
  let inString = false;
  let stringChar = '';
  let commentLine = false;
  let commentBlock = false
  
  while (i < len) {
    const char = code[i];

    // Handle strings
    if (inString) {
      current += char;
      if (char === stringChar && code[i - 1] !== '\\') {
        inString = false;
      }
      i++;
      continue;
    }

    if (!commentBlock && !commentLine && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
      current += char;
      i++;
      continue;
    }

    // Handle blocks
    if (!commentLine && !commentBlock && !inString && (char === '{' || char === '(')) {

        current+= char
      // Push function signature before the block
      if (current.trim()) {
        const blockKey = current.trim();
        const { block, endIndex } = extractBlock(code, i);

        const tokenObj = {
          [blockKey]: tokenizeRecursive(block)
        };

        tokens.push(tokenObj);

        current = ''; // Reset current
        commentLine = false
        i = endIndex + 1;
        continue;
      }
    }

    if(!commentLine){
        if(char == '/' && i < len - 1 && code[i+1] == '/'){
            commentLine = true
            continue
        }
    }

    if(!commentBlock){
        if(char == '/' && i < len - 1 && code[i+1] == '*'){
            commentBlock = true
            continue
        }
    }

    if(commentBlock){
        if(char == '*' && i < len - 1 && code[i+1] == '/'){
            commentBlock = false
            continue
        }
    }

    // End of statement (at top level)
    if ((char === ';' || char === '\n')) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = '';
      i++;
      commentLine = false
      continue;
    }

    current += char;
    i++;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}




/**
 * Recursively copies files, compiling .zl files to .js
 * @param {string} inputPath - Path to source file or folder.
 * @param {string} distPath - Destination path.
 */
function processAndCopy(inputPath, baseDistPath) {
    const stats = fs.statSync(inputPath);

    if (stats.isFile()) {
        const relativePath = path.relative(process.cwd(), inputPath);
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