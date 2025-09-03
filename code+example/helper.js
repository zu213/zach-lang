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