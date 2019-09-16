import { clean } from './utils'

import overrides from './overrides'

export interface IBaseStructure {
  type: string[],
  name: string,
  desc?: string,
  default?: string,
  optional?: boolean,
}

export interface IBaseType {
  name: string,
  parent: string,
}

export interface IArgument extends IBaseStructure {
  args?: IBaseStructure[],
}

export interface IEnum {
  value: number,
  desc?: string,
}

export interface IRenderingContext {
  context?: string,
  type?: string,
}

export interface IBug {
  issue?: string,
  text: string,
}

export interface IExample {
  description: string,
  code: string,
  output?: string,
}

export interface IReturn {
  type: string[],
  desc?: string,
  args?: IBaseStructure[],
}

export interface IFunc extends IBaseType {
  description: string,
  file?: string,
  line?: string,
  predicted?: boolean,
  isclass?: boolean,
  realm?: string[],
}

export interface IShader extends IBaseType {
  description: string,
  parameters: IBaseStructure[],
}

export interface IStructure extends IBaseType {
  description: string,
  fields: IArgument[],
}

export interface IEnumeration extends IBaseType {
  description: string,
  fields: { [name: string]: IEnum },
}

export interface IWikiPage {
  title: string,
  id: number,
  raw: string,
}

export interface IParsed extends IWikiPage {
  rendering?: IRenderingContext,
  notes?: string[],
  warnings?: string[],
  deleted?: string,
  validate?: boolean,
  sandboxderived?: boolean,
  stub?: boolean,
  internal?: string | boolean,
  update?: string | boolean,
  deprecated?: string | boolean,
  bugs?: IBug[],
  returns?: IReturn[],
  args?: IArgument[],
  examples?: IExample[],
  panelhook?: IFunc,
  hook?: IFunc,
  panelfunc?: IFunc,
  func?: IFunc,
  shader?: IShader,
  structure?: IStructure,
  enumeration?: IEnumeration,
}

interface ITempStore {
  args?: IArgument[],
  structures?: IArgument[],
  enums?: { [name: string]: IEnum },
}

export default class Parser {
  private temp: ITempStore = {}
  private json: IParsed = { title: '', id: 0, raw: '' }

  private name: string = ''
  private parent: string = ''

  parse(page: IWikiPage): IParsed {
    this.temp = {}
    this.json = {
      title: page.title,
      id: page.id,
      raw: page.raw,
    }

    if (page.title == 'wikiutils') { //breaks parser
      return this.json
    }

    const info: string[] = page.title.split('/')

    this.parent = info[1] ? info[0].replace(/\s/gm, '_') : ''
    this.name   = info[1] ? info[1].replace(/\s/gm, '_') : info[0].replace(/\s/gm, '_')

    let str = clean(page.raw, 'e|w|h|b')

    str = this.parseBlock(str, (str?: string) => {
      if (!str) { return str }
      if (str.includes('http')) {
        const parts = str.split(' ')
        const url = parts.shift()
        return `[${parts.join(' ')}](${url})`
      }
      return `[${str}]`
    }, ['[',']'])

    str = this.parseBlock(str, (str?: string) => {
      if (!str) { return str }
      if (str.includes('|')) {
        return `[[${str.split('|').join('@')}]]`
      }
      return `[[${str}]]`
    }, ['[[',']]'])

    this.parseBlock(str, this.processBlock.bind(this))

    return this.json
  }

  private processBlock(str?: string) {
    if (!str) { return str }
    const block = this.parseBlock(str, this.processBlock.bind(this))
    const parts = block.split('|')

    let type
    if (parts.length > 0) {
      const t = parts.shift()
      if (t && t.includes('#titleparts')) {
        return t.split(':').pop() as string
      }
      type = clean(t, 'c|t|lo')
    }

    if (type && type.startsWith(':')) {
      return `@${type.substr(1, type.length)}`
    }

    if (type && type.startsWith('#time')) {
      return type
    }

    switch (type) {
      case 'listitem':
      case 'fieldsonly':
      case 'realmicon':
        return ''
      case '!':
        return '*'
      case 'eq':
        return '='
      case 'subpagename':
        return this.json.title ? this.json.title.split('/').pop() : ''
      case 'hookfunction':
      case 'classfunction':
        return `@${(overrides.global.context[parts[0]] ? overrides.global.context[parts[0]] : parts[0])}:${parts[1]}`
      case 'libraryfunc':
      case 'libraryfunction':
        return `@${(overrides.global.context[parts[0]] ? overrides.global.context[parts[0]] : parts[0])}.${parts[1]}`
      case 'type':
        return `@${parts[0]} type`
      case 'globalfunction':
        return `@${parts[0]} function`
      case 'globalvar':
        return `@${parts[0]} global`
      case 'enum':
        return `@${overrides.global.enum[parts[0]] ? overrides.global.enum[parts[0]] : parts[0]} enum`
      case 'struct':
        return `@${overrides.global.structure[parts[0]] ? overrides.global.structure[parts[0]] : parts[0]} structure`
      case 'key':
        return `@${parts[0]} key`
      case 'lib':
        return `@${parts[0]} library`
      case 'truefalse':
        return `if true, ${parts[0]} and if false, ${parts[1]}`
      case 'shaderlink':
        return `@${parts[0]} shader`
      case 'deprecated':
        this.json.deprecated = parts[0] ? clean(this.parseLinks(parts[0]), 'norm') : true
        return ''
      case 'delete':
        this.json.deleted = clean(parts[0], 'norm')
        return ''
      case 'sandboxderived':
        this.json.sandboxderived = true
        return ''
      case 'validate':
        this.json.validate = true
        return ''
      case 'stub':
        this.json.stub = true
        return ''
      case 'internal':
        this.json.internal = parts[0] ? clean(this.parseLinks(parts[0]), 'norm') : true
        return ''
      case 'nextupdate':
        this.json.update = parts[0] ? clean(this.parseLinks(parts[0]), 'norm') : true
        return ''
      case 'note':
        const note = clean(this.parseLinks(parts[0]), 'norm')
        if (!this.json.notes) {
          this.json.notes = [note]
        } else {
          this.json.notes.push(note)
        }
        return ''
      case 'warning':
        const warning = clean(this.parseLinks(parts[0]), 'norm')
        if (!this.json.warnings) {
          this.json.warnings = [warning]
        } else {
          this.json.warnings.push(warning)
        }
        return ''
      case 'renderingcontext':
        this.json.rendering = {
          context: clean(parts.shift(), 'norm|lower'),
          type: clean(parts.shift(), 'norm|lower')
        }
        return ''
      case 'enumfield':
        const key = clean(parts.shift(), 'clean|trim')
        const val = {
          value: parseInt(clean(parts.shift(), 'clean')),
          desc: clean(this.parseLinks(parts.shift()), 'norm')
        }

        if (!this.temp.enums) {
          this.temp.enums = { [key]: val }
        } else {
          this.temp.enums[key] = val
        }
        return ''
      case 'funcarg':
        const funcarg = {
          type: parts.shift(),
          name: parts.shift(),
          desc: parts.shift(),
          default: parts.shift(),
        }

        if (!this.temp.args) {
          this.temp.args = [this.escapeStructure(funcarg)]
        } else {
          this.temp.args.push(this.escapeStructure(funcarg))
        }
        return ''
      case 'structurefield':
        const structurefield = {
          type: parts.shift(),
          name: parts.shift(),
          desc: parts.shift(),
          default: parts.shift(),
          args: this.temp.args,
        }

        delete this.temp.args

        if (!this.temp.structures) {
          this.temp.structures = [this.escapeStructure(structurefield)]
        } else {
          this.temp.structures.push(this.escapeStructure(structurefield))
        }
        return ''
      case 'shaderparameter':
        const shaderparameter = {
          type: parts.shift(),
          name: parts.shift(),
          desc: parts.shift(),
          default: parts.shift()
        }

        if (!this.temp.structures) {
          this.temp.structures = [this.escapeStructure(shaderparameter)]
        } else {
          this.temp.structures.push(this.escapeStructure(shaderparameter))
        }
        return ''
      case 'structure':
      case 'enumeration':
      case 'panelhook':
      case 'hook':
      case 'panelfunc':
      case 'func':
      case 'shader':
      case 'bug':
      case 'ret':
      case 'arg':
      case 'example':
        return this.parseAttributes(type, parts)
      default:
        if (type && type.includes('}')) {
          return `[{${type}}]`
        } else if (type && type.includes(':')) {
          const subParts = type.split(':')
          const subType = subParts.shift()

          switch(subType) {
            case 'user':
            case 'displaytitle':
              return subParts[0]
            default:
              throw new Error(`Unknown block sub type ${subType}: `)
          }
        } else {
          throw new Error(`Unknown block type ${type}`)
        }
    }
  }


  private parseAttributes(type: string, parts: string[]): string {
    let attributes: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any

    for (const part of parts) {
      const parts = part.split('=')
      let attribute = 'text'

      if (type === 'bug' && clean(parts[0], 'e|t|lo') !== 'issue') {
        // noop
      } else if (parts.length > 1) {
        attribute = clean(parts.shift(), 'e|t|lo')
      }

      const field = clean(parts.join('='), 'norm')

      switch (attribute) {
        case 'outputfixedwidth':
        case 'appendedenums':
        case 'fieldsonly':
          break
        case 'parameters':
        case 'fields':
          attributes[attribute] = this.temp.enums ? this.temp.enums : this.temp.structures
          break
        case 'isclass':
        case 'category':
        case 'predicted':
          attributes[attribute] = this.parseBool(field)
          break
        case 'realm':
          if (field.includes('and')) {
            attributes[attribute] = []
            for (const realm of field.split('and')) {
              const name = clean(realm, 'c|lo|t')
              if (name === 'shared') {
                attributes[attribute].push('client', 'server')
              } else {
                attributes[attribute].push(name)
              }
            }
          } else {
            const name = clean(field, 'c|lo')
            if (name === 'shared') {
              attributes[attribute] = ['client', 'server']
            } else {
              attributes[attribute] = [name]
            }
          }
          break
        default:
          attributes[attribute] = field
          break
      }
    }

    if (this.temp.args && (type == 'ret' || type == 'arg')) {
      attributes.args = this.temp.args
      delete this.temp.args
    }

    attributes = this.escapeStructure(attributes)

    switch (type) {
      case 'bug':
        if (!this.json.bugs) { this.json.bugs = [] }
        this.json.bugs.push(attributes)
        return ''
      case 'ret':
        if (!this.json.returns) {
          this.json.returns = [attributes]
        } else {
          this.json.returns.push(attributes)
        }
        break
      case 'arg':
        if (!this.json.args) {
          this.json.args = [attributes]
        } else {
          this.json.args.push(attributes)
        }
        break
      case 'example':
        if (!this.json.examples) {
          this.json.examples = [attributes]
        } else {
          this.json.examples.push(attributes)
        }
        break
      case 'enumeration':
        attributes.name = (overrides.global.enum[this.name] ? overrides.global.enum[this.name] : this.name)
        attributes.parent = this.parent
        this.json.enumeration = attributes
        break
      case 'structure':
        attributes.name = (overrides.global.structure[this.name] ? overrides.global.structure[this.name] : this.name)
        attributes.parent = this.parent
        this.json.structure = attributes
        break
      case 'shader':
        attributes.name = this.name
        attributes.parent = this.parent
        this.json.shader = attributes
        break
      case 'panelhook':
      case 'hook':
      case 'panelfunc':
      case 'func':
        attributes.name = (attributes.name ? attributes.name : this.name)
        attributes.parent = (overrides.global.context[this.parent] ? overrides.global.context[this.parent] : this.parent)
        this.json[type] = attributes
        break
      default:
        throw new Error(`Unknown attribute ${type}`)
    }

    return ''
  }

  private parseLinks(str?: string) {
    if (!str) { return str }
    return this.parseBlock(str, (str?: string) => {
      if (!str) { return str }

      let s = str
      let title = ''
      if (str.includes('@')) {
        s = str.split('@').shift() as string
        title = str.split('@').pop() as string
      }

      const parts = s.split(':')
      if (s.startsWith(':')) {
        parts.shift()
      }

      switch(clean(parts[0], 't|lo')) {
        case 'wikipedia':
          return `[${title !== '' ? title : parts[1]}](https://en.wikipedia.org/wiki/${encodeURI(parts[1])})`
        case 'file':
        case 'image':
        case 'category':
          return `[${title !== '' ? title : parts.join(':')}](https://wiki.garrysmod.com/page/${encodeURI(parts.join(':'))})`
      }

      if (str.includes('@')) {
        return `[${title}](https://wiki.garrysmod.com/page/${encodeURI(s)})`
      }

      return `[${str}](https://wiki.garrysmod.com/page/${encodeURI(str)})`
    }, ['[[',']]'])
  }

  private parseBlock(str: string, func: (str?: string) => string | void, block: [string, string] = ['{{', '}}']): string {
    if (!str) {
      return str
    }

    let pos = 0
    let linePos = 0
    let brk = 0
    let brkStart = 0
    let out = ''

    while (pos <= str.length) {
      if (str.substr(pos, block[0].length) == block[0]) {
        if (brk === 0) { brkStart = pos }
        brk++
        pos++
        continue
      }
      if (str.substr(pos, block[1].length) == block[1]) {
        brk--
        if (brk === 0) {
          out = out + str.substring(linePos, brkStart) + (func(str.substring(brkStart + block[0].length, pos)) || '')
          linePos = pos + block[1].length
        }
        pos++
        continue
      }
      pos++
    }

    return out + str.substring(linePos, pos)
  }

  private parseBool(str?: string): boolean {
    if (!str) { return false }
    switch(str.trim().toLowerCase()) {
      case 'true': case 'yes': case '1': return true
      case 'false': case 'no': case '0': case null: return false
      default: return Boolean(str)
    }
  }

  private escapeStructure(obj: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    let type
    if (obj.type) {
      type = this.escapeTypeName(obj.type)
    }

    let name
    if (obj.name) {
      name = this.escapeName(obj.name, type)
    }

    for (const k of Object.keys(obj)) {
      switch (k) {
        case 'name':
            obj[k] = name
          break
        case 'type':
            obj[k] = this.escapeType(type, obj.description || obj.desc, name)
          break
        case 'text':
        case 'output':
        case 'description':
        case 'desc':
            obj[k] = clean(this.parseLinks(obj[k]), 'norm')
          break
        case 'default':
            obj[k] = clean(obj[k], 'clean|trim')
          break
      }
    }

    if (obj.type && obj.type.includes('undefined')) {
      obj.type.splice(obj.type.indexOf('undefined'), 1)
      obj.optional = true
    } else if (obj.desc && obj.desc.includes('optional')) {
      obj.optional = true
    }

    return obj
  }

  private escapeType(raw?: string, desc?: string, name?: string) {
    let types: string[] = []

    const search = (reg: RegExp) => {
      let match, matches: string[] = [] // eslint-disable-line prefer-const
      while (match = reg.exec(desc as string)) {
        if (match[1]) {
          matches.push(match[1])
        }
      }
      return matches.map(s => (this.escapeTypeName(s) as string))
    }

    if (desc && desc != ''){
      const structs = search(/@([a-zA-Z_.:]+)[\s]structure/gmi)
      const typs = search(/@([a-zA-Z_.:]+)[\s]type/gmi)

      if (name && /color/gi.test(name) && !structs.includes('Color')) {
        structs.push('Color')
      }

      switch (raw) {
        case 'number':
          types = types.concat(
            search(/@([a-zA-Z_.:]+)[\s]enum/gmi)
              .filter(s => s !== 'STENCIL')
              .map(s => s == overrides.global.enum[s] ? overrides.global.enum[s] : s)
          )
          break
        case 'table':
          if (name && /color/gi.test(name)) {
            types.push('Color')
          } else if (/table[\s]of[\s]tables/i.test(desc)) {
            types.push('table[]')
          } else if (/table[\s]of/i.test(desc) || /list[\s]of/i.test(desc)) {
            if (structs.length > 0){
              types.push(`${structs.shift()}[]`)
            } else if (typs.length > 0) {
              types.push(`${typs.shift()}[]`)
            }
          } else {
            types = types.concat(structs)
          }
          break
        case 'boolean':
        case 'string':
          break
        default:
          if (typs.includes('table') && structs.includes('Color')) {
            typs.splice(typs.indexOf('table'), 1)
            structs.splice(structs.indexOf('Color'), 1)
            types.push('Color')
          }

          types = types.concat(typs)
      }
    }

    if (types.length == 0){
      types.push(raw as string)
    }

    return types
  }

  private escapeTypeName(raw?: string, name?: string) {
    switch(clean(raw, 'trim|lower')) {
      case 'nil':
        return 'undefined'
      case 'vararg':
      case 'varargs':
        return 'any[]'
    }

    return clean(raw, 'clean|trim|param')
  }

  private escapeName(raw?: string, type?: string) {
    if (!raw) { return raw }

    switch(clean(raw, 'trim|lower|quotes')) {
      case 'number':
        return 'num'
      case 'string':
        return 'str'
      case 'colour':
        return 'color'
      case 'class':
        return 'cls'
      case 'default':
        return 'def'
      case 'var':
        return 'obj'
      case 'old':
        return 'prev'
      case 'new':
        return 'next'
      case 'function':
        return 'func'
      case 'self':
        return 'this'
    }

    if (raw.includes('...') || type == 'any[]') {
      raw = `...${raw.replace(/\.+/gm, '')}`
    }

    if (raw === '...') {
      raw = '...args'
    }

    return clean(raw, 'trim|quotes|param')
  }
}
