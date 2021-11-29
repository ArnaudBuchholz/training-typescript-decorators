import { get, $, response } from './serve'
import { ServerResponse } from 'http'

export class Controller {
  @get(/hello(?:\/(.*))?/)
  hello (@$(1) name: string = 'world', @response() response?: ServerResponse) {
    if (response !== undefined) {
      response.setHeader('x-timestamp', new Date().toISOString())
    }
    return `hello ${name}`
  }
}
