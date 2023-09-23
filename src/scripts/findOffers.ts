import { PracujScrapper } from '../bot/scrapper/pracuj.page';
import { IndeedScrapper } from '../bot/scrapper/indeed.page';

import yargs, { Arguments } from 'yargs';

interface MyArgs extends Arguments {
  s: string;
  l: number;
}

const argv = yargs.options({
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
}).argv as MyArgs;

export const findOffers = async () => {
  console.log('Scrapping...');

  const searchKeyword = argv.s;
  const limitResults = argv.l;

  console.log(searchKeyword);

  const ind = new IndeedScrapper({
    searchValue: searchKeyword,
    maxRecords: limitResults,
  });
  await ind.run();
  const offers = await ind.showOffers();
  ind.writeToCsv(offers.slice(0, limitResults), `indeed.com-${searchKeyword}`);
  ind.saveDataToJson(
    offers.slice(0, limitResults),
    `indeed.com-${searchKeyword}`,
  );

  const pracuj = new PracujScrapper({
    searchValue: searchKeyword,
    maxRecords: limitResults,
  });
  await pracuj.run();
  const jobOffers = await pracuj.showOffers();
  pracuj.writeToCsv(
    jobOffers.slice(0, limitResults),
    `it.pracuj.pl-${searchKeyword}`,
  );
  pracuj.saveDataToJson(
    jobOffers.slice(0, limitResults),
    `it.pracuj.pl-${searchKeyword}`,
  );
};

findOffers();
