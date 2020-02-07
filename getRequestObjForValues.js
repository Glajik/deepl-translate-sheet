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