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