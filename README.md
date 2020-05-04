# node-crawler-mpvoice

Download audio collections on WeChat public platform articles in batches. 

Mainly used Headless Chrome, Node.js and Puppeteer.

## Install

```
git clone git@github.com:roshanca/node-crawler-mpvoice.git

cd node-crawler-mpvoice && npm install
```

## Usage

```
npm start [URL]
```

`URL` is the page url of WeChat public platform articles. For example:

```
npm start https://mp.weixin.qq.com/s/Gvqf6yqxKrAUlr0mUy9AAQ
```

You can manually specify the download directory with `-d`(default is `./dist`), also can limit the number of downloaded files with `-c`:

```
node index.js [URL] -d [DEST] -c [COUNT]
```

## Screenshot

### Get the url of WeChat public platform articles:

### Downloading:
