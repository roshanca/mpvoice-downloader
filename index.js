const https = require('https');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const puppeteer = require('puppeteer');
const cache = require('persistent-cache');
const chalk = require('chalk');
const ora = require('ora');

/**
 * @typedef VoiceInfo
 * @property {string} title
 * @property {string} downloadId
 */

const isWin = process.platform === 'win32';
const compatibleDist = isWin ? '.\\dist' : './dist';

// args of command line
const args = minimist(process.argv.slice(2));
const crawlUrl = args['_'][0];
const destPath = args['d'] || compatibleDist;
const maxCount = args['c'];

// const TARGET_URL = 'https://mp.weixin.qq.com/s/Gvqf6yqxKrAUlr0mUy9AAQ';
const DOWNLOAD_URL = 'https://res.wx.qq.com/voice/getvoice?mediaid=';

const crawled = cache({ name: 'mpvoice' });
const spinner = ora();
const progress = ora();

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

  if (!downloadId) {
    spinner.text = `Can't find anything to download in ${url}`;
    spinner.fail();
    return;
  }

  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  spinner.text = `Downloading ${index + 1}.${title}`;
  spinner.info();
  progress.clear();

  // download task start
  download(DOWNLOAD_URL + downloadId, `${destPath}/${index + 1}.${title}.mp3`, (file, size) => {
    crawled.putSync(downloadId, { url, title });
    const count = index + 1;
    const kb = size / 1000
    const displaySize = kb / 1024 > 1 ? (kb / 1024).toFixed(2) + 'MB' : kb.toFixed(2) + 'KB'
    spinner.text = chalk.green(`[${count} / ${totalCount}] ${file} (${displaySize}) was downloaded.`);
    spinner.succeed();
  });

  await newPage.close();
}

/**
 * Extract voice media information on the page.
 * @returns {VoiceInfo}
 */
function extraVoiceInfo() {
  const mpvoice = document.querySelector('mpvoice');

  return {
    title: mpvoice.getAttribute('name'),
    downloadId: mpvoice.getAttribute('voice_encode_fileid'),
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
  let receivedBytes = 0;

  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      spinner.text = `Response status was ${response.statusCode}.`;
      spinner.fail();
      return;
    }

    const contentLength = parseInt(response.headers['content-length'], 10);
    progress.start();

    response
      .on('data', (chunk) => {
        file.write(chunk);
        receivedBytes += chunk.length;
        progress.text = chalk.cyan(
          `${((100 * receivedBytes) / contentLength).toFixed(2)}% ${receivedBytes} bytes${
            isWin ? '\033[0G' : '\r'
          }`
        );
      })
      .on('end', () => {
        file.end();
        progress.stop();
        callback && callback(path.basename(dest), receivedBytes);
      })
      .on('error', () => {
        progress.stop();
        fs.unlink(dest);
      });

    // file
    //   .on('finish', () => {
    //     file.close();
    //     callback && callback();
    //   })
    //   .on('error', () => {
    //     fs.unlink(dest);
    //   });
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

  let crawledKeys = crawled.keysSync();
  let crawledMap = {};

  crawledKeys.forEach((id) => {
    const { url, title } = crawled.getSync(id);
    crawledMap[url] = title;
  });

  console.log(`Start downloading mp3 to ${destPath}`)

  // bootstrap
  spinner.start();
  for (const [index, url] of anchors.entries()) {
    // skip cached item
    if (crawledMap[url]) {
      spinner.text = chalk.grey(`Skip ${crawledMap[url]}.`);
      spinner.warn();
    } else {
      await crawl(browser, url, index, anchors.length);
    }
  }

  await browser.close();
})();

/**
 * @param {Error | string} error
 */
process.on('unhandledRejection', (error) => {
  const errMsg = typeof error === 'string' ? error : error.message;
  spinner.text = chalk.red(errMsg);
  spinner.fail();
  process.exit(1); // To exit with a 'failure' code
});
