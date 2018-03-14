/**
 * CSV parser
 * Parses a buffer containing a csv file into an array of values
 * First line is used as fields identifiers
 * @module src/persers/parseCsv
 * @author Cyril LD
 */
import RecordParser from "vertx-js/record_parser";
import ParseCsvLine from "./parseCsvLine.js";


/**
 * Transforms an array of values into an object composed from key-value pairs
 * Keys comes from header parameter, and values from data.
 * @param { Array } datas The datas that must be converted into key-value
 * @param { Array } header Tha array of keys
 * @returns { Object }
 */
const formatObject = (datas, header) => {
   const obj = {};
   for (let key in header) {
     obj[header[key]] = datas[key];
   }
   return obj;
}


/**
 * Cleans an array of string by replacing characters that can't be used as keys in mongoDb.
 * @param { Array } datas Array of strings that must be cleaned
 * @returns { Object }
 */
const cleanHeader = datas => datas.map(prop =>
  prop
    .replace(/[\(\)\<\>\/\.°:,]/g, '')
    .replace(/[ ]/g, '_')
    .replace(/[éèêë]/g, 'e')
)
 

/**
* Parses a buffer containing a csv file into an array of values
 * @param { Buffer } buffer The buffer
 * @returns { Array }
 */
module.exports = (buffer) => {
  let header = null;
  const data = [];
  let i = 0;
  
  const parser = RecordParser.newDelimited("\n", line => {
    // parse header line
    if (i === 0) {
      header = cleanHeader(ParseCsvLine(line.toString()));
    } else {
      data.push(formatObject(ParseCsvLine(line.toString()), header));
    }
    i++;
  });

  // This handler does'nt work, and the 'parser.hanhle' below seems to work synchrone...
  parser.endHandler(f => {
    console.log("Parsing done");
  });

  // Sent the buffer into the RecordParser
  parser.handle(buffer);
  console.log(`CSV parsing finished with ${data.length} lines`);
  return data;
}