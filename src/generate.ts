import * as fs from 'fs-extra'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as globby from 'globby'
import * as ms from 'pretty-ms'

import { time } from './utils'

import { IParsed } from './lib/parser'
import Generator, { IGenerated } from './lib/generator'

import cac from 'cac'
import chalk from 'chalk'

const cli = cac('parse')
const generator = new Generator()

cli
  .command('[path]', 'Parse wiki into json to be converted into typings')
  .option('--quiet', 'No output')
  .option('--verbose', 'Lots of output')
  .action((d, opts) => {
    const start: Date = new Date()
    const dest = d || path.join(process.cwd(), '/typings')

    const wiki = opts.wiki ? opts.wiki : path.join(process.cwd(), 'data/wiki')
    const errors: Array<{ err: Error, path?: string }> = []

    const generated: IGenerated[] = []

    return fs
    .ensureDir(dest)
    .then(() => globby([
      path.join(wiki, '**/*.json').replace(/\\/g, '/'),
      `!${path.join(wiki, '_meta/**/*.json')}`.replace(/\\/g, '/')
    ]))
    .then((files) => {
      return Bluebird.map(files, (file) => {
        return fs
          .readJson(file)
          .then((json) => {
            const gen = generator.generate(json as IParsed)
            if (gen) {
              generated.push(gen)
            }
          })
          .catch(err => errors.push({ err: err, path: file }))
      }, { concurrency: 4 })
    })
    .then(() => fs.ensureDir(path.join(dest, '_meta')))
    .then(() => fs.writeJson(path.join(dest, '_meta/generated.json'), generated, {spaces: '  '}))
    .then(() => fs.writeFile(path.join(dest, 'garrysmod.d.ts'), generator.compile(generated)))
    .then(() => {
      if (!opts.quiet) {
        if (errors.length > 0) {
          console.log(chalk`{bgYellow {black  DONE }} {yellow Generation complete in ${ms(time(start))} with ${errors.length.toString()} errors}`)
          return fs.writeJson(path.join(dest, '_meta/errors.json'), errors, {spaces: '  '})
        }  else {
          console.log(chalk`{bgGreen {black  DONE }} {green Generation complete in ${ms(time(start))}}`)
        }
      }
    })
    .catch(err => { console.error(err) })
  })

cli.help()
cli.parse()
