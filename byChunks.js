/**
 * Iterate through list, takes first 50 items, and apply function
 * to this sublist. Then add items to result list and do all again
 * for the rest of source list.
 * @param {Function} fn 
 * @param {Array} acc Accumulating results
 * @param {Array} list List of items to process
 */
function byChunks(fn, acc, list) {
  if (!list || !list.length) {
    return acc;
  }
  
  // Take first 50 item
  const chunk = list.slice(0, 50);

  // Apply function to chunk
  const processed = fn(chunk);

  if (chunk.length < 50) {
    return acc.concat(processed);
  }

  const rest = list.slice(50);

  return byChunks(fn, acc.concat(processed), rest);
}

