import { get, $ } from './serve'

export class Controller {
  @get(/hello(?:\/(.*))?/)
  hello (@$(1) name: string = 'world') {
    return `hello ${name}`
  }
}
