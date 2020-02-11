/* SETTINGS */
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
}

/**
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

function translateSourceSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Remove old output sheet, if presented
  const oldSheet = ss.getSheetByName(outputSheetName);
  
  if (oldSheet) {
    ss.deleteSheet(oldSheet);
  }
  
  // Copy form source
  ss.getSheetByName(sourceSheetName)
    .copyTo(ss)
    .setName(outputSheetName);
  
  const sheet = ss.getSheetByName(outputSheetName);
  
  // Set focus to output sheet
  ss.setActiveSheet(sheet);

  // Get range by column name
  function getRange(A) {
    const last = sheet.getLastRow();
    const a1Notation = [A,5,':',A,last].join('');
    return sheet.getRange(a1Notation);
  };

  // Take column range, translate it and return values
  function translateRange(range) {
    // Take all values from range
    const values = range.getValues();
    Logger.log('values.length: %s', values.length);

    // Prepare request objects for each 50 cells in column.
    // One request for 50 sentences.
    const requests = byChunks(getRequestObjForValues, [], values);
    
    // Fetch all requests for column
    const responses = UrlFetchApp.fetchAll(requests);
    
    // Get new translated values
    const newValues = responses.map(processFetchAllResponse).reduce(unnest, []);
    
    // Remove validation
    const rules = newValues.map(
      function (row) { return [null] }
    );
    
    range.setDataValidations(rules);
    
    // Update range
    range.setValues(newValues);
  }
  

  // Translate all columns
  columnsToTranslate.map(getRange).forEach(translateRange);
}
