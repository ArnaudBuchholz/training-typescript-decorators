import { Controller } from './Controller'
import { serve } from './serve'

const instance = new Controller()
console.log(instance.hello())

serve(Controller)
