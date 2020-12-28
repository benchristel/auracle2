import {generate} from "./generate.js"
import {identify} from "./identify.js"
import {improve} from "./improve.js"
import {help} from "./help.js"
import {orthography} from "./orthography.js"
import {tests} from "./tests.js"

improveBtn.addEventListener("click", program(improve))
generateBtn.addEventListener("click", program(generate))
identifyBtn.addEventListener("click", program(identify))
orthoBtn.addEventListener("click", program(orthography))
helpBtn.addEventListener("click", program(help))
testBtn.addEventListener("click", program(tests))

function program(p) {
  return () => output.innerHTML = p(input.value)
}
