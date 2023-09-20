import { PracujScrapper } from '../bot/scrapper/pracuj.page';

const findOffers = async () => {
  console.log('Scrapping...');

  const pracuj = new PracujScrapper({
    searchValue: 'php',
    maxRecords: 10,
  });
  await pracuj.run();
};

findOffers();
