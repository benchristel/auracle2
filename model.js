#!/usr/bin/env node

const stdin = require("./stdin")

stdin(input => console.log(
  JSON.stringify(model(2).feed(input).value())
))

function model(order) {
  let text = ''
  const self = {
    feed,
    value,
  }

  return self

  function feed(_text) {
    text += _text
    return self
  }

  function value() {
    let t = padded(text, order)
    let ret = {}
    for (let i = 0; i < t.length - order; i++) {
      const prefix = t.slice(i, i + order)
      const next = t[i + order]
      ret[prefix] = ret[prefix] || {}
      ret[prefix][next] = ret[prefix][next] || 0
      ret[prefix][next]++
    }
    ret.$order = order
    ret.$lengths = lengthHisto(text)
    return ret
  }
}

function padded(text, amount) {
  amount = amount || 1
  let padding = repeat(amount, '#')
  return padding + text.split(/\s+/).join(padding) + padding
}

function lengthHisto(text) {
  let histo = {}
  text.split(/\s+/).forEach(word => {
    if (word === "") return
    histo[word.length] = histo[word.length] || 0
    histo[word.length]++
  })
  return histo
}

function repeat(n, s) {
  let ret = ''
  for (let i = 0; i < n; i++) {
    ret += s
  }
  return ret
}
