import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

import { stringify } from 'csv-stringify';
import { Page, Browser } from 'puppeteer';

import { JobOffer } from './types';
import { formatDate } from '../../helpers/helpers';

export interface ScrapperOptions {
  searchValue: string;
  maxRecords: number;
}
puppeteer.use(StealthPlugin());

export class Scrapper implements ScrapperOptions {
  searchValue: string;
  maxRecords: number;
  private browser: Browser;

  constructor(options: ScrapperOptions) {
    this.searchValue = options.searchValue;
    this.maxRecords = options.maxRecords;
  }

  async initializePage() {
    this.browser = await puppeteer.launch({ headless: 'new' });
    return this.browser.newPage();
  }
  async navigateToUrl(page: Page, url: string) {
    await page.goto(url, { waitUntil: 'load' });
  }

  async searchForValue(page: Page, selector: string, value: string) {
    await page.type(selector, value);
    await page.keyboard.press('Enter');
  }

  async clickElement(page: Page, selector: string) {
    await page.click(selector);
  }

  async closePage(page: Page) {
    await page.close();
  }

  async closeBrowser() {
    await this.browser.close();
  }

  saveDataToJson(data: JobOffer[]) {
    if (!data || data.length === 0) {
      console.log('No data to save.');
      return;
    }
    const date = formatDate(new Date());
  }

  writeToCsv(data: JobOffer[]): void {
    if (!data || data.length === 0) {
      console.log('No data to save.');
      return;
    }
    const outputDir = './scrap-results';
    const outputFilename = 'offers.csv';
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
        console.log('Directory is created.');
      } else {
        console.log('Directory already exists.');
      }
    } catch (err) {
      console.log(err);
      return;
    }
    console.log(`Saving data to ${outputFilename}`);
    const writableStream = fs.createWriteStream(
      path.join(outputDir, outputFilename),
    );
    const columns = [
      'title',
      'description',
      'company',
      'salaryFrom',
      'salaryTo',
      'currency',
      'technologies',
      'addedAt',
      'offerURL',
    ];
    const stringifier = stringify({ header: true, columns });
    for (const offer of data) {
      stringifier.write(offer);
    }
    try {
      stringifier.pipe(writableStream);
      console.log('Finished writing data');
    } catch (error) {
      console.log('An error occurred while saving data to a file');
    }
  }
}
