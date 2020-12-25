// Important! ./test-framework.js must be imported first
// because it defines globals used by the tests.
import {
  allTestCases,
  runTest,
  summarizeTestResults,
} from "./test-framework.js"

import "./test-framework.tests.js"

export function tests() {
  return summarizeTestResults(allTestCases.map(runTest))
}
