#!/usr/bin/env node

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { program } from 'commander'
import { readPackageUpSync } from 'read-pkg-up'
import { Crawler } from './Crawler.js'
import { OUTPUT_PATH } from './constant.js'
import { spinner } from './utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifest = readPackageUpSync({ cwd: __dirname })

/**
 * Set global CLI configurations
 */
program.storeOptionsAsProperties(false)

program
  .version(
    manifest ? manifest.packageJson.version : 'unknown',
    '-v, --version',
    'output the current version'
  )
  .argument('<url>', 'url to the page to be crawled')
  .option('-o, --output <path>', 'output path', OUTPUT_PATH)
  .option('-l, --limit <count>', 'limit of files per download')
  .parse(process.argv)

const options = program.opts()
const crawler = new Crawler(program.args[0], options.output, options.limit)
crawler.crawl()

process.on('unhandledRejection', (error: Error | undefined) => {
  const errMsg = typeof error === 'string' ? error : error?.message
  spinner.fail(errMsg)
  process.exit(1) // To exit with a 'failure' code
})
