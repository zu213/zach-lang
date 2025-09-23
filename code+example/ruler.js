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
      } else if (name.includes('=>')) {
        rules.push(tokens[i - 1])
      }
    }
  }

  // remove empty rules
  rules = rules.filter(e =>
    Object.values(e).every(
      v => v !== undefined && !(Array.isArray(v) && v.length === 0)
    )
  )

  // clean up function keys
  return rules.map(e => {
    const rawName = Object.keys(e)[0]
    let obj = {}
    let functionName

    if (rawName.includes('=')) {
      const parts = rawName.split('=')[0].trim().split(/\s+/)
      functionName = parts[parts.length - 1]
    } else {
      const parts = rawName.split('function')
      functionName = parts[parts.length - 1].trim()
      if (functionName.endsWith("(")) {
        functionName = functionName.slice(0, -1)
      }
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
  const ruleNames = rules.map(e => Object.keys(e)[0])

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (typeof token !== 'object') continue

    const tokenName = Object.keys(token)[0]
    let updated = false
    let obj = {}

    // check if it's a function call
    const name = extractName(tokenName)
    for (const ruleName of ruleNames) {
      if (name === ruleName) {
        const currentRule = rules.find(e => Object.keys(e)[0] === ruleName)
        const validated = validateRules(
          Object.values(currentRule)[0],
          Object.values(token)[0][0],
          vars
        )

        if (validated === 1) return 1
        obj[tokenName] = [[validated]]
        tokens[i] = obj
        updated = true
        break
      }
    }

    if (!updated) {
      const validated = enforceLanguageRules(Object.values(token)[0], rules, vars)
      if (validated === 1) return 1
      obj[tokenName] = validated
      tokens[i] = obj
    }
  }

  return tokens
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
 * @returns {string[]} - array of stripped to js strings.
 */
function validateRules(rules, details, vars){
  if(deepEqual(rules[0], details)) {
    // If equal its the declaration so we strip
    return stripToJS([details])
  }

  if(typeof details == 'object'){
    // for these functiosn if a type is declared it must be declared on all of that level
    console.log(`Error: Inputted raw type instead of tagged varaible near: ${recursiveJoin([details]).split('\n').join('')}`)
  } else {
    const newRuleList = transformRuleList(rules)
    const rule = newRuleList
    const detail = details

    let errored = false
    //i've decide i only take varaibles as params to simplify so details should be string
    const splitDetails = detail.split(',')
    if(splitDetails.length != rule.length){
      // Error 
      errored = true
      console.log(`Error: Missing parameter in ${detail}`)
    }
    splitDetails.map(e => e.trim())
    for(let i =0; i < splitDetails.length; i++){
      const correctVar = vars.find(e => e['var'] == splitDetails[i]) //['type']
      if(!correctVar || !correctVar['type']){
        errored = true
        console.log(`Error: Invalid type, no corresponding tag found for ${splitDetails[i].trim()}`)
      }
      else if(correctVar['type'].trim() != rule[i]['type'].trim()){
        errored = true
        console.log(`Error: Invalid type, expected ${rule[i]['type']} got ${correctVar['type']}`)
      }
    }

    if(errored){
      // error
      return 1
    }
  }

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
      // bottom level rules
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
      // object
      for(const key of Object.keys(rule[i])){
        const keySplit = key.split(',')
        if(keySplit.length > 1){
          for(let j = 0; j < keySplit.length - 1; j++){
            newRuleList = newRuleList.concat(transformRuleList([keySplit[j]]))
          }
        }
        if(rule.length - 1 == i) continue
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