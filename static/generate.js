import {modelQuality} from "./improve.js"

export function generate() {
  let output = []
  for (let i = 0; i < 200; i++) {
    const w = generateWord()
    output.push([w, logLikelihood(w, model) / w.length])
  }
  return output
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w, l]) => w)
    .join("\n")
}

function generateWord() {
  let word = ""
  let c
  while ((c = model.predict(word)) !== "") {
    word += c
  }
  return word
}

export function logLikelihood(text, model) {
  let ret = 0
  const words = text.split(/\s+/)
  for (const w of words) {
    for (let i = 0; i <= w.length; i++) {
      const ch = w[i] || ""
      const prefix = w.slice(0, i)
      ret += Math.log(model.probability(prefix, ch))
    }
  }
  return ret
}
