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