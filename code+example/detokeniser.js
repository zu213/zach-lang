/**
 * Recursively join the tokenised code with \n characters
 * @param {Object[]} array of tokens.
 * @returns {string} - string of joined up code.
 */
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
      if(key.startsWith('=>')){
        const lineSplit = key.split('=>')
        array[i - 1] += lineSplit[0] + '=>'
        array[i] = `${lineSplit[1]} \n ${value} ${key.endsWith('(') ? ')' : key.endsWith('{') ? '}' : '\n'}`
      } else {
        array[i] = `${key} \n ${value} \n ${key.endsWith('(') ? ')' : key.endsWith('{') ? '}' : '\n'}`
      }
    }
  }
  return array.join('\n')
}

/**
 * Adds rules for joining, atm only has custom rules for for
 * @param {string} key name e.g. 'for'.
 * @param {string} value content e.g.(const a of b).
 * @returns {string} - string of joined up code.
 */
function joinRespectingKey(key, value){
    if(key.includes('for')) return value.join(';')
    return recursiveJoin(value)
}

module.exports = { recursiveJoin }