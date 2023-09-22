import { PracujScrapper } from '../bot/scrapper/pracuj.page';
import { IndeedScrapper } from '../bot/scrapper/indeed.page';

const yargs = require('yargs');

const argv = yargs
  .options({
    s: {
      alias: 'search',
      describe: 'Search keyword',
      demandOption: true,
      type: 'string',
    },
    l: {
      alias: 'limit',
      describe: 'Results limit',
      type: 'number',
      default: 10,
    },
  })
  .argv;

const findOffers = async () => {
  console.log('Scrapping...');

  const searchKeyword = argv.s;
  const limitResults = argv.l;

  const ind = new IndeedScrapper({
    searchValue: searchKeyword,
    maxRecords: limitResults,
  });
  await ind.run();
  const offers = await ind.showOffers();
  ind.writeToCsv(offers,'indeed.com');
  ind.saveDataToJson(offers, 'indeed.com');

  const pracuj = new PracujScrapper({
    searchValue: searchKeyword,
    maxRecords: limitResults,
  });
  await pracuj.run();
  const jobOffers = await pracuj.showOffers();
  pracuj.writeToCsv(jobOffers.slice(0, limitResults), 'it.pracuj.pl');
  pracuj.saveDataToJson(jobOffers.slice(0, limitResults), 'it.pracuj.pl');
};

findOffers();
