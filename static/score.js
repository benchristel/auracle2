import {model} from "./model.js"
import english from "./corpora/english.js"
import arabic from "./corpora/arabic.js"
import spanish from "./corpora/spanish.js"
import latin from "./corpora/latin.js"

const englishModel = model().feed(english).value()
const arabicModel  = model().feed(arabic).value()
const spanishModel = model().feed(spanish).value()
const latinModel   = model().feed(latin).value()

export function score(rawInput) {
  let logLikelihood = 0
  const input = padded(rawInput)
  for (let i = 2; i < input.length; i++) {
    const ch = input[i]
    const before = input.slice(i - 2, i)
    logLikelihood += Math.log(trigramProb(before, ch, englishModel))
  }
  const avgLogLikelihoodPerChar = logLikelihood / (input.length - 2)
  return "Score = " + avgLogLikelihoodPerChar
    + " :: " + evaluate(avgLogLikelihoodPerChar)
}

function trigramProb(ab, c, model) {
  const laplaceSmoothing = 1
  const occurrencesOfTrigram = (((model[ab] || {})[c] || 0) + laplaceSmoothing)
  const ret = occurrencesOfTrigram / model.$totalObservations
  console.log(occurrencesOfTrigram)
  return ret
}

// TODO: de-dupe
function padded(text, amount=2) {
  amount = amount || 1
  let padding = repeat(amount, '#')
  return padding + text.split(/\s+/).join(padding) + padding
}

// TODO: de-dupe
function repeat(n, s) {
  let ret = ''
  for (let i = 0; i < n; i++) {
    ret += s
  }
  return ret
}

function evaluate(avgLogLikelihood) {
  if (avgLogLikelihood > -7) return "Good match!"
  if (avgLogLikelihood > -8) return "Possible match"
  return "Unlikely match"
}
