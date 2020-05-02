const https = require('https');
const fs = require('fs');
const minimist = require('minimist');
const puppeteer = require('puppeteer');
const cache = require('persistent-cache');
const ora = require('ora');

/**
 * @typedef VoiceInfo
 * @property {string} title
 * @property {string} downloadId
 */

// args of command line
const args = minimist(process.argv.slice(2));
const crawlUrl = args['_'][0];
const destPath = args['d'] || './dist';
const maxCount = args['c'];

// const TARGET_URL = 'https://mp.weixin.qq.com/s/Gvqf6yqxKrAUlr0mUy9AAQ';
const DOWNLOAD_URL = 'https://res.wx.qq.com/voice/getvoice?mediaid=';

const crawled = cache();
const spinner = ora();

/**
 * Finds all anchors on the page.
 * @param {boolean} sameHost reserve links from the same host as given url
 */
function collectAllAnchors(sameHost = true) {
  /** @type {NodeListOf<HTMLAnchorElement>} */
  const allAnchorNodes = document.querySelectorAll('a');
  const allAnchors = Array.from(allAnchorNodes);

  let filtered = allAnchors
    .filter((el) => el.localName === 'a' && el.href) // element is an anchor with an href.
    .filter((el) => el.href !== location.href) // link doesn't point to page's own URL.
    .filter((el) => {
      if (sameHost) {
        return new URL(location).host === new URL(el.href).host;
      }

      return true;
    })
    .map((a) => a.href);

  // uniq
  return Array.from(new Set(filtered));
}

/**
 * Crawl the voice clip file by visiting an url.
 * @param {Browser} browser
 * @param {string} url
 * @param {number} index
 * @param {number} totalCount
 */
async function crawl(browser, url, index, totalCount) {
  const newPage = await browser.newPage();

  await newPage.goto(url, { waitUntil: 'networkidle2' });

  /** @type {VoiceInfo} */
  const { title, downloadId } = await newPage.evaluate(extraVoiceInfo);

  // skip cached item
  const cached = crawled.getSync(downloadId);
  if (cached) {
    spinner.text = `Skip ${cached}.`;
    spinner.warn();
    return;
  }

  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  console.log(`Downloading ${title} to ${destPath}`);
  download(DOWNLOAD_URL + downloadId, `${destPath}/${title}.mp3`, () => {
    crawled.putSync(downloadId, title);
    const count = index + 1;
    spinner.text = `[${count} / ${totalCount}]`;
    spinner.succeed();
  });

  await newPage.close();
}

/**
 * Extract voice media information on the page.
 * @returns {VoiceInfo}
 */
function extraVoiceInfo() {
  const titleElem = document.querySelector('#activity-name');
  const voiceElem = document.querySelector('[aria-labelledby]');

  const title = titleElem ? titleElem.textContent.trim() : '';
  const { id } = voiceElem;
  let downloadId = null;

  if (id) {
    const matched = id.match(/^voice_main_(\S+.)_0$/);

    if (matched) {
      downloadId = matched[1];
    }
  }

  return {
    title,
    downloadId,
  };
}

/**
 * Download a file to the local system.
 * @param {string} url
 * @param {string} dest
 * @param {Function} callback
 */
function download(url, dest, callback) {
  const file = fs.createWriteStream(dest);

  https.get(url, (response) => {
    response.pipe(file);

    file
      .on('finish', () => {
        file.close();
        callback && callback();
      })
      .on('error', () => {
        fs.unlink(dest);
      });
  });
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  if (!crawlUrl) {
    throw 'Please pass a url to this program, using `node index.js [URL]`.';
  }

  await page.goto(crawlUrl);

  let anchors = await page.evaluate(collectAllAnchors);
  if (maxCount && maxCount < anchors.length) {
    anchors = anchors.slice(0, maxCount);
  }

  // bootstrap
  spinner.start();
  for (const [index, url] of anchors.entries()) {
    await crawl(browser, url, index, anchors.length);
  }

  await browser.close();
})();

/**
 * @param {Error | string} error
 */
process.on('unhandledRejection', (error) => {
  spinner.text = typeof error === 'string' ? error : error.message;
  spinner.fail();
  process.exit(1); // To exit with a 'failure' code
});
