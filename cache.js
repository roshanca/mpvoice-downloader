const cache = require('persistent-cache');

const crawled = cache({ name: 'mpvoice' });
crawled.unlink();
