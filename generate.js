const stdin = require("./stdin.js")

stdin(input => {
  const model = JSON.parse(input)
  console.log(model.$lengths)

  let text = repeat(model.$order, '#')

  times(500, () => generateWord(model))
    .filter((([_, exp]) => exp > -1))
    .sort((a, b) => a[1] - b[1]) // expectedness
    .forEach(i => console.log(i))
})

function generateWord(model) {
  const order = model.$order
  const boundary = repeat(order, "#")
  let word = boundary
  let tail = word
  let logLikelihood = 0
  do {
    const options = model[tail]
    const [chosen, prob] = pick(options)
    logLikelihood += Math.log(prob)
    word += chosen
  } while ((tail = last(order, word)) != boundary)
  word = word.slice(order, word.length - order)
  const avgLogLikelihoodPerChar = logLikelihood / Math.pow(word.length + order, 1.5)
  const expectedness = avgLogLikelihoodPerChar +
    Math.log(lengthProb(model, word.length)) * 0.1
  return [
    word,
    expectedness,
  ]
}

function pick(weights) {
  const totalWeight = Object.values(weights).reduce(add, 0)
  const rand = Math.random() * totalWeight

  let soFar = 0
  for (const k in weights) {
    soFar += weights[k]
    if (soFar >= rand) return [k, weights[k] / totalWeight]
  }
}

function add(a, b) {
  return a + b
}

function repeat(n, s) {
  let ret = ""
  for (let i = 0; i < n; i++) {
    ret += s
  }
  return ret
}

function last(n, s) {
  return s.slice(s.length - n)
}

function times(n, cb) {
  let ret = []
  for (let i = 0; i < n; i++) {
    ret.push(cb())
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
  const prob = ((lengths[len] || 0) + smoothing) / total
  return prob
}
