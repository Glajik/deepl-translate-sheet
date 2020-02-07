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
