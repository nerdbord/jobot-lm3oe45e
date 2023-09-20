import { PracujScrapper } from '../bot/scrapper/pracuj.page';
import { IndeedScrapper } from '../bot/scrapper/indeed.page';

const findOffers = async () => {
  console.log('Scrapping...');

  // const ind = new IndeedScrapper({
  //     searchValue: 'pascal',
  //     maxRecords: 10
  // });
  // await ind.run();
  // const offers = await ind.showOffers();
  // ind.writeToCsv(offers);

  const pracuj = new PracujScrapper({
    searchValue: 'php',
    maxRecords: 10,
  });
  await pracuj.run();
};

findOffers();
