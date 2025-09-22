/**
 * Strip the type from variable declaration.
 * @param {string} input string token where the tag is declared.
 * @returns {string} - valid js with the tag removed.
 */
function stripTag(string) {
  const splitByEquals = string.split('=')
  return splitByEquals[0].split(':')[0] + '=' + splitByEquals[1]
}

/**
 * Strips functions declarations down to valid JS.
 * @param {any[]} input list of tokens.
 * @returns {any[]} - output list of tokens where the bottom layer is valid js.
 */
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

/**
 * Strip a string removing the .zl notation.
 * @param {string} input .zl string.
 * @returns {string} - output valid js string.
 */
function stripStringToJS(stringToStrip){
  const commaSplit = stringToStrip.split(',').map(e => e.trim())
  return commaSplit.map(e => e.split('|')[0]).join(',')
}

module.exports = { stripTag, stripToJS };