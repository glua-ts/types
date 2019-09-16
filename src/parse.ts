import * as fs from 'fs-extra'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as globby from 'globby'
import * as ms from 'pretty-ms'

import { time } from './utils'

import cac from 'cac'
import chalk from 'chalk'

import Parser, { IWikiPage } from './lib/parser'

const cli = cac('parse')
const parser = new Parser()

/*/
const data = fs.readJSONSync(path.join(process.cwd(), 'data/wiki/chat/AddText.2780.json'))
console.log(parser.parse(data).args)
/*/

cli
  .command('[path]', 'Parse wiki into json to be converted into typings')
  .option('--quiet', 'No output')
  .option('--verbose', 'Lots of output')
  .action((d, opts) => {
    const start: Date = new Date()
    const wiki = d ? d : path.join(process.cwd(), 'data/wiki')
    const errors: Array<{ err: Error, page?: string }> = []

    return fs
    .ensureDir(path.join(wiki, '_meta'))
    .then(() => globby([
      path.join(wiki, '**/*.json').replace(/\\/g, '/'),
      `!${path.join(wiki, '_meta/**/*.json')}`.replace(/\\/g, '/')
    ]))
    .then((files) => {
      return Bluebird.map(files, (file) => {
        const st: Date = new Date()

        return fs
          .readJSON(file)
          .then((page: IWikiPage) => {
            const parsed = parser.parse(page)

            return fs
              .writeJSON(file, parsed, {spaces: '  '})
              .then(() => {
                if (opts.verbose) {
                  console.log(chalk`{bgGreen {black  SAVED }} {green ${parsed.title} in ${ms(time(st))}}`)
                }
                return Promise.resolve()
              })
          })
          .catch(err => errors.push({ err: err, page: file }))
      }, { concurrency: 4 })
    })
    .then(() => {
      if (!opts.quiet) {
        if (errors.length > 0) {
          console.log(chalk`{bgYellow {black  DONE }} {yellow Parsing complete in ${ms(time(start))} with ${errors.length.toString()} errors}`)
          return fs.writeJson(path.join(wiki, '_meta/err_parse.json'), errors, {spaces: '  '})
        }  else {
          console.log(chalk`{bgGreen {black  DONE }} {green Parsing complete in ${ms(time(start))}}`)
        }
      }
    })
    .catch(err => { console.error(err) })
  })

cli.help()
cli.parse()
