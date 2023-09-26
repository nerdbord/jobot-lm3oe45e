import { createServer, Server, ServerResponse, IncomingMessage} from 'http';
import { IndeedScrapper } from './bot/scrapper/indeed.page';
import { JobOffer } from './bot/scrapper/types';
import { PracujScrapper } from './bot/scrapper/pracuj.page';

const PORT = 4200 || process.env.PORT;

const server: Server = createServer(async (request, response: ServerResponse) => {
  let limitValue = 10;
  let searchValue = '';
  let url = new URL(`http://localhost:${PORT}${request.url}`);
  
  if (request.method === 'GET' && url.pathname.startsWith('/offers/')){
    const searchParams = Object.fromEntries(url.searchParams);
    if(searchParams.hasOwnProperty('l')){
      limitValue = parseInt(searchParams.l);
    }
    searchValue = url.pathname.split('/')[2].replace(/[_\-\+]/g, ' ');
    
    let indeedOffers: JobOffer[] = [];
    let pracujOffers: JobOffer[] = [];
    let offers: JobOffer[] = [];

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
    console.log('Offers count:', offers.length);

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(offers));
  } else {
    response.statusCode = 404;
    response.end(JSON.stringify({ message: 'Path not found' }));
  }
  
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

// /offers/:search_value?limit=10