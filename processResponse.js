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
