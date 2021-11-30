import { get } from './serve'

export class Controller {
  @get(/hello/)
  hello (name: string = 'world') {
    return `hello ${name}`
  }
}
