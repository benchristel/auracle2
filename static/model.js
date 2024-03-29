import {test, assert, equals} from "./test-framework.js"
import {curry, rename} from "./fp.js"

function BaseAssociator({alphabet, context, weight, toString}) {
  weight = weight || 1
  const END_OF_WORD = ""
  const mem = {}
  return {
    learn,
    unlearn,
    possibilities,
    reweight,
    toString,

    // TODO: make private
    associations,
    context,
  }

  function learn(word) {
    deepAssign(mem, associations(word))
  }

  function unlearn(word) {
    deepUnassign(mem, associations(word))
  }

  function possibilities(stimulus) {
    return mem[context(stimulus)] || {}
  }

  function reweight(fraction) {
    weight *= fraction
    for (const prefix in mem) {
      for (const k in mem[prefix]) {
        mem[prefix][k] *= fraction
      }
    }
  }

  function associations(word) {
    const ret = {}
    for (let i = 0; i <= word.length; i++) {
      const c = word[i] || END_OF_WORD
      if (!contains(c, alphabet)) continue;
      deepAdd(ret, context(first(i, word)), c, weight)
    }
    return ret
  }
}

// An NGramAssociator looks at N characters of context.
// N can be zero.
export function NGramAssociator({n, alphabet, weight}) {
  return BaseAssociator({alphabet, weight, context, toString})

  function toString() {
    return `NGramAssociator(${n}, weight = ${weight})`
  }

  function context(text) {
    return leftpad("#", n, last(n, text))
  }
}

// A CVAssociator looks only at consonant-vowel patterns.
export function CVAssociator({n, alphabet, weight}) {
  return BaseAssociator({alphabet, weight, context, toString})

  function toString() {
    return `CVAssociator(${n}, weight = ${weight})`
  }

  function context(text) {
    return leftpad("#", n, last(n, text).split("").map(charClass).join(""))
  }
}

export function RandomAssociator({alphabet, weight}) {
  const poss = alphabet.split("").reduce((obj, ch) => {
    obj[ch] = weight
    return obj
  }, {})

  // words have to end at some point
  poss[""] = weight * 4

  return {
    learn,
    unlearn,
    possibilities,
    reweight,
    toString,
  }

  function learn() {}
  function unlearn() {}
  function possibilities() {
    return poss
  }
  function reweight() {}
  function toString() {
    return `RandomAssociator(weight = ${weight})`
  }
}

function charClass(c) {
  switch(c) {
    case "a":
    case "e":
    case "i":
    case "o":
    case "u":
    case "y":
      return "V"
    case "p":
    case "t":
    case "c":
    case "k":
    case "q":
      return "K"
    case "d":
    case "b":
    case "g":
      return "G"
    case "l":
    case "r":
      return "L"
    case "s":
    case "z":
      return "S"
    case "h":
      return "H"
    default:
      return "C"
  }
}

test("an NGramAssociator", {
  "counts character frequencies when n = 0"() {
    const expected = {
      "": {
        "": 1, // empty string marks the end of a word
        "f": 1,
        "o": 2,
      }
    }

    assert(
      NGramAssociator({alphabet: "fo", n: 0}).associations("foo"),
      equals(expected))
  },

  "does not predict characters that aren't in the alphabet"() {
    const expected = {
      "": {
        "": 1, // empty string marks the end of a word
        "f": 1,
      }
    }

    assert(
      NGramAssociator({alphabet: "f", n: 0}).associations("foo"),
      equals(expected))
  },

  "looks at one character of context when n = 1"() {
    const expected = {
      "#": { // "#" marks a word boundary
        "f": 1,
      },
      "f": {"o": 1},
      "o": {"o": 1, "": 1},
    }

    assert(
      NGramAssociator({alphabet: "fo", n: 1}).associations("foo"),
      equals(expected))
  },

  "looks at two characters of context when n = 2"() {
    const expected = {
      "##": { // "#" marks a word boundary
        "f": 1,
      },
      "#f": {"o": 1},
      "fo": {"o": 1},
      "oo": {"": 1},
    }

    assert(
      NGramAssociator({alphabet: "fo", n: 2}).associations("foo"),
      equals(expected))
  },
})

function isVowel(c) {
  return contains(c, "aeiouyw`¯´ˆ")
}

window.Model = Model

export function Model({associators}) {
  return {
    learn,
    unlearn,
    predict,
    probability,
    associators,
    modelQuality,

    // included for debugging
    possibilities,
  }

  function learn(word) {
    associators.forEach(a => a.learn(word))
  }

  function unlearn(word) {
    associators.forEach(a => a.learn(word))
  }

  function predict(stimulus) {
    const poss = possibilities(stimulus)
    let totalWeight = 0
    for (const p of poss) {
      for (const k in p) {
        totalWeight += p[k]
      }
    }
    const target = Math.random() * totalWeight
    let weightSoFar = 0
    for (const p of poss) {
      for (const k in p) {
        weightSoFar += p[k]
        if (weightSoFar > target) return k
      }
    }
  }

  function probability(stimulus, response) {
    const poss = possibilities(stimulus)
    let totalWeight = 0
    let responseWeight = 0
    for (const p of poss) {
      for (const k in p) {
        totalWeight += p[k]
        if (k === response) responseWeight += p[k]
      }
    }
    return responseWeight / totalWeight
  }

  function possibilities(stimulus) {
    return associators.map(a => a.possibilities(stimulus))
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
}

const hasMember = rename("hasMember",
  curry((m, set) => set.has(m)),
)

const isGreaterThan = rename("isGreaterThan",
  curry((a, b) => b > a)
)

function deepAdd(obj, k1, k2, increment) {
  const v1 = (obj[k1] = obj[k1] || {})
  v1[k2] = v1[k2] || 0
  v1[k2] += increment
  return obj
}

test("deepAdd", {
  "adds to an empty object"() {
    const o = {}
    deepAdd(o, "a", "b", 1)
    assert(o, equals({"a": {"b": 1}}))
  },

  "starts values at zero"() {
    const o = {}
    deepAdd(o, "a", "b", 0)
    assert(o, equals({"a": {"b": 0}}))
  },

  "adds to an object that already has stuff"() {
    const o = {}
    deepAdd(o, "a", "b", 1)
    deepAdd(o, "a", "c", 1)
    deepAdd(o, "b", "d", 1)
    deepAdd(o, "a", "b", 1)
    assert(o, equals({
      "a": {"b": 2, "c": 1},
      "b": {"d": 1}
    }))
  },
})

function first(n, s) {
  return s.slice(0, n)
}

test("first", {
  "returns the first n characters of the string"() {
    assert(first(2, "foo"), equals("fo"))
  },
  "returns empty string when n is 0"() {
    assert(first(0, "foo"), equals(""))
  },
  "returns the whole string when n > the length"() {
    assert(first(4, "bar"), equals("bar"))
  }
})


function last(n, s) {
  if (n > s.length) return s
  return s.slice(s.length - n)
}

test("last", {
  "returns the last n characters of a string"() {
    assert(last(0, "foo"), equals(""))
    assert(last(1, "foo"), equals("o"))
    assert(last(2, "foo"), equals("oo"))
    assert(last(3, "foo"), equals("foo"))
    assert(last(4, "bar"), equals("bar"))
  }
})

function leftpad(prefix, width, s) {
  if (s.length >= width) return s
  return leftpad(prefix, width, prefix + s)
}

test("leftpad", {
  "does nothing to a string that fits the width"() {
    assert(leftpad("_", 3, "foo"), equals("foo"))
    assert(leftpad("_", 1, "bar"), equals("bar"))
  },
  "adds padding to a shorter string"() {
    assert(leftpad("_", 3, ""), equals("___"))
    assert(leftpad("_", 4, "foo"), equals("_foo"))
    assert(leftpad("#", 5, "bar"), equals("##bar"))
  },
})

function contains(needle, haystack) {
  return haystack.indexOf(needle) !== -1
}

function deepAssign(o, incoming) {
  for (let k in incoming) {
    if (typeof incoming[k] === "number") {
      o[k] = o[k] || 0
      o[k] += incoming[k]
    } else {
      o[k] = deepAssign(o[k] || {}, incoming[k])
    }
  }
  return o
}

function deepUnassign(o, incoming) {
  for (let k in o) {
    if (typeof o[k] === "number" && typeof incoming[k] === "number") {
      o[k] -= incoming[k]
      if (o[k] === 0) delete o[k]
    } else if (typeof o[k] === "object" && typeof incoming[k] === "object") {
      o[k] = deepUnassign(o[k], incoming[k])
      if (Object.keys(o[k]).length === 0) {
        delete o[k]
      }
    }
  }
  return o
}

test("deepAssign", {
  "does nothing given empty inputs"() {
    let o = {}
    deepAssign(o, {})
    assert(o, equals({}))
  },

  "destructively assigns properties on its first argument"() {
    let o = {}
    deepAssign(o, {a: 1})
    assert(o, equals({a: 1}))
  },

  "adds numbers"() {
    let o = {a: 2}
    deepAssign(o, {a: 3})
    assert(o, equals({a: 5}))
  },

  "leaves existing properties in place"() {
    let o = {a: 1, b: 2}
    deepAssign(o, {a: 3})
    assert(o, equals({a: 4, b: 2}))
  },

  "recurses"() {
    let o = {a: 1, b: {c: 1}}
    deepAssign(o, {b: {c: 2}})
    assert(o, equals({a: 1, b: {c: 3}}))
  },

  "creates properties deeply"() {
    let o = {a: 1}
    deepAssign(o, {b: {c: 2}})
    assert(o, equals({a: 1, b: {c: 2}}))
  },
})

test("deepUnassign", {
  "inverts deepAssign"() {
    [
      [{}, {}],
      [{}, {a: 2}],
      [{a: 1}, {a: 2}],
      [{a: 1, b: 2}, {a: 2}],
      [{a: 1}, {b: {c: 1}}],
      [{a: 1}, {}],
      [{a: {b: 1}}, {a: {b: 1}}],
      [{a: {b: 1, c: 2}, d: 1}, {a: {b: 1}}],
    ].forEach(([a, b]) => {
      const original = JSON.parse(JSON.stringify(a))
      assert(deepUnassign(deepAssign(a, b), b), equals(original))
    })
  }
})
