module.exports = (request, response, name = 'World') => {
  const string = `Hello ${name}`
  response.writeHead(200, {
    'content-type': 'text/plain',
    'content-length': string.length,
    'x-timestamp', new Date().toISOString()
  })
  response.end(string)
}
