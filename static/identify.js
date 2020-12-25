import {model} from "./model.js"
import english from "./corpora/english.js"
import arabic  from "./corpora/arabic.js"
import arabic1 from "./corpora/arabic1.js"
import qwerty  from "./corpora/qwerty.js"
import blank   from "./corpora/blank.js"
import spanish from "./corpora/spanish.js"
import latin   from "./corpora/latin.js"
import welsh   from "./corpora/welsh.js"
import reWelsh from "./corpora/respelled-welsh.js"
import engCompounds from "./corpora/english-compounds.js"
import onomatopoeia from "./corpora/onomatopoeia.js"
import japanese from "./corpora/japanese.js"

const englishModel = model().feed(english).value()
const arabicModel  = model().feed(arabic).value()
const arabicModelWithVowelLength  = model().feed(arabic1).value()
const qwertyBashingModel = model().feed(qwerty).value()
const blankModel = model().feed(blank).value()
const spanishModel = model().feed(spanish).value()
const latinModel = model().feed(latin).value()
const welshModel = model().feed(welsh).value()
const reWelshModel = model().feed(reWelsh).value()
const onomatopoeiaModel = model().feed(onomatopoeia).value()
const japaneseModel = model().feed(japanese).value()

export function identify(rawInput) {
  return [
    ["English", englishModel],
    ["Japanese", japaneseModel],
    ["English + Compounds", model().feed(english).feed(engCompounds).value()],
    ["Arabic", arabicModel],
    ["Arabic (Vowel Length Marked)", arabicModelWithVowelLength],
    // ["English + Arabic", model().feed(english).feed(arabic).value()],
    // ["2 English + Arabic", model().feed(english).feed(english).feed(arabic).value()],
    // ["3 English + Arabic", model().feed(english).feed(english).feed(english).feed(arabic).value()],
    ["Spanish", spanishModel],
    // ["English + Spanish", model().feed(english).feed(spanish).value()],
    ["Latin", latinModel],
    ["Welsh", welshModel],
    // ["English + 2 Respelled Welsh", model().feed(english).feed(reWelsh).feed(reWelsh).value()],
    ["Respelled Welsh", reWelshModel],
    ["QWERTY bashing", qwertyBashingModel],
    ["SHOSHIN", blankModel],
    // ["MOAR ENGLISH", model().feed(english).feed(english).feed(english).feed(english).feed(english).feed(english).feed(english).value()],
    ["Onomatopoeia", onomatopoeiaModel]
  ]
    .map(([name, model]) => [name, score(rawInput, model)])
    .sort((a, b) => {
      return b[1] - a[1]
    })
    .map(parts => parts.join(": "))
    .join("\n")
}

function score(rawInput, model) {
  let logLikelihood = 0
  const input = padded(rawInput)
  const words = rawInput.split(/\s+/).filter(w => w.length > 0)
  for (let i = 2; i < input.length; i++) {
    const ch = input[i]
    const before = input.slice(i - 2, i)
    logLikelihood += Math.log(trigramProb(before, ch, model))
  }
  return logLikelihood / (input.length - 2)
}

function trigramProb(ab, c, model) {
  const laplaceSmoothing = 1
  // Account for Laplace smoothing by adding the number
  // of letters in the alphabet to the number of actual
  // observations. If we don't do this, the empty model
  // is the "best" fit for every input!
  const occurrencesOfPrefix = Object.values(model[ab] || {}).reduce(add, 30)
  const occurrencesOfTrigram = (((model[ab] || {})[c] || 0) + laplaceSmoothing)
  const ret = occurrencesOfTrigram / occurrencesOfPrefix
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

function lengthProb(model, len) {
  const lengths = model.$lengths
  let total = 0
  // use Laplace smoothing since the given `len` may
  // not exist in the model
  const smoothing = 1
  for (let k in lengths) {
    total += lengths[k] + smoothing
  }
  if (total === 0) return 1
  const prob = ((lengths[len] || 0) + smoothing) / total
  return prob
}

function add(a, b) {
  return a + b
}
