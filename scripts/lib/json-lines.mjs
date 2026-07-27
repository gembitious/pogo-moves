// Serialize generated JSON with ONE TOP-LEVEL RECORD PER LINE.
//
// Still valid, still essentially minified (one extra newline byte per record), but a
// one-entry change now diffs as one line instead of rewriting the whole file. The
// previous `JSON.stringify(x)` wrote everything on a single line, so every weekly data
// refresh showed up as a whole-file replacement that nobody could review.
export function jsonLines(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return '[\n' + value.map((v) => JSON.stringify(v)).join(',\n') + '\n]'
  }
  const keys = Object.keys(value)
  if (keys.length === 0) return '{}'
  return '{\n' + keys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(value[k])}`).join(',\n') + '\n}'
}
