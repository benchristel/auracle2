// fmeta associates metadata (name and partial args) with
// curried functions.
export const fmeta = function iife() {
  const metadata = new WeakMap()

  function set(obj, name, value) {
    const data = metadata.get(obj) || {}
    data[name] = value
    metadata.set(obj, data)
  }

  function get(obj, name) {
    const data = metadata.get(obj) || {}
    return data[name]
  }

  return function fmeta(f, name, args) {
    const key = "fmeta"
    if (name !== undefined) {
      set(f, key, [name, args])
      return f
    } else {
      return get(f, key) || [f.name, []]
    }
  }
}()

// rename provides a name for an anonymous function, or
// overrides the name of a named function.
export function rename(name, f) {
  return fmeta(f, name, [])
}

export function curry(nAryFn) {
  const arity = nAryFn.length
  const curried = (...args) => {
    if (args.length === arity) {
      return nAryFn(...args)
    } else if (args.length > arity) {
      const [mine, yours] = splitAt(arity, args)
      return nAryFn(...mine)(...yours)
    } else {
      const f = (...rest) => curried(...args, ...rest)
      const [name] = fmeta(curried)
      return fmeta(f, name, args)
    }
  }
  return fmeta(curried, ...fmeta(nAryFn))
}


function splitAt(n, arr) {
  return [take(n, arr), drop(n, arr)]
}

function take(n, arr) { return arr.slice(0, n) }
function drop(n, arr) { return arr.slice(n) }
