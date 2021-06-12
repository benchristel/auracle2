import {Model, NGramAssociator, CVAssociator, RandomAssociator} from "./model.js"
import words from "./corpora/words.js"
import {not, assert, isGreaterThan} from "./test-framework.js"

const alphabet = "abcdefghijklmnopqrstuvwxyz"

const associators = makeAssociators()

function makeAssociators() {
  return [
    RandomAssociator({alphabet, weight: 1}),
    // NGramAssociator({alphabet, n: 0, weight: 1}),
    // NGramAssociator({alphabet, n: 1, weight: 1}),
    // NGramAssociator({alphabet, n: 2, weight: 4}),
    // NGramAssociator({alphabet, n: 3, weight: 16}),
    CVAssociator({alphabet, n: 2, weight: 1}),
    // CVAssociator({alphabet, n: 3, weight: 4}),
    // CVAssociator({alphabet, n: 4, weight: 16}),
    // TODO: more char class associators would help smooth
    // out the letter frequency distro
  ]
}

const delta = 1e-4

window.associators = associators
window.model = Model({associators})
window.words = words
window.improve = improve
window.normalize = normalize

function normalize(o) {
  let total = 0
  for (let k in o) {
    total += o[k]
  }
  let ret = {}
  for (let k in o) {
    ret[k] = o[k] / total
  }
  return ret
}

test("improve", {
  "it accounts for observations"() {
    const model = Model({associators: makeAssociators()})
    improve("fo", model, ["foo"])
    assert(model.probability("fo", "o"), isGreaterThan(0.05))
  },
  "it tolerates capital letters"() {
    const model1 = Model({associators: makeAssociators()})
    improve("FO", model1, ["foo"])
    const model2 = Model({associators: makeAssociators()})
    improve("fo", model2, ["foo"])
    assert(model1.probability("fo", "o"), equals(model2.probability("fo", "o")))
  }
})

export function improve(rawObjectiveText, _model=window.model, words=window.words) {
  const objectiveText = rawObjectiveText.toLowerCase()
  if (objectiveText === "") return "error: please enter some text"

  let currentAccuracy = modelQuality(objectiveText, _model).number
  for (const w of words) {
    for (const a of _model.associators.slice(1)) {
      a.learn(w)
      const newAccuracy = modelQuality(objectiveText, _model).number
      if (newAccuracy > currentAccuracy) {
        console.log(`${w} +${newAccuracy - currentAccuracy} ${a}`)
        currentAccuracy = newAccuracy
      } else {
        a.unlearn(w)
      }
    }
  }
  return visualizeAccuracy(_model, objectiveText)
}

function visualizeAccuracy(model, objectiveText) {
  const words = objectiveText.split(/\s+/)
  let ret = ""
  for (const w of words) {
    for (let i = 0; i <= w.length; i++) {
      const ch = w[i] || ""
      const prefix = w.slice(0, i)
      ret += colorProb(ch, + model.probability(prefix, ch))
    }
  }
  return ret
}

function colorProb(ch, p) {
  let color
  if (p < 0.01) color = "#ddd"
  else if (p < 0.03) color = "#ccc"
  else if (p < 0.05) color = "#bbb"
  else if (p < 0.07) color = "#aaa"
  else if (p < 0.09) color = "#999"
  else if (p < 0.11) color = "#888"
  else if (p < 0.13) color = "#777"
  else if (p < 0.16) color = "#666"
  else if (p < 0.19) color = "#555"
  else if (p < 0.22) color = "#444"
  else if (p < 0.25) color = "#333"
  else if (p < 0.30) color = "#222"
  else if (p < 0.35) color = "#111"
  else               color = "#000"
  return `<span style="color: ${color}" data-p="${p}">${ch || "#"}</span>`
}

function modelQuality(text, model) {
  let logLikelihood = 0
  const words = text.split(/\s+/)
  for (const w of words) {
    for (let i = 0; i <= w.length; i++) {
      const ch = w[i] || ""
      const prefix = w.slice(0, i)
      const logProb = Math.log(model.probability(prefix, ch))
      logLikelihood += logProb
    }
  }
  // TODO: simplify
  return {
    number: logLikelihood,
  }
}
