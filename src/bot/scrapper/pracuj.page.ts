import { Page } from 'puppeteer';
import { JobOffer, ScrapperOptions } from './types';
import { Scrapper } from './scrapper';

export class PracujScrapper extends Scrapper {
  private url: string = 'https://it.pracuj.pl/';
  private page: Page;
  readonly jobOffers: JobOffer[];

  constructor(options: ScrapperOptions) {
    super(options);
    this.jobOffers = [];
    this.maxRecords = options.maxRecords || 10;
  }

  async showOffers(): Promise<JobOffer[]> {
    return this.jobOffers;
  }

  async scrapeJobOffers(page: Page) {
    await page.waitForSelector('[data-test="text-added"]');

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 3000)),
    );

    try {
      const data = await page.$$eval(
        '[data-test="default-offer"], [data-test="positioned-offer"]',
        (elements) => {
          return elements.map((element) => {
            const titleElement = element.querySelector(
              '[data-test="offer-title"]',
            );
            const title = titleElement
              ? titleElement.textContent
              : 'Brak tytułu';

            const descriptionElement = element.querySelector(
              '[data-test="offer-additional-info-0"]',
            );

            const description = descriptionElement
              ? `${descriptionElement.textContent}`
              : '';

            const companyElement = element.querySelector(
              '[data-test="text-company-name"]',
            );
            const company = companyElement ? companyElement.textContent : '';

            const salaryElement = element.querySelector(
              '[data-test="offer-salary"]',
            );
            let salaryFrom = '';
            let salaryTo = '';
            let currency = '';

            if (salaryElement) {
              const salaryText = salaryElement.textContent;
              const matches = salaryText.match(
                /(\d+(?:\s?\d+)*)\s*–\s*(\d+(?:\s?\d+)*)\s*(\S+)/,
              );

              if (matches) {
                salaryFrom = matches[1].replace(/\s/g, '');
                salaryTo = matches[2].replace(/\s/g, '');
                currency = matches[3];
              }
            }

            const offerLinkElement = element.querySelector(
              '[data-test="link-offer"]',
            );

            const offerURL = offerLinkElement
              ? offerLinkElement.getAttribute('href')
              : '';

            const addedAtElement = element.querySelector(
              '[data-test="text-added"]',
            );

            const addedAt = addedAtElement
              ? addedAtElement.textContent.replace('Opublikowana: ', '')
              : '';

            const technologiesElement = element.querySelectorAll(
              '[data-test="technologies-tag"]',
            );

            const technologies = technologiesElement
              ? Array.from(technologiesElement).map((el) => el.textContent)
              : [''];

            return {
              title,
              description,
              company,
              salaryFrom,
              salaryTo,
              currency,
              technologies,
              offerURL,
              addedAt,
            };
          });
        },
      );
      const limitedData = data.slice(0, this.maxRecords);

      this.jobOffers.push(...limitedData);
    } catch (error) {
      console.error(' | Something went wrong:', JSON.stringify(error));
    }
  }

  async checkIfIsNextPage() {
    let isNextPage = false;
    try {
      await this.page
        .waitForSelector('[data-test="bottom-pagination-button-next"]', {
          timeout: 5000,
        })
        .then(() => (isNextPage = true))
        .catch(() => (isNextPage = false));
      return isNextPage;
    } catch (error) {
      console.error('Something went wrong', error);
    }
  }

  async scrapeNextPage(page: Page) {
    if (this.jobOffers.length >= this.maxRecords) {
      return;
    }
    let isNextPage = await this.checkIfIsNextPage();
    try {
      while (isNextPage) {
        isNextPage = await this.checkIfIsNextPage();

        if (isNextPage) {
          console.log('scraping next page');
          await this.scrapeJobOffers(page);
          if (this.jobOffers.length >= this.maxRecords) {
            break;
          }
          await this.clickElement(
            page,
            '[data-test="bottom-pagination-button-next"]',
          );
        }
      }
    } catch (error) {
      console.error(' | Something went wrong:', JSON.stringify(error));
    }
  }

  async run() {
    this.page = await this.initializePage();

    try {
      await this.navigateToUrl(this.page, this.url);
      await this.clickElement(
        this.page,
        'button.size-medium.variant-primary.cookies_b1fqykql',
      );
      await this.searchForValue(
        this.page,
        '[data-test="input-field"]',
        `${this.searchValue}`,
      );
      await this.clickElement(
        this.page,
        'button.size-large.variant-primary.core_b1fqykql',
      );

      await this.page.waitForSelector('#relative-wrapper');
      await this.scrapeJobOffers(this.page);
      await this.scrapeNextPage(this.page);
    } catch (error) {
      console.error(' | Something went wrong:', JSON.stringify(error));
    } finally {
      await this.closePage(this.page);
    }
  }
}
