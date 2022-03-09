import { AudioFileMeta } from './AudioFileMeta.js'

/**
 * Extract audio file meta data from current web page.
 */
export const getAudioFileMeta = (): AudioFileMeta => {
  const audioElement = document.querySelector('mpvoice')

  const title = audioElement?.getAttribute('name') || ''
  const downloadId = audioElement?.getAttribute('voice_encode_fileid') || ''

  return { title, downloadId }
}

/**
 * Extract anchor links which contains audio files from current web page.
 */
export const getLinks = (): string[] => {
  const anchors = document.querySelectorAll('a')
  const anchorArray = Array.from(anchors)

  /**
   * Filter out links that are not contains audio files.
   * @param anchorArray all anchor elements in current web page, already turned into array
   */
  const linksFilter = (anchorArray: HTMLAnchorElement[]): string[] => {
    return anchorArray
      .filter((el) => el.localName === 'a' && el.href) // element is an anchor with an href.
      .filter((el) => el.href !== location.href) // link doesn't point to page's own URL.
      .filter((el) => new URL(location.href).host === new URL(el.href).host) // reserve links from the same host as given url
      .map((a) => a.href)
  }
  const filtedLinkArray = linksFilter(anchorArray)

  return Array.from(new Set(filtedLinkArray))
}
