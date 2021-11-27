import { check, log, serve as reserve, Configuration, CustomMapping } from 'reserve'
import { IncomingMessage, ServerResponse } from 'http'

const endpoints = Symbol()

enum ParameterMappingType {
  capturingGroup,
  request,
  response
}

interface ParameterMapping {
  index: number
  type: ParameterMappingType
  $: number
}

interface UrlMapping {
  propertyKey: string
  method: string
  url: RegExp
}

interface EndpointMapping extends UrlMapping {
  parameters: ParameterMapping[]
}

interface ControllerPrototype {
  [endpoints]?: EndpointMapping[]
}

function getEndpointMapping (prototype: ControllerPrototype, propertyKey: string): EndpointMapping {
  let mappings = prototype[endpoints]
  if (mappings === undefined) {
    mappings = []
    prototype[endpoints] = mappings
  }
  let mapping: EndpointMapping = mappings.filter(candidate => candidate.propertyKey === propertyKey)[0]
  if (mapping === undefined) {
    mapping = {
      method: 'GET',
      url: /.*/,
      propertyKey,
      parameters: []
    }
    mappings.push(mapping)
  }
  return mapping
}

function addEndpointMapping (prototype: ControllerPrototype, mapping: UrlMapping) {
  Object.assign(getEndpointMapping(prototype, mapping.propertyKey), mapping)
}

export function get (url: RegExp) {
  return function (prototype: any, propertyKey: string, descriptor: PropertyDescriptor) {
    addEndpointMapping(prototype, { method: 'GET', url, propertyKey })
  }
}

export function $ (capturingGroup: number) {
  return function (prototype: any, propertyKey: string, index: number) {
    const mapping = getEndpointMapping(prototype, propertyKey)
    mapping.parameters.push({
      index,
      type: ParameterMappingType.capturingGroup,
      $: capturingGroup
    })
  }
}

export function request () {
  return function (prototype: any, propertyKey: string, index: number) {
    const mapping = getEndpointMapping(prototype, propertyKey)
    mapping.parameters.push({
      index,
      type: ParameterMappingType.request,
      $: 0
    })
  }
}

export function response () {
  return function (prototype: any, propertyKey: string, index: number) {
    const mapping = getEndpointMapping(prototype, propertyKey)
    mapping.parameters.push({
      index,
      type: ParameterMappingType.response,
      $: 0
    })
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
    configuration.mappings = mappings.map(({ method, url, propertyKey, parameters }): CustomMapping => {
      return {
        method,
        match: url,
        custom: async (request: IncomingMessage, response: ServerResponse, ...capturingGroups: string[]): Promise<void> => {
          const args: any[] = []
          parameters.forEach(({ index, type, $ }) => {
            let parameter
            if (type === ParameterMappingType.capturingGroup) {
              parameter = capturingGroups[$ - 1]
            } else if (type === ParameterMappingType.request) {
              parameter = request
            } else if (type === ParameterMappingType.response) {
              parameter = response
            }
            args[index] = parameter
          })
          const result = (await instance[propertyKey](...args)) as string
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
