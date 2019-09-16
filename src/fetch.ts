import * as fs from 'fs-extra'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as sanitize from 'filenamify'
import * as ms from 'pretty-ms'

import Parser, { IWikiPage } from './lib/parser'

import { time } from './utils'

import cac from 'cac'
import chalk from 'chalk'
import axios from 'axios'

export interface IPageInfo {
  pageid: number,
  ns: number,
  title: string,
}

export interface IQueryAllPages {
  query: {
    allpages: IPageInfo[],
  },
  'query-continue'?: {
    allpages: {
      apfrom: string,
    },
  },
}

export interface ICategoryInfo {
  '*': string,
}

export interface IQueryAllCategories {
  query: {
    allcategories: ICategoryInfo[],
  },
  'query-continue'?: {
    allpages: {
      acfrom: string,
    },
  },
}

export interface IPageRevisions extends IPageInfo {
  pageid: number,
  ns: number,
  revisions: { '*': string } [],
}

export interface IQueryPageRevisions {
  query: {
    pages: {
      [pageid: string]: IPageRevisions,
    },
  },
}

const errors: Array<{ err: Error, page?: IPageInfo }> = []

const cli = cac('fetch')
const parser = new Parser()

const save = (dest: string, pages: IPageRevisions[], verbose = false) => {
  return Bluebird.map(pages, (page: IPageRevisions) => {
    const data: IWikiPage = parser.parse({
      title: page.title,
      id: page.pageid,
      raw: page.revisions[0]['*']
    })

    let file = data.title.replace(':','/')
    if (file.includes('/')) {
      const parts = []
      for (const s of file.split('/')) {
        parts.push(sanitize(s, {replacement: '_'}))
      }
      file = parts.join('/').replace(/\s/, '_')
    } else {
      file = sanitize(file, {replacement: '_'}).replace(/\s/, '_')
    }

    file = path.join(dest, `${file}.${page.pageid}.json`)

    return fs
      .ensureDir(path.dirname(file))
      .then(() => fs.writeJSON(file, data, {spaces: '  '}))
      .then(() => {
        if (verbose) {
          console.log(chalk`{bgGreen {black  SAVED }} {green ${page.title}}`)
        }
        return Promise.resolve()
      })
      .catch(err => errors.push({ err, page }))
  })
}

cli
  .command('[path]', 'Download garrysmod wiki in its entirety')
  .option('--quiet', 'No output')
  .option('--verbose', 'Lots of output')
  .action((d, opts) => {
    const start: Date = new Date()
    const dest = d || path.join(process.cwd(), 'data/wiki')

    return fs
      .ensureDir(path.join(dest, '_meta'))
      .then<IPageInfo[]>(() => {
        if (!opts.quiet) {
          console.log(chalk`{green Fetching wiki pages...}`)
        }

        return axios
        .get<IQueryAllPages>('https://wiki.garrysmod.com/api.php', {
          params: {
            action: 'query',
            format: 'json',
            list: 'allpages',
            aplimit: 10000
          }
        })
        .then((req) => Promise.resolve(req.data.query.allpages))
      })
      .then<IPageInfo[]>((pages) => {
        return fs
          .writeJson(path.join(dest, '_meta/pages.json'), pages, {spaces: '  '})
          .then(() => {
            if (!opts.quiet) {
              console.log(chalk`{green Downloading ${pages.length.toString()} pages into ${dest}...}`)
            }
            return Promise.resolve(pages)
          })
      })
      .then(pages => {
        const chunks = []
        for (let i = 0, j = pages.length; i < j; i += 10) {
          chunks.push(pages.slice(i, i + 10))
        }

        return Bluebird.map(chunks, (chunk: IPageInfo[]) => {
          return axios.get<IQueryPageRevisions>('https://wiki.garrysmod.com/api.php', {
            params: {
              action: 'query',
              prop: 'revisions',
              rvprop: 'content',
              format: 'json',
              pageids: chunk.map(c => c.pageid).join('|'),
            }
          })
          .then((req) => {
            const pages: IPageRevisions[] = []

            for (const k of Object.keys(req.data.query.pages)) {
              pages.push(req.data.query.pages[k])
            }

            return save(dest, pages, opts.verbose)
          })
          .catch(err => errors.push({ err }))
        }, { concurrency: 4 })
      })
      .then<ICategoryInfo[]>(() => {
        if (!opts.quiet) {
          console.log(chalk`{green Fetching wiki categories...}`)
        }
        return axios
        .get<IQueryAllCategories>('https://wiki.garrysmod.com/api.php', {
          params: {
            action: 'query',
            format: 'json',
            list: 'allcategories',
            aclimit: 500
          }
        })
        .then((req) => Promise.resolve(req.data.query.allcategories))
      })
      .then<ICategoryInfo[]>((categories) => {
        return fs
          .writeJson(path.join(dest, '_meta/categories.json'), categories, {spaces: '  '})
          .then(() => {
            if (!opts.quiet) {
              console.log(chalk`{green Downloading ${categories.length.toString()} categories into ${dest}...}`)
            }
            return Promise.resolve(categories)
          })
      })
      .then(categories => {
        const chunks = []
        for (let i = 0, j = categories.length; i < j; i += 10) {
          chunks.push(categories.slice(i, i + 10))
        }

        return Bluebird.map(chunks, (chunk: ICategoryInfo[]) => {
          return axios.get<IQueryPageRevisions>('https://wiki.garrysmod.com/api.php', {
            params: {
              action: 'query',
              prop: 'revisions',
              rvprop: 'content',
              format: 'json',
              titles: chunk.map(c => c['*']).join('|'),
            }
          })
          .then((req) => {
            const pages: IPageRevisions[] = []

            for (const k of Object.keys(req.data.query.pages)) {
              if (req.data.query.pages[k].revisions) {
                pages.push(req.data.query.pages[k])
              }
            }

            return save(dest, pages, opts.verbose)
          })
          .catch(err => errors.push({ err }))
        }, { concurrency: 4 })
      })
      .then(() => {
        if (!opts.quiet) {
          if (errors.length > 0) {
            console.log(chalk`{bgYellow {black  DONE }} {yellow Download complete in ${ms(time(start))} with ${errors.length.toString()} errors}`)
            return fs.writeJson(path.join(dest, '_meta/err_fetch.json'), errors, {spaces: '  '})
          }  else {
            console.log(chalk`{bgGreen {black  DONE }} {green Download complete in ${ms(time(start))}}`)
          }
        }
      })
      .catch(err => { console.error(err) })
  })

cli.help()
cli.parse()
