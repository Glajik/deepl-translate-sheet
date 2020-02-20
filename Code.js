/* SETTINGS */
var contentStartRow = 5;
var columnsToTranslate = ['H', 'I', 'J', 'Q'];
var sourceSheetName = 'Source';
var outputSheetName = 'Output';


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
