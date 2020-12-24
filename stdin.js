module.exports = function(cb) {
  process.stdin.resume()
  process.stdin.setEncoding("utf-8")

  let input = ""

  process.stdin.on("data", data => input += data)
  process.stdin.on("end", () => cb(input))
}
