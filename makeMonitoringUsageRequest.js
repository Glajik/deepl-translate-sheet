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