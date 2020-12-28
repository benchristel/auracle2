import {Model} from "./model.js"
import words from "./corpora/words.js"

window.model = Model({alphabet: "abcdefghijklmnopqrstuvwxyz"})

export function improve(objectiveText) {
  words.sort(() => Math.random() - 0.5)
  console.log("huh?")

  let currentAccuracy = logLikelihoodOf(objectiveText, model)
  console.log(currentAccuracy)
  for (const w of words) {
    model.learn(w)
    const newAccuracy = logLikelihoodOf(objectiveText, model)
    // console.log(newAccuracy)
    if (newAccuracy > currentAccuracy) {
      console.log(`${w} improved accuracy by ${newAccuracy - currentAccuracy}, to ${newAccuracy / objectiveText.length}`)
      currentAccuracy = newAccuracy
    } else {
      model.unlearn(w)
    }
  }
  return "done"
}

function logLikelihoodOf(text, model) {
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
