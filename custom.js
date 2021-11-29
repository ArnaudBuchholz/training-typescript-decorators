module.exports = (request, response, name = 'World') => {
  const string = `Hello ${name}`
  response.writeHead(200, {
    'content-type': 'text/plain',
    'content-length': string.length
  })
  response.end(string)
}
