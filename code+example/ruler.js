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

  // get out function with no params
  rules = rules.filter(e =>
    Object.values(e).every(
      v => v !== undefined && !(Array.isArray(v) && v.length === 0)
    )
  )

  // clean up function keys
  rules = rules.map(e => {
    const unprocessedFunctionName = Object.keys(e)[0]
    let obj = {}
    if(unprocessedFunctionName.includes('=')){
      const unprocessedNameParts = unprocessedFunctionName.split('=')[0].trim().split(/\s+/)
      const functionName = unprocessedNameParts[unprocessedNameParts.length - 1]
      obj[functionName] = Object.values(e)[0]
      return obj
    } else {
      const unprocessedNameParts = unprocessedFunctionName.split('function')
      let functionName= unprocessedNameParts[unprocessedNameParts.length - 1].trim()
      if (functionName.endsWith("(")) {
        functionName = functionName.slice(0, -1);
      }
      obj[functionName] = Object.values(e)[0]
      return obj
    }


  })
  //console.log(tokens)

  const ruleNames = rules.map(e => Object.keys(e)[0])

  // Apply rules
  for(let i = 0; i < tokens.length; i++){
    const token = tokens[i]
    if(typeof token == 'object'){
      
      const tokenName = Object.keys(token)[0]
      let functionCall = false
      let obj = {}
      // search through rules if a function is being called
      for(const ruleName of ruleNames){
        if(tokenName.includes(ruleName)){
          functionCall = true
          obj[tokenName] = validateRule(rules.find(e => Object.keys(e) == ruleName), Object.values(token)[0])
          tokens[i] = obj
          break
        }
      }

      if(!functionCall){
        obj[tokenName] = enforceLanguageRules(Object.values(token)[0], rules)
        tokens[i] = obj
      }
    }
  }

  return tokens
    
}

function validateRule(rule, details){
  // is initial rule declaration
  if(Object.values(rule)[0] == details) {
    return stripToJS(details)
  }

  for(let  i = 0; i < details.length; i++) {
    if(!typeof details[i] == typeof rule[i]){
      //error
    }
    if(typeof details[i] == 'object'){
      validateRule(rule[i], details[i])
    }
  }

  //console.log(rule, 'details:',details)
  return details
}

function stripToJS(toStrip) {
  //console.log(toStrip)
  let outputArr = []
  for(const string of toStrip){
    if(typeof string === 'string'){
      outputArr.push(stripStringToJS(string))
    } else if(Array.isArray(string)) {
      outputArr.push(stripToJS(string))
    } else if(typeof string == 'object' && string !== null) {
      let obj = {}
      const key = stripStringToJS(Object.keys(string)[0])
      const value = Object.values(string)[0]
      obj[stripStringToJS(key)] = stripToJS([...value])
      outputArr.push(obj)
    }
  }
  return outputArr
}

function stripStringToJS(stringToStrip){
  const commaSplit = stringToStrip.split(',')
  //console.log(stringToStrip)
  return commaSplit.map(e => e.split('|')[0]).join(',')
}

module.exports = { enforceLanguageRules };