/**
 * Naive CSV line parser
 * It just loops through all chars of the line, separating values with provided separator or comma.
 * String values could be surrounded by double quotes
 * @module src/parsers/parseCsvLine
 * @author Cyril LD
 */
module.exports = (line) => {
  const data = [];
  let value = null;
  let inString = false;

  for (var i = 0; i < line.length() ; i++) {
    var char = line.charAt(i);

    // If not inside of a value surrounded by " "
    if (!inString) {
      if (char === '"') { // firts " surrounding a value
        inString = true;  // Set the flag for next char
        value = '';       // and reset value
        continue;
      }
      if (char === ',') { // value separator, add the value to the data array, then reset and continue
        if (/^\d+[\.,]?\d+$/.test(value)) {
          data.push(parseFloat(value.replace(',', '.')));
        } else if (value !== null && value !== undefined){
          data.push(value.trim());
        }
        value = null;
        continue;
      }
      value = value || '';
      value += char;
    }
    else
    {
      if (char === '"') { // End of a value surrounded by " "
        inString = false;
        continue;
      }
      value += char;
      continue;
    }
  }
  return data;
}
