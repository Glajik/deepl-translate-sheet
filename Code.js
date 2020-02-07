/* SETTINGS */
var columnsToTranslate = ['H', 'I', 'J', 'Q'];
var sourceSheetName = 'Source';
var outputSheetName = 'Output';

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