# node-crawler-mpvoice

批量下载微信公众平台文章上的音频合集。

## Install

```
git clone git@github.com:roshanca/node-crawler-mpvoice.git

cd node-crawler-mpvoice && npm install
```

## Usage

```
npm start [URL]
```

`URL` 为微信公众平台文章的地址。For example:

```
npm start https://mp.weixin.qq.com/s/Gvqf6yqxKrAUlr0mUy9AAQ
```

也可以指定下载目录（默认为 `dist`），指定下载个数限制（默认全部下载）。

```
node index.js [URL] -d [DEST] -c [COUNT]
```
