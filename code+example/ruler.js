/**
 * Check if the input is valid for compilation
 * @param {Object[]} array of tokens.
 * @returns {string[]} - array of just strings.
 */
function enforceLanguageRules(tokens, rules=[], vars=[]){

  // Collect rules
  for(let i = 0; i < tokens.length; i++) {
    var name
    const object = typeof tokens[i] == 'object'
    if(object){
      name = Object.keys(tokens[i])[0]
      if(name.includes('function')) {
        rules.push(tokens[i])
      } else if(name.includes('=>')) {
        rules.push(tokens[i-1])
      }
     
    } else if(typeof tokens[i] == 'string'){
      name = tokens[i]
    }

    if(name.includes('const') || name.includes('var') || name.includes('let')) {
      const varInfo = name.split('=')[0].split(':')
      if(varInfo.length < 2) continue
      if(object){
        let obj = {}
        obj[stripTag(name)] = Object.values(tokens[i])[0]
        tokens[i] = obj
      } else {
        tokens[i] = stripTag(name)
      }
      const varObj = {var: varInfo[0].replace(/^(?:const|let|var)\s+/, '').trim(), type: varInfo[1].trim()}
      vars.push(varObj)
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
        const name = extractName(tokenName)
        if(name == ruleName){
          functionCall = true
          const currentRule = rules.find(e => Object.keys(e) == ruleName)
          obj[tokenName] = validateRules(Object.values(currentRule), Object.values(token), vars)
          tokens[i] = obj
          break
        }
      }

      if(!functionCall){
        obj[tokenName] = enforceLanguageRules(Object.values(token)[0], rules, vars)
        tokens[i] = obj
      }
    }
  }

  return tokens
    
}

function stripTag(string) {
  const splitByEquals = string.split('=')
  return splitByEquals[0].split(':')[0] + '=' + splitByEquals[1]
}

function extractName(str) {
  const match = str.match(/^(?:\s*(?:const|let|var)\s+)?([a-zA-Z_$][\w$]*)/);
  return match ? match[1] : null;
}

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

function validateRules(rules, details, vars){
  // is initial rule declaration
  if(deepEqual(rules, details)) {
    return stripToJS(details)
  }

  for(let  i = 0; i < details.length; i++) {
    if(!typeof details[i] == typeof rules[i]){
      //error
    }
    if(typeof details[i] == 'object'){
      //console.log('juan', rules[i], details[i], vars)
      //validateRule(rules[i], details[i])
    }
  }

  //console.log(rule, 'details:',details)
  return details
}

function validateRule(rule, detail, vars) {
  for(const ruleElement of rule){
    if(typeof ruleElement == 'string'){
      // bottom level rules
    } else if(Array.isArray(ruleElement)) {
      validateRule(ruleElement, detail, vars)
    } else {
      // object
      for(const key of Object.keys(ruleElement)){
        //validateRule(key, detail[key], vars)
      }
    }
  }
  return typeof rule === typeof detail
}

function stripToJS(toStrip) {
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
  const commaSplit = stringToStrip.split(',').map(e => e.trim())
  //console.log(stringToStrip)
  return commaSplit.map(e => e.split('|')[0]).join(',')
}

module.exports = { enforceLanguageRules };