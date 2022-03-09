import https from 'https'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { spinner, stopSpinner } from './utils.js'

// system os has an impact on the character display
const isWin = process.platform === 'win32'

export const download = (
  url: string,
  dest: string
): Promise<{ receivedBytes: number; fileName: string }> => {
  const downloadFile = fs.createWriteStream(dest)
  let receivedBytes = 0

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Response status was ${response.statusCode}.`))
      }

      const contentLength = parseInt(response.headers['content-length'] || '', 10)
      spinner.start()

      response.on('data', (chunk) => {
        downloadFile.write(chunk)
        receivedBytes += chunk.length

        // progress bar
        spinner.text = chalk.cyan(
          `${((100 * receivedBytes) / contentLength).toFixed(2)}% ${receivedBytes} bytes${
            isWin ? '\\033[0G' : '\r'
          }`
        )
      })

      response.on('end', () => {
        stopSpinner()
        resolve({
          receivedBytes,
          fileName: path.basename(dest)
        })
      })

      response.on('error', () => {
        stopSpinner()
        fs.unlink(dest, (err) => {
          err && console.error(err)
        })
        reject(new Error('Error downloading file due to network.'))
      })
    })
  })
}
