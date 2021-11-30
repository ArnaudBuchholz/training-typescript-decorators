import { check, log, serve as reserve, Configuration, CustomMapping } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

const endpoints = Symbol()

interface UrlMapping {
  propertyKey: string
  method: string
  url: RegExp
}

interface ControllerPrototype {
  [endpoints]?: UrlMapping[]
}

function getEndpointMapping (prototype: ControllerPrototype, propertyKey: string): UrlMapping {
  let mappings = prototype[endpoints]
  if (mappings === undefined) {
    mappings = []
    prototype[endpoints] = mappings
  }
  let mapping: UrlMapping = mappings.filter(candidate => candidate.propertyKey === propertyKey)[0]
  if (mapping === undefined) {
    mapping = {
      method: 'GET',
      url: /.*/,
      propertyKey
    }
    mappings.push(mapping)
  }
  return mapping
}

export function get (url: RegExp) {
  return function (prototype: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Object.assign(getEndpointMapping(prototype, propertyKey), { method: 'GET', url, propertyKey })
  }
}

export async function serve (Controller: new () => object) {
  const configuration: Configuration = {
    port: 8080,
    mappings: []
  }
  const instance: any = new Controller()
  const prototype = Controller.prototype as ControllerPrototype
  const mappings = prototype[endpoints]
  if (mappings !== undefined) {
    configuration.mappings = mappings.map(({ method, url, propertyKey }): CustomMapping => {
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
