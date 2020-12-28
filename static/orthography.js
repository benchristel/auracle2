import {test, assert, equals} from "./test-framework.js"

// const orthographies = {
//   "minimal":             /^[aiuntk]+$/,
//   "Māori":               /^[aeiouāēīōūmnptkgwhr]+$/,
//   "Māori (wh = f)":      /^[aeiouāēīōūmnptkgfwhr]+$/,
//   "toki pona":           /^[aeioutpklswjmn]+$/,
//   "rotokas respelled":   /^[aeioutpkdbgnmñ]+$/,
//   "rotokas":             /^[aeiouāēīōūtpkdbgnmŋ]+$/,
//   "toki pona respelled": /^[aeioutpklswymn]+$/,
//   "Nahuatl respelled":   /^[aeiowtpklsymnx]+$/,
//   "Nahuatl":             /^[aeioutpcqlszhymnx]+$/,
//   "Finnish":             /^[aeiouäöytpkshvlrjmn]+$/,
//   "Japanese rōmaji":     /^[aeiouāēīōūtpckdbgfszjhrymn'-]+$/,
//   "English":             /^[abcdefghijklmnopqrstuvwxyz'-]+$/,
//   "Spanish":             /^[abcdefghijklmnopqrstuvwxyzáéíóúñü'-]+$/,
//   "CHAOS": /.*/,
// }

export function orthography(rawInput) {
  return vowelInventory(sanitize(rawInput))
}

function sanitize(s) {
  return s.toLowerCase()
    .replace('’', "'")
    .replace(/[^a-z'ßäöüáéíóúāēīōūñ-]+/g, '')
}

function baseVowelSystem(text) {
  if (/[ä]/.test(text) && !/[eo]/.test(text)) return "aiuäü"
  if (/[ü]/.test(text) && !/[eo]/.test(text)) return "aiueü"
  if (/[äöü]/.test(text)) return "aeiouöüä"
  if (/[eoéóēōèòêôẽõ]/.test(text)) return "aeiou"
  return "aiu"
}

function vowelInventory(text) {
  let vowels = baseVowelSystem(text)
  if (/[yýȳỳŷỹ]/.test(text)) vowels += "y"
  if (/[wẃẁŵ]/.test(text))   vowels += "w"
  if (/[áéíóúýẃ]/.test(text)) vowels += addAcutes(vowels)
  if (/[āēīōūȳ]/.test(text))  vowels += addMacrons(vowels)
  if (/[àèìòùỳẁ]/.test(text)) vowels += addGraves(vowels)
  if (/[âêîôûŷŵ]/.test(text)) vowels += addHats(vowels)
  if (/[ãẽĩõũỹ]/.test(text))  vowels += addTildes(vowels)
  return vowels
}

function addAcute(v) {
  switch (v) {
    case "a": return "á"
    case "e": return "é"
    case "i": return "í"
    case "o": return "ó"
    case "u": return "ú"
    case "y": return "ý"
    case "w": return "ẃ"
    default:  return ""
  }
}

function addMacron(v) {
  switch (v) {
    case "a": return "ā"
    case "e": return "ē"
    case "i": return "ī"
    case "o": return "ō"
    case "u": return "ū"
    case "y": return "ȳ"
    default:  return ""
  }
}

function addGrave(v) {
  switch (v) {
    case "a": return "à"
    case "e": return "è"
    case "i": return "ì"
    case "o": return "ò"
    case "u": return "ù"
    case "y": return "ỳ"
    case "w": return "ẁ"
    default:  return ""
  }
}

function addHat(v) {
  switch (v) {
    case "a": return "â"
    case "e": return "ê"
    case "i": return "î"
    case "o": return "ô"
    case "u": return "û"
    case "y": return "ŷ"
    case "w": return "ŵ"
    default:  return ""
  }
}

function addTilde(v) {
  switch (v) {
    case "a": return "ã"
    case "e": return "ẽ"
    case "i": return "ĩ"
    case "o": return "õ"
    case "u": return "ũ"
    case "y": return "ỹ"
    default:  return ""
  }
}

const addAcutes  = mapChars(addAcute)
const addMacrons = mapChars(addMacron)
const addGraves  = mapChars(addGrave)
const addHats    = mapChars(addHat)
const addTildes  = mapChars(addTilde)

function mapChars(f) {
  return s => s.split("").map(f).join("")
}

test("vowelInventory", {
  "never assumes fewer than three vowels"() {
    assert(vowelInventory(""), equals("aiu"))
  },

  "assumes a five-vowel system if it sees e"() {
    assert(vowelInventory("e"), equals("aeiou"))
  },

  "assumes a five-vowel system if it sees accented e"() {
    assert(vowelInventory("é"), equals("aeiouáéíóú"))
  },

  "assumes a five-vowel system if it sees o"() {
    assert(vowelInventory("kola"), equals("aeiou"))
  },

  "assumes front-back symmetry if it sees an umlaut"() {
    assert(vowelInventory("köla"), equals("aeiouöüä"))
  },

  "assumes a square inventory if it sees an umlaut but no e or o"() {
    assert(vowelInventory("küla"), equals("aiueü"))
    assert(vowelInventory("külä"), equals("aiuäü"))
  },

  "assumes w and y are vowels in the context of a five-vowel system"() {
    // this assumption often won't be correct since y is
    // often used as a consonant. However, since the
    // inferred inventory will be used to restrict the set
    // of letters permitted in mixin models, it pays
    // to be liberal here so we don't unintentionally
    // exclude letters that should be included.
    assert(vowelInventory("yae"), equals("aeiouy"))
    assert(vowelInventory("wae"), equals("aeiouw"))
  },

  "assumes y and w are vowels in the context of a three-vowel system"() {
    assert(vowelInventory("ya"), equals("aiuy"))
    assert(vowelInventory("wa"), equals("aiuw"))
  },

  "assumes symmetric vowel length (marked with a macron)"() {
    assert(vowelInventory("kī"), equals("aiuāīū"))
    assert(vowelInventory("kē"), equals("aeiouāēīōū"))
  },

  "assumes symmetric vowel length (marked with an acute)"() {
    assert(vowelInventory("kí"), equals("aiuáíú"))
  },

  "assumes symmetric vowel length (marked with a grave)"() {
    assert(vowelInventory("kì"), equals("aiuàìù"))
  },

  "assumes symmetric vowel length (marked with a circumflex)"() {
    assert(vowelInventory("kî"), equals("aiuâîû"))
  },

  "assumes symmetric vowel nasality (marked with a tilde)"() {
    assert(vowelInventory("kĩ"), equals("aiuãĩũ"))
  },

  "identifies multiple diacritics"() {
    assert(vowelInventory("kálā"), equals("aiuáíúāīū"))
  },
})
