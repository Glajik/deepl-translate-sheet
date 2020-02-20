/* SETTINGS */
var contentStartRow = 5;
var columnsToTranslate = ['H', 'I', 'J', 'Q'];
var sourceSheetName = 'Source';
var outputSheetName = 'Output';

/**
 * Simple trigger. When user open document,
 * add item to main menu.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('DeepL')
    .addItem('Translate', 'translateSourceSheet')
    .addSeparator()
    .addItem('Show usage', 'makeMonitoringUsageRequest')
    .addItem('Update API key', 'updateApiKeyDialog')
    .addToUi();
}

/**
 * Iterate through list, takes first 50 items, and apply function
 * to this sublist. Then add items to result list and do all again
 * for the rest of source list.
 * @param {Function} fn 
 * @param {Array} acc Accumulating results
 * @param {Array} list List of items to process
 */
function byChunks(fn, acc, list) {
  if (!list || !list.length) {
    return acc;
  }
  
  // Take first 50 item
  const chunk = list.slice(0, 50);

  // Apply function to chunk
  const processed = fn(chunk);

  if (chunk.length < 50) {
    return acc.concat(processed);
  }

  const rest = list.slice(50);

  return byChunks(fn, acc.concat(processed), rest);
}



function getColumnsA1Notation(sheet) {
  return function (letter) {
    const contentLastRow = sheet.getLastRow();
    return [letter, contentStartRow, ':', letter, contentLastRow].join('');
  }
}

/**
 * Get values from range on sheetA, processing and set to range on sheetB
 * @sig sheetA, sheetB, processFn -> a1Notation -> get rangeA values, apply process, set values to rangeB
 * @param {Sheet} sheetA 
 * @param {Sheet} sheetB 
 * @param {Function} processFn function that convert list of rowContents
 * 
 * @returns Function with a1Notation arg.
 */
function doing(sheetA, sheetB, processFn) {
  return function (a1Notation) {
    sheetB.getRange(a1Notation).setValues(
      processFn(sheetA.getRange(a1Notation).getValues())
    )
  }
}

// Prepare output sheet
function prepareOutput(sourceSheet, outputSheet) {
  // Copy headers
  const identity = function (values) { return values };
  const copyByA1Notation = doing(sourceSheet, outputSheet, identity);
  const headerStartRow = 1;
  const headerLastRow = contentStartRow - 1
  const headerA1Notation = [headerStartRow, headerLastRow].join(':');
  copyByA1Notation(headerA1Notation);

  // Get columns range list
  const getA1Notation = getColumnsA1Notation(sourceSheet);
  const a1NotationList = columnsToTranslate.map(getA1Notation);
  const rangeList = outputSheet.getRangeList(a1NotationList);

  // Remove data validations
  rangeList.clearDataValidations(); 

  // Clear all content on sheet excludes headers
  const contentLastRow = outputSheet.getLastRow();
  
  if (contentLastRow > headerLastRow) {
    const contentA1Notation = [contentStartRow, contentLastRow].join(':');
    outputSheet.getRange(contentA1Notation).clearContent();
  }
}

// Create new sheet by template, or reuse old output sheet
function insertSheetByTemplate(template) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const oldSheet = ss.getSheetByName(outputSheetName);
  
  if (oldSheet) {
    prepareOutput(template, oldSheet);

    // Set focus to output sheet
    ss.setActiveSheet(oldSheet);
    return oldSheet;
  }

  // Insert sheet after source sheet, use it as template
  const newSheet = ss.insertSheet(
    outputSheetName, template.getIndex(), { template: template }
  );

  prepareOutput(template, newSheet);

  return newSheet;
}

// Translate values of column range and return translated
function translateValues(values) {
  // Prepare request objects for each 50 cells in column.
  // One request for 50 sentences.
  const requests = byChunks(getRequestObjForValues, [], values);
  
  // Fetch all requests for column
  const responses = UrlFetchApp.fetchAll(requests);
  
  // Get new translated values
  return responses.map(processFetchAllResponse).reduce(unnest, []);
}

function translateSourceSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(sourceSheetName);
  const outputSheet = insertSheetByTemplate(sourceSheet);
  
  // Prepare functions
  const getA1Notation = getColumnsA1Notation(sourceSheet);
  const translate = doing(sourceSheet, outputSheet, translateValues);

  // Translate all columns
  columnsToTranslate.map(getA1Notation).forEach(translate);
}
/**
 * Join values to single string, return total count
 * @param {Number} acc Total count
 * @param {Array} values List of strings
 */
function count(acc, values) {
  return acc + values.join('').length;
}

// Flatten nested list, [[1, 2, 3], [4, 5], [6]] -> [1, 2, 3, 4, 5, 6]
function unnest(acc, list) {
  return acc.concat(list);
}

/**
 * Make request for column values
 * @param {Array} values Array of row values
 */
function getRequestObjForValues(values) {
  // Check count of chars, which should be lower than 30'000
  const countOfChars = values.reduce(count, 0);
  Logger.log('countOfChars: %s', countOfChars);
  if (countOfChars > 30000) {
    throw new Error('countOfChars should be lower than 30 000')
  }

  // Flatten nested list, [[1], [2], [3]] -> [1, 2, 3]
  const flatList = values.reduce(unnest, []);
  return makeTranslationRequestObj(flatList);
}/**
 * Make post request to Deepl API
 * Allows you to monitor how much you translate, as well as the limits set.
 * @see https://www.deepl.com/docs-api.html?part=other
 * @returns {Object}
 * Example response:
 * ```JS
 * {
 *   "character_count": 180118,
 *   "character_limit": 1250000
 * }
 * ```
 */
function makeMonitoringUsageRequest() {
  const request = makeRequestObj('/v2/usage');
  const response = UrlFetchApp.fetch(request.url, request);
  const data = processResponse(response);
  const count = data['character_count'];
  const limit = data['character_limit']
  const msg = ['Characters count: ', count, '. Your limit: ', limit].join('');
  const ui = SpreadsheetApp.getUi();
  ui.alert('Monitoring usage', msg, ui.ButtonSet.OK);
}
/**
 * Create request object to DeepL API. This is a common function, and not used directly.
 * Limits: The request size should not exceed 30kbytes. In case of HTTP response code 429, 
 * your application should be configured to resend the request again later rather than
 * constantly resending the request.
 * @param {*} path like '/v2/translate'
 * @param {*} [queryString] like 'text=Translate it', without auth_key parameter.
 * @returns {Object} Request object, that can be used in UrlFetchApp.fetchAll method
 */
function makeRequestObj(path, queryString) {
  queryString = queryString || ''; // Optional parameter, defaults is empty string

  const apiKey = PropertiesService.getScriptProperties().getProperty('DEEPL_API_KEY');
    
  if (!apiKey) {
    throw new Error('Deepl API key not specified. Please visit at main menu Setup -> Update API key');
  }
  
  const auth = 'auth_key=' + apiKey;
  
  const host = 'api.deepl.com';

  const url = ['https://', host, path, '?', auth].join('');

  const payload = [auth, queryString].join('&');

//  Logger.log('Url: %s', url);
//  Logger.log('Payload: %s', payload);

  const request = {
    url: url,
    method: 'post',
   'Content-Type': 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true // fetch doesn't throw an exception if the response code indicates failure
  };

  return request;
}
/**
 * Make post request to Deepl API.
 * Allows to translate texts. This synchronous call.
 * @see https://www.deepl.com/docs-api.html?part=translating_text
 * @param {Array} lines List of texts to be translated. For single text, can be used String type.
 * Only UTF8-encoded plain text is supported. The parameter may be specified multiple times and 
 * translations are returned in the same order as they are requested. Each of the parameter values 
 * may contain multiple sentences. Up to 50 texts can be sent for translation in one request.
 * @param {string} [sourceLang='DE'] Language of the text to be translated.
 * @param {string} [targetLang='FR'] The language into which the text should be translated.
 * 
 * Options currently available:
 * - "EN" - English
 * - "DE" - German
 * - "FR" - French
 * - "ES" - Spanish
 * - "PT" - Portuguese
 * - "IT" - Italian
 * - "NL" - Dutch
 * - "PL" - Polish
 * - "RU" - Russian
 * 
 * @returns {Object}
 * Expample response:
 * ```JS
 * {
 *   "translations": [
 *     {"detected_source_language":"EN", "text":"Das ist der erste Satz."},
 *     {"detected_source_language":"EN", "text":"Das ist der zweite Satz."},
 *     {"detected_source_language":"EN", "text":"Dies ist der dritte Satz."}
 *   ]
 * }
 * ```
 */
function makeTranslationRequestObj(lines, sourceLang, targetLang) {
  if (!lines || !lines.length) {
    throw new Error('Parameter "lines" is required. Type should be String or Array.');
  }
  
  // If lines is a string, turns it to array
  lines = typeof(lines) === 'string' ? [lines] : lines;
  
  // default parameters
  sourceLang = sourceLang || 'DE';
  targetLang = targetLang || 'FR';

  if (lines.length > 50) {
    throw new Error('Up to 50 texts can be sent for translation in one request.');
  }
  
  const texts = lines.map(
    function(line) { return 'text='.concat(encodeURIComponent(line)) }
  );
  
  const queryString = [
    'source_lang=' + sourceLang,
    'target_lang=' + targetLang,
  ].concat(texts).join('&');

  return makeRequestObj('/v2/translate', queryString);
}

function processResponse(response) {
  if (response.getResponseCode() !== 200) {
    // See Error handling at https://www.deepl.com/docs-api.html?part=accessing
    throw new Error(response.getContentText());
  }

  const headers = response.getHeaders();

  const contentType = headers['Content-Type'];

  if (!contentType) {
    throw new Error('No header "Content-Type" in response');
  }

  const validContentType = /application\/json/.test(contentType);

  if (!validContentType) {
    throw new Error('Invalid content-type in response: ' + contentType);
  }

  const content = response.getContentText();

  const data = JSON.parse(content);

  Logger.log('Response: \n%s', data);

  return data;  
}

/**
 * Process response and convert it to column values
 * @param {text} response 
 */
function processFetchAllResponse(response) {
  const data = JSON.parse(response);
  
  if (!data.translations || data.translations.length === 0) {
    throw new Error('DeepL service no returns any translations. Maybe you reached your quota.');
  }
  
  // Get column values from translation list
  const values = data.translations.map(
    function (item) { return item.text }
  )
  
  // Restore valid stucture for range
  // [1, 2, 3] -> [[1], [2], [3]]
  return values.map(
    function (item) { return [item] }
  );
}
/**
 * Show prompt to update DeepL API key.
 * @see https://www.deepl.com/docs-api.html?part=accessing
 * Then save it to script properties.
 * To find where it stored, in current  editor window, visit:
 * File -> Project properties -> Script properties tab
 */
function updateApiKeyDialog() {
  const ui = SpreadsheetApp.getUi();
  const title = 'Update DeepL API key';
  const prompt = 'Warning: previous key will be overwritten.';
  const buttons = ui.ButtonSet.OK_CANCEL;
  const response = ui.prompt(title, prompt, buttons);
  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty('DEEPL_API_KEY', apiKey);
  }
}
