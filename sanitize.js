const fs = require("fs")
const stdin = require("./stdin")

stdin(input => console.log(sanitize(input)))

function sanitize(s) {
  return s
    .toLowerCase()
    .replace('’', "'")
    .split(/[^a-z'ßäöüáéíóúāēīōūñ-]+/)
    .join(" ")
}
