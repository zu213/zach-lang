/**
 * Flatten the array for changing
 * @param {Object[]} array of tokens.
 * @returns {string[]} - array of just strings.
 */
function flattenTokens(tokens){
    const returnArray = []
    for(let i = 0; i < tokens.length; i++){
        const currentToken = tokens[i]
        if(typeof currentToken === 'object'){
            const key = Object.keys(currentToken)[0]
            returnArray.push(key)
            returnArray.push(...flattenTokens(currentToken[key]));
        } else {
            returnArray.push(currentToken)
        }
    }
    return returnArray
}

/**
 * Print the tokenised code
 * @param {Object[]} array of tokens.
 */
function printTokens(tokens){
   for(const token of tokens) {
     if(typeof token === 'object'){
      console.log(Object.keys(token)[0])
      printTokens(Object.values(token)[0])
     } else if (typeof token == 'string') {
      console.log(token)
     } else {
        printTokens(token)
     }
   }
}

/**
 * Clears or creates the dist directory, then starts processing.
 * @param {string} inputPath - File or folder to process.
 * @returns {string[]} - array of just strings.
 */
function deepEqual(a, b) {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (a && b && typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

module.exports = { deepEqual }