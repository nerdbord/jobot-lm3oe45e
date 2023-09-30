import { JobOffer } from './types';
import { ScrapperOptions, Scrapper } from './scrapper';
import { Page } from 'puppeteer';

export class IndeedScrapper extends Scrapper {
  private url: string = 'https://www.indeed.com/jobs?q=';
  private page: Page;
  private offers: JobOffer[];
  private jobUrls: string[];

  constructor(options: ScrapperOptions) {
    super(options);
    this.jobUrls = [];
    this.offers = [];
  }

  private getUrlToScrap(): string {
    return `${this.url}${this.searchValue.split(' ').join('+')}`;
  }

  async showOffers(): Promise<JobOffer[]> {
    return this.offers;
  }

  async getJobOffer(jobUrl: string, counter: number): Promise<JobOffer | {}> {
    // process.stdout.clearLine(0);
    process.stdout.write(
      `\r[ ${counter}/${this.jobUrls.length} ] Fetching data from URL: ${jobUrl}`,
    );
    let offer: JobOffer | {} = {};
    try {
      await this.navigateToUrl(this.page, jobUrl);
      await this.page.waitForSelector('#viewJobSSRRoot');
      offer = await this.page.$eval(
        '#viewJobSSRRoot',
        function (element, jobUrl) {
          function formatSalaryRange(salaryText: string) {
            const currency = salaryText.includes('$') ? '$' : 'other';
            if (!salaryText || salaryText.length === 0)
              return ['', '', currency];
            if (!salaryText.includes('-')) return [salaryText, '', currency];
            const salaryArray = salaryText.split('-');
            const salaryFrom = salaryArray[0].trim();
            const salaryTo = salaryArray[1].trim();

            return [salaryFrom, salaryTo, currency];
          }
          const [salaryFrom, salaryTo, currency] = formatSalaryRange(
            element.querySelector('#salaryInfoAndJobType > span')
              ?.textContent ?? '',
          );
          return {
            title: element.querySelector('h1')?.textContent,
            description:
              element
                ?.querySelector('#jobDescriptionText')
                ?.textContent?.replace('\n', '')
                ?.slice(0, 100)
                ?.concat('', '...') ?? '',
            company:
              element.querySelector(
                '[data-testid="inlineHeader-companyName"] > span > a',
              )?.textContent ?? '',
            salaryFrom,
            salaryTo,
            currency,
            technologies: [],
            addedAt: '',
            offerURL: jobUrl,
          };
        },
        jobUrl,
      );
    } catch (err) {
      console.error(' | Something went wrong:', JSON.stringify(err));
      return {};
    }
    // console.log('Success');
    return offer;
  }

  async getPageLinks() {
    let tmpUrls: string[] = [];
    tmpUrls = await this.page.$$eval('h2.jobTitle', (elements) =>
      elements.map((el) => el?.querySelector('a')?.href ?? ''),
    );
    this.jobUrls = this.jobUrls.concat(
      tmpUrls?.filter((url) => url?.length > 0),
    );
    process.stdout.write(
      `\rSearching... Found [ ${this.jobUrls.length} ] urls.`,
    );
  }

  async checkIfIsNextPage() {
    let isNextPage = false;
    await this.page
      .waitForSelector('[data-testid="pagination-page-next"]')
      .then(() => (isNextPage = true))
      .catch(() => (isNextPage = false));
    return isNextPage;
  }

  async getAllPagesLinks(): Promise<void> {
    await this.getPageLinks();
    let isNextPage = await this.checkIfIsNextPage();
    while (isNextPage && this.jobUrls.length < this.maxRecords) {
      isNextPage = await this.checkIfIsNextPage();
      await this.getPageLinks();
      await this.checkIfIsNextPage();
      if (isNextPage)
        await this.page.click('[data-testid="pagination-page-next"]');
    }
  }

  async getDataFromAllUrls(): Promise<void> {
    if (this.jobUrls.length === 0) return;
    process.stdout.write('\n');
    let i = 1;
    for (const jobUrl of this.jobUrls) {
      const offer = await this.getJobOffer(jobUrl, i);
      i += 1;
      if ('title' in offer) {
        this.offers.push(offer);
      }
    }
  }

  async run(): Promise<void> {
    this.page = await this.initializePage();
    console.log('Page initialized');
    const urlToScrap = this.getUrlToScrap();
    await this.navigateToUrl(this.page, urlToScrap);
    console.log('On first page');
    await this.page.setViewport({ width: 600, height: 1024 });

    await this.getAllPagesLinks();
    this.jobUrls = this.jobUrls.slice(0, this.maxRecords);
    console.log('acquired all the URLs for scrapping')
    await this.getDataFromAllUrls();
    console.log('Scrapping completed');

    // await this.closePage(this.page);
    await this.closeBrowser();
  }
}
