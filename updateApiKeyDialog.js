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