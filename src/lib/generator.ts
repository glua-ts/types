import { IParsed, IFunc, IArgument, IReturn, IShader, IEnumeration, IStructure } from './parser'
import { clean, enumerate } from './utils'

import overrides, { IOverride, IOverideParam, ISubOverideParam, IOverideReturn } from './overrides'

export interface IType {
  comments: string[],
  type: string,
  name: string,
  typing: string,
  context?: string,
}

export interface IGeneratedStructure {
  type: string,
  name: string,
  typing?: string,
  desc?: string,
  default?: string,
  optional?: boolean,
}

export interface IGeneratedReturn {
  type: string,
  typing?: string,
  desc?: string,
  args?: IGeneratedStructure[],
}

export interface IGeneratedArgument extends IGeneratedStructure {
  args?: IGeneratedStructure[],
}

export interface IObjectList {
  [k: string]: {
    comments: string[],
    extends: string[],
    funcs: string[],
  },
}

export interface IGenerated {
  types?: IType[],
  extends?: string[],
  context: string,
  type: string,
  name: string,
  comments: string[],
  typings: string[],
}

export default class Generator {
  private parsed: IParsed = { raw: '', title: '', id: 0, }
  private extends: string[] | undefined
  private types: IType[] | undefined
  private context: string = ''
  private type: string = ''
  private name: string = ''
  private typings: string[] = []
  private comments: string[] = []

  public generate(json: IParsed): IGenerated | undefined {
    this.parsed = json
    this.extends = undefined
    this.types = undefined
    this.name = ''
    this.type = ''
    this.context = ''
    this.typings = []
    this.comments = []

    const skip = [
      'Global/Error'
    ]

    if (skip.includes(json.title)) {
      return
    }

    let processed = false

    if (json.func) { this.func(json.func, json.args, json.returns, json.func.isclass); processed = true }
    if (json.panelfunc) { this.func(json.panelfunc, json.args, json.returns, true, true); processed = true }

    if (json.hook) { this.hook(json.hook, json.args, json.returns); processed = true }
    if (json.panelhook) { this.hook(json.panelhook, json.args, json.returns); processed = true }

    if (json.structure) { this.structure(json.structure); processed = true }
    if (json.shader) { this.shader(json.shader); processed = true }
    if (json.enumeration) { this.enumeration(json.enumeration); processed = true }

    if (processed) {
      return {
        comments: this.comments,
        type: this.type,
        context: this.context,
        extends: this.extends,
        name: this.name,
        typings: this.typings,
        types: this.types,
      }
    }
  }

  public compile(generated: IGenerated[]): string {
    let out = ''

    const types: { [k: string]: string[] } = {}
    const funcs: { [k: string]: string[] } = {}

    const enums: IObjectList = {}
    const interfaces: IObjectList= {}
    const classes: IObjectList = {}

    const namespaces: {
      [k: string]: {
        comments: string[],
        type: string[],
        func: string[],
        interface: IObjectList,
      },
    } = {}

    const process = (t?: IType[]) => {
      if (!t) { return }

      for (const type of t) {
        switch(type.type) {
          case 'type':
              types[type.name] = [
                `/**${type.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`,
                `type ${type.name} = ${type.typing}\n\n`
              ]
            break
          case 'interface':
            if (type.context) {
              if (!interfaces[type.context]) {
                interfaces[type.context] = {
                  comments: [],
                  funcs: [],
                  extends: [],
                }
              }

              interfaces[type.context].funcs.push(`/**${type.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)
              interfaces[type.context].funcs.push(`${type.name}: ${type.typing}\n`)
            }
            break
          case 'enum':
            if (type.context) {
              if (!enums[type.context]) {
                enums[type.context] = {
                  comments: [],
                  funcs: [],
                  extends: [],
                }
              }

              enums[type.context].funcs.push(`/**${type.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)
              enums[type.context].funcs.push(`${type.name} = ${type.typing},`)
            }
            break
        }
      }
    }

    for (const gen of generated) {
      switch(gen.type) {
        case 'func':
          if (gen.context == 'Global') {
            funcs[gen.name] = [
              `/**${gen.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`,
              `declare function ${gen.name}${gen.typings[0]}\n\n`
            ]
            process(gen.types)
          } else {
            if (!namespaces[gen.context]) {
              namespaces[gen.context] = {
                comments:[],
                type: [],
                func: [],
                interface: {},
              }
            }

            namespaces[gen.context].func.push(`/**${gen.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)
            namespaces[gen.context].func.push(`export function ${gen.name}${gen.typings[0]}\n`)

            if (gen.types) {
              for (const type of gen.types) {
                switch(type.type) {
                  case 'type':
                      namespaces[gen.context].type.push(`/**${type.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)
                      namespaces[gen.context].type.push(`type ${type.name} = ${type.typing}\n`)
                    break
                  case 'interface':
                    if (type.context) {
                      if (!namespaces[gen.context].interface[type.context]) {
                        namespaces[gen.context].interface[type.context] = {
                          comments: [],
                          funcs: [],
                          extends: [],
                        }
                      }

                      namespaces[gen.context].interface[type.context].funcs.push(`  /**${type.comments.join('\n').split('\n').reduce((a, c) => `${a}\n  * ${c}`, '')}\n  **/`)
                      namespaces[gen.context].interface[type.context].funcs.push(`  ${type.name}: ${type.typing}\n`)
                    }
                    break
                }
              }
            }
          }
          break
        case 'class':
          if (!classes[gen.context]) {
            classes[gen.context] = {
              comments: [],
              extends: [],
              funcs: []
            }
          }

          if (gen.extends) {
            for (const ext of gen.extends) {
              if (!classes[gen.context].extends.includes(ext)) {
                classes[gen.context].extends.push(ext)
              }
            }
          }

          classes[gen.context].funcs.push(`/**${gen.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)
          classes[gen.context].funcs.push(`${gen.name}${gen.typings[0]}\n`)

          process(gen.types)
          break
        case 'shader':
        case 'struct':
          if (gen.context) {
            if (!interfaces[gen.context]) {
              interfaces[gen.context] = {
                comments: [],
                funcs: [],
                extends: []
              }
            }

            interfaces[gen.context].comments.push(`/**${gen.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)

            if (gen.types) {
              process(gen.types)
            }
          }
          break
        case 'enum':
          if (gen.name) {
            if (!enums[gen.name]) {
              enums[gen.name] = {
                comments: [],
                funcs: [],
                extends: []
              }
            }

            enums[gen.name].comments.push(`/**${gen.comments.join('\n').split('\n').reduce((a, c) => `${a}\n* ${c}`, '')}\n**/`)

            if (gen.types) {
              process(gen.types)
            }
          }
          break
      }
    }

    out = out + `${overrides.global.typings.join('\n')}\n\n`

    for (const k of Object.keys(types)) {
      const data = types[k]
      out = out + data.join('\n')
    }

    for (const k of Object.keys(funcs)) {
      const data = funcs[k]
      out = out + data.join('\n')
    }

    for (const k of Object.keys(enums)) {
      const data = enums[k]
      out = out + data.comments.join('\n').split('\n').reduce((a, c) => `${a}\n${c}`, '')
      out = out + `\ndeclare enum ${k} ${data.extends.length > 0 ? `extends ${data.extends.join(', ')}` : ''} {`
      out = out + data.funcs.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
      out = out + '\n}'
    }

    for (const k of Object.keys(interfaces)) {
      const data = interfaces[k]
      out = out + data.comments.join('\n').split('\n').reduce((a, c) => `${a}\n${c}`, '')
      out = out + `\ndeclare interface ${k} ${data.extends.length > 0 ? `extends ${data.extends.join(', ')}` : ''} {`
      out = out + data.funcs.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
      out = out + '\n}'
    }

    for (const k of Object.keys(classes)) {
      const data = classes[k]
      out = out + data.comments.join('\n').split('\n').reduce((a, c) => `${a}\n${c}`, '')
      out = out + `\ndeclare interface ${k} ${data.extends.length > 0 ? `extends ${data.extends.join(', ')}` : ''} {`
      out = out + data.funcs.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
      out = out + '\n}'
    }

    for (const k of Object.keys(namespaces)) {
      const data = namespaces[k]
      out = out + `\ndeclare namespace ${k} {`
      if (data.type.length > 0) {
        out = out + data.type.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
      }
      if (data.func.length > 0) {
        out = out + data.func.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
      }

      for (const k of Object.keys(data.interface)) {
        const inter = data.interface[k]
        out = out + inter.comments.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
        out = out + `\n  interface ${k} ${inter.extends.length > 0 ? `extends ${inter.extends.join(', ')}` : ''} {`
        out = out + inter.funcs.join('\n').split('\n').reduce((a, c) => `${a}\n  ${c}`, '')
        out = out + '\n  }'
      }

      out = out + '\n}\n'
    }

    return out
  }

  private comment() {
    const { internal, title, notes, warnings, rendering, bugs, update, stub, validate, deleted } = this.parsed

    if (title) { this.comments.push(`@wiki https://wiki.garrysmod.com/page/${title}`) }
    if (internal) { this.comments.push(typeof internal === 'string' ? `@internal ${internal}` : '@internal') }
    if (validate) { this.comments.push('@validate') }
    if (deleted) { this.comments.push(`@deleted ${deleted}`) }
    if (rendering) { this.comments.push(`@rendering ${rendering.context}:${rendering.type}`) }
    //if (update) {}
    //if (stub) {}
    if (notes) {
      for (const n of notes) {
        this.comments.push(`@note ${n}`)
      }
    }
    if (warnings) {
      for (const w of warnings) {
        this.comments.push(`@warning ${w}`)
      }
    }
    if (bugs) {
      for (const b of bugs) {
        this.comments.push(`@bug ${b.issue ? `#${b.issue} ` : ' '}${b.text}`)
      }
    }
  }

  private func(obj: IFunc, args?: IArgument[], returns?: IReturn[], isclass = false, panel = false) {
    const { predicted, realm, file, line, description } = obj
    let { parent, name } = obj

    if (name.includes('.')) {
      const parts = name.split('.')
      name = parts.pop() as string
      parent = `${parent}.${parts.join('.')}`
    }

    this.context = parent
    this.name = name
    this.type = isclass ? 'class' : 'func'


    if (description) {
      this.comments.push(`\n${description}\n`)
    }

    this.comments.push(`@name ${parent === 'Global' ? '': `${parent}${isclass ? ':' : '.'}`}${name}`)

    if (predicted !== undefined) {
      this.comments.push(`@predicted ${predicted ? 'true' : 'false' }`)
    }

    if (realm) {
      this.comments.push(`@realm ${realm.join(', ')}`)
    }

    this.comment()

    const self: IArgument = {
      name: 'this',
      type: [this.type === 'func' ? 'void' : overrides.global.self[this.context] ? overrides.global.self[this.context] : this.context],
    }

    if (args) {
      args.unshift(self)
    } else {
      args = [self]
    }

    /*
    if (file) {
      this.comments.push(`@file ${file}:${line ? line : ''}`)
    }
    */

    const funcArgs: IGeneratedArgument[] = []
    if (args) {
      for (const a of args) {
        const arg = this.arg(a, obj)
        this.comments.push(`@param {${arg.type}} ${arg.name} - ${arg.desc ? arg.desc : 'no description'}`)
        funcArgs.push(arg)
      }
    }

    const funcReturns: IGeneratedReturn[] = []
    if (returns) {
      for (const [i, r] of enumerate(returns)) {
        const ret = this.ret(r, obj, i)
        this.comments.push(`@returns {${ret.type}} - ${ret.desc ? ret.desc : 'no description'}`)
        funcReturns.push(ret)
      }

      if (funcReturns.length > 1) {
        this.comments.push('@tupleReturn')
      }
    } else {
      this.comments.push('@returns {void}')
    }

    if (overrides.global.extend[this.context]) {
      if (!this.extends) { this.extends = [] }

      for (const o of overrides.global.extend[this.context]) {
        if (!this.extends.includes(o)) {
          this.extends.push(o)
        }
      }
    }

    const funcOverrides = this.getFuncOverrides(obj)
    this.typings.push(`${funcOverrides.prefix ? funcOverrides.prefix : ''}(${funcArgs.length > 0 ? funcArgs.map(r => `${r.name}${r.optional ? '?' : ''}: ${r.typing}`).join(', ') : '' }): ${funcReturns.length > 0 ? funcReturns.length > 1 ? `[${funcReturns.map(r => r.typing).join(', ')}]` : funcReturns.map(r => r.typing).join(', ') : 'void' }`)
  }

  private hook(obj: IFunc, args?: IArgument[], returns?: IReturn[]) {
    return this.func(obj, args, returns, true)
  }

  private structure(obj: IStructure) {
    const { parent, name } = obj

    this.context = parent
    this.name = name

    this.comment()
    this.comments.push(`@interface ${name}`)
    this.comments.push(`@description ${obj.description}`)

    this.type = 'struct'

    if (overrides.global.extend[this.context]) {
      if (!this.extends) { this.extends = [] }

      for (const o of overrides.global.extend[this.context]) {
        if (!this.extends.includes(o)) {
          this.extends.push(o)
        }
      }
    }

    if (!this.types) { this.types = [] }

    for (const param of obj.fields) {
      const p = this.arg(param, obj) as IGeneratedArgument
      this.types.push({
        comments: [`@${p.name} {${p.type}}: ${p.desc ? p.desc : 'no description'}`],
        context: this.name,
        type: 'interface',
        name: p.name,
        typing: p.typing as string
      })
    }
  }

  private shader(obj: IShader) {
    const { parent, name } = obj

    this.comment()
    this.comments.push(`@interface ${name}`)
    this.comments.push(`@description ${obj.description}`)

    this.type = 'shader'
    this.context = parent
    this.name = name

    if (overrides.global.extend[this.context]) {
      if (!this.extends) { this.extends = [] }

      for (const o of overrides.global.extend[this.context]) {
        if (!this.extends.includes(o)) {
          this.extends.push(o)
        }
      }
    }

    if (!this.types) { this.types = [] }

    for (const param of obj.parameters) {
      this.types.push({
        comments: [`@param {${param.type}} ${param.name} ${param.desc ? param.desc : 'no description'}`],
        context: this.name,
        type: 'interface',
        name: param.name,
        typing: param.type.join(' | ')
      })
    }
  }

  private enumeration(obj: IEnumeration) {
    const { name, parent } = obj

    this.comment()
    this.comments.push(`@enum ${name}`)
    this.comments.push(`@description ${obj.description}`)

    this.type = 'enum'
    this.context = parent
    this.name = name

    if (!this.types) { this.types = [] }

    let member = true
    for (let [key, value] of Object.entries(obj.fields)) { // eslint-disable-line prefer-const
      if (key.includes('.')) {
        member = false
        key = key.split('.').pop() as string
      }

      this.types.push({
        comments: [`@param ${key} - ${value.desc ? value.desc : 'no description'}`],
        context: this.name,
        type: 'enum',
        name: key,
        typing: value.value.toString()
      })
    }

    if (member) {
      this.comments.push('@compileMembersOnly')
    }
  }

  private ret(input: IReturn, func: IFunc, index: number): IGeneratedReturn {
    const overrides = this.getFuncOverrides(func, input, index)
    const ret: IGeneratedReturn = {
      type: overrides.type ? overrides.type : input.type.join(' | '),
      typing: overrides.typing ? overrides.typing : undefined,
      desc: overrides.desc ? overrides.desc : input.desc,
    }

    const ctx = this.context.replace('.', '_')
    let name = func.name
    let comments: string[] = []
    let typing = ''

    switch(ret.type) {
      case 'table':
        if (input.args) {
          name = `I${ctx}${name}Return${overrides.prefix ? overrides.prefix : ''}`
          comments.push(`@interface ${name}`)

          if (!this.types) { this.types = [] }

          const subs: IGeneratedStructure[] = []
          for (const sub of input.args) {
            const overrides = this.getFuncOverrides(func, input, index, sub.name)
            const data = {
              name: overrides.name ? overrides.name : sub.name,
              type: overrides.type ? overrides.type : sub.type.join(' | '),
              typing: overrides.typing ? overrides.typing : undefined,
              desc: overrides.desc ? overrides.desc : sub.desc,
              default: overrides.default ? overrides.default : sub.default,
              optional: overrides.optional ? overrides.optional : sub.optional,
            }

            data.name = `${data.name}${overrides.prefix ? overrides.prefix : ''}`

            switch(data.type) {
              case 'function':
                  data.typing = 'UnknownFunc'
                break
              default:
                  data.typing = data.typing ? data.typing : data.type
            }

            this.types.push({
              comments: [`${data.name} - {${data.type}}: ${data.desc ? data.desc : 'no description'}`],
              type: 'interface',
              name: data.name,
              typing: data.typing,
              context: name
            })
          }

          ret.type = name
          ret.typing = name
          ret.args = subs
        } else {
          ret.typing = ret.typing ? ret.typing : ret.type
        }
        break
      case 'function':
        if (input.args) {
          name = `${ctx}${name}Return${overrides.prefix ? overrides.prefix : ''}`

          comments.push(`@type ${name}`)

          if (!this.types) { this.types = [] }

          if (input.args[0] && input.args[0].name !== 'this') {
            const self: IArgument = {
              name: 'this',
              type: ['void'],
              optional: false,
            }
            input.args.unshift(self)
          }

          const subs: IGeneratedStructure[] = []
          for (const sub of input.args) {
            const overrides = this.getFuncOverrides(func, input, index, sub.name)
            const data = {
              name: overrides.name ? overrides.name : sub.name,
              type: overrides.type ? overrides.type : sub.type.join(' | '),
              typing: overrides.typing ? overrides.typing : undefined,
              desc: overrides.desc ? overrides.desc : sub.desc,
              default: overrides.default ? overrides.default : sub.default,
              optional: overrides.optional ? overrides.optional : sub.optional,
            }

            data.name = `${data.name}${overrides.prefix ? overrides.prefix : ''}`

            switch(data.type) {
              case 'function':
                data.typing = 'UnknownFunc'
                break
              default:
                data.typing = data.typing ? data.typing : data.type
            }

            subs.push(data)
          }

          typing = `(${subs.map(s => `${s.name}${s.optional ? '?' : ''}: ${s.typing}`).join(', ')}) => unknown`
          comments = comments.concat(subs.map(s => `@param {${s.type}} ${s.name} - ${s.desc ? s.desc : 'no description'}`))

          ret.typing = name
          ret.args = subs

          if (!this.types) { this.types = []}
          this.types.push({comments, type: 'type', name, typing})
        } else {
          ret.typing = ret.typing ? ret.typing :  'UnknownFunc'
        }
        break
      default:
        ret.typing = ret.typing ? ret.typing : ret.type
    }

    return ret
  }

  private arg(input: IArgument, func: IFunc | IStructure): IGeneratedArgument {
    const overrides = this.getFuncOverrides(func, input, input.name)
    const arg: IGeneratedArgument = {
      name: overrides.name ? overrides.name : input.name,
      type: overrides.type ? overrides.type : input.type.join(' | '),
      typing: overrides.typing ? overrides.typing : undefined,
      desc: overrides.desc ? overrides.desc : input.desc,
      default: overrides.default ? overrides.default : input.default,
      optional: overrides.optional ? overrides.optional : input.optional,
    }

    const ctx = this.context.replace('.', '_')
    let name = func.name
    let comments: string[] = []
    let typing = ''

    switch(arg.type) {
      case 'table':
        if (input.args) {
          if (arg.name) {
            name = `I${ctx}${name}${clean(arg.name, 'cap')}${overrides.prefix ? overrides.prefix : ''}`
          } else {
            name = `I${ctx}${name}${overrides.prefix ? overrides.prefix : ''}`
          }

          comments.push(`@interface ${name}`)

          if (!this.types) { this.types = [] }

          const subs: IGeneratedStructure[] = []
          for (const sub of input.args) {
            const overrides = this.getFuncOverrides(func, input, input.name, sub.name)
            const data: IGeneratedStructure = {
              name: overrides.name ? overrides.name : sub.name,
              type: overrides.type ? overrides.type : sub.type.join(' | '),
              typing: overrides.typing ? overrides.typing : undefined,
              desc: overrides.desc ? overrides.desc : sub.desc,
              default: overrides.default ? overrides.default : sub.default,
              optional: overrides.optional ? overrides.optional : sub.optional,
            }

            data.name = `${data.name}${overrides.prefix ? overrides.prefix : ''}`

            if (data.name === 'this') {
              data.optional = false
            }

            switch(data.type) {
              case 'function':
                  data.typing = 'UnknownFunc'
                break
              default:
                  data.typing = data.typing ? data.typing : data.type
            }

            this.types.push({
              comments: [`${data.name} - {${data.type}}: ${data.desc ? data.desc : 'no description'}`],
              type: 'interface',
              name: data.name,
              typing: data.typing,
              context: name
            })
          }

          arg.type = name
          arg.typing = name
          arg.args = subs
        } else {
          arg.typing = arg.typing ? arg.typing : arg.type
        }
        break
      case 'function':
        if (input.args) {
          if (arg.name) {
            if (clean(arg.name, 't|lo').includes('callback')){
              name = `${ctx}${name}Callback${overrides.prefix ? overrides.prefix : ''}`
            } else if (clean(arg.name, 't|lo').includes('func')){
              name = `${ctx}${name}Func${overrides.prefix ? overrides.prefix : ''}`
            } else {
              name = `${ctx}${name}${clean(arg.name, 'cap')}${overrides.prefix ? overrides.prefix : ''}`
            }
          }

          comments.push(`@type ${name}`)

          if (input.args[0] && input.args[0].name !== 'this') {
            const self: IArgument = {
              name: 'this',
              type: ['void'],
              optional: false,
            }
            input.args.unshift(self)
          }

          const subs: IGeneratedStructure[] = []
          for (const sub of input.args) {
            const overrides = this.getFuncOverrides(func, input, input.name, sub.name)
            const data = {
              name: overrides.name ? overrides.name : sub.name,
              type: overrides.type ? overrides.type : sub.type.join(' | '),
              typing: overrides.typing ? overrides.typing : undefined,
              desc: overrides.desc ? overrides.desc : sub.desc,
              default: overrides.default ? overrides.default : sub.default,
              optional: overrides.optional ? overrides.optional : sub.optional,
            }

            data.name = `${data.name}${overrides.prefix ? overrides.prefix : ''}`

            if (data.name === 'this') {
              data.optional = false
            }

            switch(data.type) {
              case 'function':
                data.typing = 'UnknownFunc'
                break
              default:
                data.typing = data.typing ? data.typing : data.type
            }

            subs.push(data)
          }

          typing = `(${subs.map(s => `${s.name}${s.optional ? '?' : ''}: ${s.typing}`).join(', ')}) => unknown`
          comments = comments.concat(subs.map(s => `@param {${s.type}} ${s.name} - ${s.desc ? s.desc : 'no description'}`))

          arg.typing = name
          arg.args = subs

          if (!this.types) { this.types = []}
          this.types.push({comments, type: 'type', name, typing})
        } else {
          arg.typing = arg.typing ? arg.typing : 'UnknownFunc'
        }
        break
      default:
        arg.typing = arg.typing ? arg.typing : arg.type
    }
    return arg
  }

  private getFuncOverrides(func: IFunc ): IOverride
  private getFuncOverrides(func: IFunc, input: IReturn, index: number ): IOverideReturn
  private getFuncOverrides(func: IFunc, input: IReturn, index: number, sub: string ): ISubOverideParam
  private getFuncOverrides(func: IFunc, input: IArgument, index: string ): IOverideParam
  private getFuncOverrides(func: IFunc, input: IArgument, index: string, sub: string): ISubOverideParam
  private getFuncOverrides(func: IFunc, input?: IArgument | IReturn, index?: string | number, sub?: string ): IOverride | IOverideReturn | IOverideParam | ISubOverideParam {
    if (!overrides) { return {} }

    const base = overrides.func[`${this.context}/${this.name}`]
    if (base !== undefined && input !== undefined && index !== undefined) {
      if (typeof index === 'number' && base.returns && base.returns[index]) {
        const retbase  = base.returns[index]
        if (sub !== undefined && retbase.args !== undefined) {
          return retbase.args[sub] || {} as ISubOverideParam
        } else {
          return retbase || {} as IOverideReturn
        }
      } else if (typeof index === 'string' && base.params !== undefined && base.params[index] !== undefined) {
        const argbase  = base.params[index]
        if (sub !== undefined && argbase.args !== undefined) {
          return argbase.args[sub] || {} as ISubOverideParam
        } else {
          return argbase || {} as IOverideParam
        }
      } else {
        return {}
      }
    } else {
      return base || {} as IOverride
    }
  }
}
