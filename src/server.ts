import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import { IndeedScrapper } from './bot/scrapper/indeed.page';
import { PracujScrapper } from './bot/scrapper/pracuj.page';
import * as redis from 'redis';
import { formatDate } from './helpers/helpers';

const PORT = 4200 || process.env.PORT;

const redisClient = redis.createClient();

(async () => {
  await redisClient.connect();
})();

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) =>
  console.log('Redis Client Connection Error', err),
);

const server: Server = createServer(
  async (request: IncomingMessage, response: ServerResponse) => {
    let limitValue = 10;
    let searchValue = '';
    const url = new URL(`http://localhost:${PORT}${request.url}`);
    if (request.method === 'GET' && url.pathname.startsWith('/offers/')) {
      const searchParams = Object.fromEntries(url.searchParams);
      if (searchParams.hasOwnProperty('l')) {
        limitValue = parseInt(searchParams.l);
      }
      searchValue = url.pathname.split('/')[2].replace(/[_\-\+]/g, ' ');

      const date = formatDate(new Date());
      const cacheKey = `offers-${searchValue}-${date}`;
      const expirationTime = 60 * 60 * 2;

      const data = await redisClient.get(cacheKey).catch((err) => {
        response.statusCode = 500;
        response.end(err.toString());
      });

      if (data != null) {
        console.log('cache hit');
        response.setHeader('Content-Type', 'application/json');
        response.end(data);
      } else {
        console.log('cache missed');
        let indeedOffers = [];
        let pracujOffers = [];
        let offers = [];

        const ind = new IndeedScrapper({
          searchValue,
          maxRecords: limitValue,
        });
        await ind.run();
        indeedOffers = await ind.showOffers();
        offers = offers.concat(indeedOffers);

        const pracuj = new PracujScrapper({
          searchValue,
          maxRecords: limitValue,
        });
        await pracuj.run();
        pracujOffers = await pracuj.showOffers();
        offers = offers.concat(pracujOffers);

        const offersJSON = JSON.stringify(offers);
        response.setHeader('Content-Type', 'application/json');
        await redisClient.setEx(cacheKey, expirationTime, offersJSON);

        response.end(offersJSON);
      }
    } else {
      response.statusCode = 404;
      response.end(JSON.stringify({ message: 'Path not found' }));
    }
  },
);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
