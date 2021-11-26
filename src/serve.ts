import { check, log, serve as reserve, Configuration, CustomMapping } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

const endpoints = Symbol()

/*
interface ParameterMapping {
  
}
*/

interface Mapping {
  method: string
  url: RegExp
  propertyKey: string
}

interface ControllerPrototype {
  [endpoints]?: Mapping[]
}

function addEndpointMapping (prototype: ControllerPrototype, mapping: Mapping) {
  let mappings = prototype[endpoints]
  if (mappings === undefined) {
    mappings = []
    prototype[endpoints] = mappings
  }
  mappings.push(mapping)
}

export function get (url: RegExp) {
  return function (prototype: any, propertyKey: string, descriptor: PropertyDescriptor) {
    addEndpointMapping(prototype, { method: 'GET', url, propertyKey })
  }
}

/*
export function param (name: string) {
  return function (target: any, propertyKey: string, index: number) {
    addParameterMapping(target, { index, mapping: name, propertyKey })
  }
}
*/

export async function serve (Controller: new () => object) {
  const configuration: Configuration = {
    port: 8080,
    mappings: []
  }
  const instance: any = new Controller()
  const prototype = Controller.prototype as ControllerPrototype
  const mappings = prototype[endpoints]
  if (mappings !== undefined) {
    configuration.mappings = mappings.map(({ method, url, propertyKey }): CustomMapping => {
      return {
        method,
        match: url,
        custom: async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
          const result = (await instance[propertyKey]()) as string
          response.writeHead(200, {
            'content-type': 'text/plain',
            'content-length': result.length
          })
          response.end(result)
        }
      }
    })
  }
  const checkedConfiguration = await check(configuration)
  log(reserve(checkedConfiguration))
}
