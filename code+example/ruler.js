/**
 * Check if the input is valid for compilation
 * @param {Object[]} array of tokens.
 * @returns {string[]} - array of just strings.
 */
function enforceLanguageRules(tokens, rules=[]){

  // Collect rules
  for(let i = 0; i < tokens.length; i++) {
    if(typeof tokens[i] == 'object'){
      const name = Object.keys(tokens[i])[0]
      if(name.includes('function')) {
        rules.push(tokens[i])
      } else if(name.includes('=>')) {
        rules.push(tokens[i-1])
      }
    }
  }

  console.log(rules)

  // Apply rules
  for(const token of tokens){
    if(typeof token == 'object'){
      enforceLanguageRules(Object.values(token)[0], rules)
    }
  }
    
}

function stripToJS(stringToStrip) {
  return stringToStrip
}

module.exports = { enforceLanguageRules };