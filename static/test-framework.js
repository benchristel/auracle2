import {fmeta, rename, curry} from "./fp.js"

// ==============
// TEST FRAMEWORK
// ==============

export const allTestCases = [] // mutable

export function test(...args) {
  allTestCases.push(...testCases(...args))
}

test("test", {
  "runs an example assertion"() {
    assert(1 + 1, equals(2))
  }
})

export function runTest({title, assertion}) {
  try {
    assertion()
  } catch (failure) {
    return {title, failure}
  }
  return {title, failure: null}
}

export function summarizeTestResults(results) {
  const failures = results.filter(t => t.failure)

  if (failures.length) {
    return `There are ${failures.length} failing tests:\n\n${
      failures
        .map(t => `${t.title}\n    ${t.failure}`)
        .join("\n\n")
    }`
  }
  return `${results.length} tests ran, and found no issues.`
}

export function assert(subject, predicate) {
  if (!predicate(subject)) {
    throw {
      toString() {
        return [
          "It's not the case that",
          visualize(subject),
          visualize(predicate),
        ].join(" ")
      }
    }
  }
}

function testCases(subjectName, assertionsByTitle) {
  return Object.entries(assertionsByTitle)
    .map(([title, assertion]) => ({
      title: subjectName + " " + title,
      assertion,
    }))
}

test("testCases", {
  "returns an empty list given no assertions"() {
    assert(testCases("some subject", {}), equals([]))
  },

  "returns a single test case"() {
    const f = () => {}
    const tests = testCases("some subject", {
      "does something": f,
    })
    assert(tests, equals([{
      title: "some subject does something",
      assertion: f,
    }]))
  },

  "returns several test cases"() {
    const f1 = () => {}
    const f2 = () => {}
    const tests = testCases("some subject", {
      "does something": f1,
      "does something else": f2,
    })
    assert(tests, equals([
      {
        title: "some subject does something",
        assertion: f1,
      },
      {
        title: "some subject does something else",
        assertion: f2,
      },
    ]))
  },
})

export const equals = rename("equals", curry((a, b) => {
  if (a === b) return true

  if (Array.isArray(a)) {
    return Array.isArray(b)
      && a.length === b.length
      && a.every((v, i) => equals(v, b[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    for (const k in {...a, ...b}) {
      if (!((k in a) && (k in b) && equals(a[k], b[k]))) {
        return false
      }
    }
    return true
  }

  return false
}))

{ // Tests for curry()

  function add3(a, b, c) {
    return a + b + c
  }

  test("a curried function", {
    "can be called with all its arguments"() {
      assert(curry(add3)(1, 2, 5), equals(8))
    },

    "can receive args one by one"() {
      assert(curry(add3)(2)(4)(3), equals(9))
    },

    "can receive arguments in chunks"() {
      assert(curry(add3)(1, 2)(3), equals(6))
      assert(curry(add3)(4)(5, 6), equals(15))
    },

    "is unaffected by empty calls"() {
      assert(curry(add3)()()(1, 2, 3), equals(6))
      assert(curry(add3)(4)()(2, 1), equals(7))
    },

    "is named"() {
      const f = curry(add3)(5)
      assert(fmeta(f)[0], equals("add3"))
      const f1 = f(2)
      assert(fmeta(f1)[0], equals("add3"))
    },

    "recalls arguments passed to it"() {
      const f = curry(add3)(5)(6)
      assert(fmeta(f)[1], equals([5, 6]))
    },

    "passes along extra arguments"() {
      function f(a, b) {
        return add3
      }
      assert(curry(f)("", "", 3, 4, 5), equals(12))
    },
  })
}

test("fmeta", {
  "it associates name and args with a function"() {
    function func() {}
    fmeta(func, "hello", [1, 2])
    assert(fmeta(func), equals(["hello", [1, 2]]))
  },

  "it can set the name to empty string"() {
    function func() {}
    fmeta(func, "", [])
    assert(fmeta(func), equals(["", []]))
  },

  "it returns the function when setting metadata"() {
    function func() {}
    const result = fmeta(func, "hello", [1, 2])
    assert(result, equals(func))
  },

  "it returns the original name of the function if none was set"() {
    function func() {}
    assert(fmeta(func), equals(["func", []]))
  },
})

export const not = rename("not", curry((predicate, arg) => !predicate(arg)))

test("equals() and not()", {
  "compare booleans"() {
    assert(true, equals(true))
    assert(true, not(equals(false)))
    assert(false, equals(false))
    assert(false, not(equals(true)))
  },

  "compare strings"() {
    assert("hell", not(equals("hello")))
    assert("hello", equals("hello"))
    assert("", equals(""))
  },

  "compare numbers"() {
    assert(1, equals(1))
    assert(2, not(equals(1)))
  },

  "compare arrays"() {
    assert([], equals([]))
    assert([1], not(equals([])))
    assert([], not(equals([1])))
    assert([1], not(equals([2])))
    assert([1, 2, 3], not(equals([1, 2, 5])))
    assert([1, 2, 3], equals([1, 2, 3]))
    assert([], not(equals([[]])))
  },

  "compare objects"() {
    assert({}, equals({}))
    assert({a: 1}, not(equals({})))
    assert({}, not(equals({a: 1})))
    assert({a: 1}, not(equals({a: 2})))
    assert({a: 1}, not(equals({b: 1})))
    assert({a: 1}, not(equals({a: 1, b: 1})))
    assert({a: 1, b: 1}, not(equals({a: 1})))
    assert({a: 1}, equals({a: 1}))
  }
})

function visualize(obj) {
  if (Array.isArray(obj)) {
    return `[${obj.map(visualize).join(", ")}]`
  }
  if (typeof obj === "function") {
    const [name, args] = fmeta(obj)
    if (name) {
      return `${name}(${args.map(visualize).join(", ")})`
    }
  }
  if (obj && obj.constructor === Set) {
    return `Set(${visualize([...obj.values()])})`
  }
  return "" + JSON.stringify(obj)
}

test("visualize", {
  "displays the elements of an array"() {
    assert(visualize([1, 2, 3]), equals("[1, 2, 3]"))
  },

  "displays the arguments of a curried function"() {
    assert(visualize(equals(1)), equals("equals(1)"))
  },

  "displays undefined"() {
    assert(visualize(), equals("undefined"))
  },

  "displays a string"() {
    assert(visualize("abc"), equals('"abc"'))
  },

  "escapes quotes"() {
    assert(visualize('"hi"'), equals('"\\"hi\\""'))
  },

  "displays a set"() {
    const s = new Set()
    s.add(1)
    s.add(2)
    assert(visualize(s), equals("Set([1, 2])"))
  },

  "recurses"() {
    assert(
      visualize(not(equals([1, 2]))),
      equals("not(equals([1, 2]))"),
    )
  }
})

window.test = test
window.assert = assert
window.equals = equals
