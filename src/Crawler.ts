import { existsSync, mkdirSync } from 'fs'
import puppeteer, { Browser } from 'puppeteer'
import chalk from 'chalk'
import { AudioFileMeta } from './AudioFileMeta.js'
import { VOICE_RES_URL } from './constant.js'
import { download } from './download.js'
import { getAudioFileMeta, getLinks } from './extract.js'
import { spinner } from './utils.js'

export class Crawler {
  constructor(private baseUrl: string, private output: string, private limit: number) {
    this.baseUrl = baseUrl
    this.output = output
    this.limit = limit
  }

  public async crawl() {
    try {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.goto(this.baseUrl)

      let links = (await page.evaluate<() => string[]>(getLinks)) || []

      if (!links.length) {
        spinner.fail('This page does not contain any audio files.')
        return
      }

      // limit the number of links to crawl
      if (this.limit && this.limit < links.length) {
        links = links.slice(0, this.limit)
      }

      console.log(
        `✨ Ready to start downloading audio files to: ${chalk.greenBright(this.output)}\n`
      )

      for (const [index, link] of links.entries()) {
        await this.crawlLinkPage(browser, link, index, links.length)
      }

      await browser.close()
    } catch (error) {
      if (error instanceof Error) {
        spinner.fail(error.message)
      }
    }
  }

  /**
   * Crawl audio files to local from the given link url.
   */
  public async crawlLinkPage(browser: Browser, link: string, index: number, total: number = 0) {
    try {
      const linkPage = await browser.newPage()

      await linkPage.goto(link, { waitUntil: 'networkidle2' })

      const { title, downloadId } = await linkPage.evaluate<() => AudioFileMeta>(getAudioFileMeta)

      if (!existsSync(this.output)) {
        mkdirSync(this.output)
      }

      const isMP3 = title.endsWith('.mp3')
      const count = index + 1
      const destPath = `${this.output}/${count}.${isMP3 ? title : `${title}.mp3`}`

      spinner.info(`Downloading —— ${count}.${title}`)

      const { receivedBytes, fileName } = await download(VOICE_RES_URL + downloadId, destPath)
      const kbUnit = receivedBytes / 1000
      const mbUnit = kbUnit / 1024
      const smartFileSize = mbUnit > 1 ? `${mbUnit.toFixed(2)} MB` : `${kbUnit.toFixed(2)} KB`
      spinner.text = chalk.green(
        `[${count} / ${total}] ${fileName} (${smartFileSize}) was downloaded successfully.`
      )
      spinner.succeed()
      await linkPage.close()
    } catch (error) {
      if (error instanceof Error) {
        spinner.fail(error.message)
      }
    }
  }
}
