export function generate() {
  let output = []
  for (let i = 0; i < 200; i++) {
    const w = generateWord()
    output.push([w, logLikelihood(w, model) / w.length])
  }
  return unique(output, o => o[0])
    .filter(([_, score]) => score > -2.5)
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

function unique(xs, by) {
  const set = {}
  for (const x of xs) {
    set[by(x)] = x
  }
  return Object.values(set)
}
