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
