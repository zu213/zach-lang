const { recursiveJoin } = require("./detokeniser")
const { deepEqual } = require("./helper")
const { stripTag, stripToJS } = require("./stripper")

/**
 * Check if the input is valid for compilation
 * @param {any[]} array of tokens.
 * @param {Object[]} array of rules.
 * @param {Object[]} array of variables.
 * @returns {string[]} - array of just strings.
 */
function enforceLanguageRules(tokens, rules=[], vars=[]){
  tokens = processVariables(tokens, vars)
  rules = collectRules(tokens)
  return applyRules(tokens, rules, vars)
}

/**
 * Extract all the variables from a array of tokens
 * @param {any[]} array of tokens.
 * @param {Object[]} array of pre-existing variables.
 * @returns {string[]} - array of variables.
 */
function processVariables(tokens, vars) {
  return tokens.map(token => {
    let name = typeof token === "object" ? Object.keys(token)[0] : token
    if (typeof name !== "string") return token

    // Test for varaible declarations
    if (/^(const|let|var)\b/.test(name)) {
      const [left, type] = name.split("=")[0].split(":")
      if (!type) return token

      const varName = left.replace(/^(?:const|let|var)\s+/, "").trim()
      vars.push({ var: varName, type: type.trim() })

      if (typeof token === "object") {
        return { [stripTag(name)]: Object.values(token)[0] }
      } else {
        return stripTag(name)
      }
    }

    return token
  })
}

/**
 * Collect all the rules form functions in the code
 * @param {any[]} array of tokens.
 * @returns {Object[]} - array of rules objects.
 */
function collectRules(tokens) {
  let rules = []

  for (let i = 0; i < tokens.length; i++) {
    const isObject = typeof tokens[i] === 'object'
    let name

    if (isObject) {
      name = Object.keys(tokens[i])[0]
      if (name.includes('function')) {
        rules.push(tokens[i])
      } else if (name.includes('=>') && i > 0) {
        rules.push(tokens[i - 1])
      }
    }
  }

  return rules.filter(e =>
    // Remove no string containing rules
    Object.values(e).every(
      v => v !== undefined && !(Array.isArray(v) && v.length === 0)
    )
  ).map(e => {
    // Clean up rules
    const rawName = Object.keys(e)[0]
    let obj = {}
    let functionName

    // Extract both function declarations and arrow functions declarations
    if (rawName.includes('=')) {
      const parts = rawName.split('=')[0].trim().split(/\s+/)
      functionName = parts[parts.length - 1]
    } else {
      const parts = rawName.split('function')
      functionName = parts[parts.length - 1].trim()
      if (functionName.endsWith("(")) functionName = functionName.slice(0, -1)
    }

    obj[functionName] = Object.values(e)[0]
    return obj
  })
}

/**
 * Check if the input is valid for compilation
 * @param {any[]} array of tokens.
 * @param {Object[]} array of rules.
 * @param {Object[]} array of variables.
 * @returns {string[]} - array of just strings.
 */
function applyRules(tokens, rules, vars) {
  // Setup mapping of function names to rules
  const ruleMap = new Map(rules.map(rule => [Object.keys(rule)[0], Object.values(rule)[0]]))

  return tokens.map(token => {
    if (typeof token !== "object") return token

    const tokenName = Object.keys(token)[0]
    const name = extractName(tokenName)

    // Check for validity of rules and get back stripped code
    if (ruleMap.has(name)) {
      const validated = validateRules(
        ruleMap.get(name),
        Object.values(token)[0][0],
        vars
      )
      if (validated === 1) return 1
      return { [tokenName]: [[validated]] }
    }

    // Recurse deeper if not a function call
    const validated = enforceLanguageRules(Object.values(token)[0], rules, vars)
    if (validated === 1) return 1
    return { [tokenName]: validated }
  })
}

/**
 * Extract the name (and type) of a declared variable.
 * @param {string} input string of array token
 * @returns {string} - string with just the name : tag.
 */
function extractName(str) {
  const match = str.match(/^(?:\s*(?:const|let|var)\s+)?([a-zA-Z_$][\w$]*)/);
  return match ? match[1] : null;
}

/**
 * Check if the rules sunmitted for a function vs the details are valid.
 * @param {any[]} array of rules to check.
 * @param {string} array of details to check the rules against.
 * @param {string[]} array of var declarations.
 * @returns {string[]} array of stripped to js strings.
 */
function validateRules(rules, details, vars){
  if(deepEqual(rules[0], details)) {
    // If equal its the declaration so we strip
    return stripToJS([details])
  }

  let errored = false

  if(typeof details == 'object'){
    // For these functiosn if a type is declared it must be declared on all of that level
    console.log(`Error: Inputted raw type instead of tagged variable near: ${recursiveJoin([details]).split('\n').join('')}`)
    ///errored = true
  } else {
    const newRuleList = transformRuleList(rules)
    const rule = newRuleList
    const detail = details

    // I've decided it only take variables as params to simplify so details should be string
    const splitDetails = detail.split(',')
    if(splitDetails.length != rule.length){
      errored = true
      console.log(`Error: Missing parameter in ${detail}`)
    }
    splitDetails = splitDetails.map(e => e.trim())
    for(let i =0; i < splitDetails.length; i++){
      const correctVar = vars.find(e => e['var'] == splitDetails[i])
      if(!correctVar || !correctVar['type']){
        errored = true
        console.log(`Error: Invalid type, no corresponding tag found for ${splitDetails[i].trim()}`)
      }
      else if(correctVar['type'].trim() != rule[i]['type'].trim()){
        errored = true
        console.log(`Error: Invalid type, expected ${rule[i]['type']} got ${correctVar['type']}`)
      }
    }

    // Use errored so we can collect all the errors
  }

  if(errored) return 1

  return details
}


/**
 * Transforms the rule list into objects which have names and types for easier comparison
 * @param {any[]} rule, list to transform.
 * @returns {Object[]} - list of rule objects.
 */
function transformRuleList(rule) {
  let newRuleList = []
  for(let i = 0; i < rule.length;  i++){
    if(typeof rule[i] == 'string'){
      // Bottom level rules
      const splitByComma = rule[i].split(',')
      if(splitByComma.length > 1){
        newRuleList = newRuleList.concat(transformRuleList(splitByComma))
      } else {
        const splitByBar = splitByComma[0].split('|')
        if(splitByBar.length > 1){
          newRuleList.push({name: splitByBar[0].trim(), tag: splitByBar[1]})
        }
      }
    } else {
      // process Object recursively until we get strings
      for(const key of Object.keys(rule[i])){
        const keySplit = key.split(',')
        if(keySplit.length > 1){
          for(let j = 0; j < keySplit.length - 1; j++){
            newRuleList = newRuleList.concat(transformRuleList([keySplit[j]]))
          }
        }
        if(rule.length - 1 >= i) continue
        const splitByComma = rule[i + 1].split(',')[0]
        if(splitByComma.includes('|')){
          newRuleList.push({name: keySplit[keySplit.length - 1].trim(), type: splitByComma.split('|')[1], value: transformRuleList(rule[i][key])})
        }
      }
    }
  }
  return newRuleList.filter(e => e.value || e.name != '')
}

module.exports = { enforceLanguageRules };