# node-crawler-mpvoice

Batch download audio files inside WeChat public articles.

Mainly used Headless Chrome, Node.js and Puppeteer.

## Install

You have to get `node.js >= 10.13.0` installed in your system before anything.

> [The official site](https://nodejs.org/en/)

```
git clone git@github.com:roshanca/node-crawler-mpvoice.git

cd node-crawler-mpvoice && npm install
```

## Usage

```
npm start [URL]
```

`URL` is the page url of WeChat public articles. For example:

```
npm start https://mp.weixin.qq.com/s/Gvqf6yqxKrAUlr0mUy9AAQ
```

You can manually specify the download directory with `-d`(default is `./dist`), also can limit the number of downloaded files with `-c`:

```
node index.js [URL] -d [DEST] -c [COUNT]
```

## Cache

To avoid unnecessary repeated downloads, every downloaded id will be put in local cache file, which is stored in `./cache/mpvoice`. If you really want to re-download resources, delete the corresponding cache file firstly. If not, download will be always skipped.

If you want to empty all the cache, simply call:

```
npm run emptyCache
```

## Troubleshooting

[can't install puppeteer?](https://github.com/roshanca/node-crawler-mpvoice/issues/1#issuecomment-624761341)

## Screenshot

### Get the url of WeChat public platform articles:

![](https://s10.mogucdn.com/mlcdn/c45406/200527_393ab18iede42l08i1d2k371b4l4h_480x1039.png)

### Downloading:

![](https://s10.mogucdn.com/mlcdn/c45406/200527_14jk3dd3aa23l0i2j71e26kd4kg2c_1557x918.jpg)
