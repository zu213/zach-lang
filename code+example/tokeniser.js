/**
 * Extracts the string between two brackets to allow recursion
 * @param {string} string of code.
 * @param {string} start index.
 * @returns {Object{string, index}} - Object including block of relevant code and end index.
 */
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

/**
 * Goes through chracters of code and put them into lists of Objects
 * @param {string} string of code.
 * @returns {Object[]} - array of objects or strings.
 */
function tokenizeRecursive(code) {
  const tokens = [];
  let current = '';
  let i = 0;
  const len = code.length;
  let inString = false;
  let stringChar = '';
  let commentLine = false;
  let commentBlock = false
  
  // iterate through code characters
  while (i < len) {
    const char = code[i];

    // Turn off string skip
    if (inString) {
      current += char;
      if (char === stringChar && code[i - 1] !== '\\') {
        inString = false;
      }
      i++;
      continue;
    }

    // Turn on string skip
    if (!commentBlock && !commentLine && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
      current += char;
      i++;
      continue;
    }

    
    // turn off comment block skip
    if(commentBlock){
        if(char == '*' && i < len - 1 && code[i+1] == '/'){
            commentBlock = false
        }
        continue
    }

    // turn on comment skip
    if(!commentLine && !commentBlock && char == '/' && i < len - 1){
        if(code[i+1] == '/'){
            commentLine = true
            continue
        }
        if(code[i+1] == '*'){
            commentBlock = true
            continue
        }
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

  // End of file catch last line
  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

module.exports = { tokenizeRecursive };