import {Model} from "./model.js"
import words from "./corpora/words.js"

window.model = Model({alphabet: "abcdefghijklmnopqrstuvwxyz"})

// Preload the model. If we don't do this, it starts at a
// local maximum where any single word it learns tends to
// make it overfit that particular word and therefore
// perform worse than pure randomness.
for (const w of words) {
  model.learn(w)
}

const delta = 1e-4

window.improve = improve

export function improve(objectiveText) {
  words.sort(() => Math.random() - 0.5)
  if (objectiveText === "") return "error: please enter some text"
  let currentAccuracy = modelQuality(objectiveText, model)
  for (const w of words) {
    // reinforceWord: while (true) {
      model.learn(w)
      const newAccuracy = modelQuality(objectiveText, model)
      if (newAccuracy > currentAccuracy + delta) {
        console.log(`${w} improved accuracy by ${newAccuracy - currentAccuracy}, to ${newAccuracy}`)
        currentAccuracy = newAccuracy
      } else {
        model.unlearn(w)
        // break reinforceWord;
      }
    // }
  }
  return visualizeAccuracy(model, objectiveText)
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

export function modelQuality(text, model) {
  let minLogProb = 0
  let logLikelihood = 0
  const words = text.split(/\s+/)
  for (const w of words) {
    for (let i = 0; i <= w.length; i++) {
      const ch = w[i] || ""
      const prefix = w.slice(0, i)
      // Use the minimum probability for a character to
      // judge the model's quality. Otherwise, the model
      // will overfit characters that are easy to overfit
      // and "dump" others that are actually more
      // distinctive features of the target language!
      const logProb = Math.log(model.probability(prefix, ch))
      logLikelihood += logProb
      minLogProb = Math.min(minLogProb, logProb)
    }
  }
  return minLogProb * 5 + logLikelihood
}

function reverse(s) {
  return [...s].reverse().join("")
}
