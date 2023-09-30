import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

import { stringify } from 'csv-stringify';
import { Page, Browser } from 'puppeteer';

import { JobOffer } from './types';
import { formatDate } from '../../helpers/helpers';

require("dotenv").config();

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
    this.browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        // "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    return this.browser.newPage();
  }
  
  async navigateToUrl(page: Page, url: string) {
    await page.goto(url, { 
      waitUntil: 'load',
      timeout: 60000
    });
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

  saveDataToJson(data: JobOffer[], service: string) {
    if (!data || data.length === 0) {
      console.log('No data to save.');
      return;
    }
    const date = formatDate(new Date());
    const outputDir = './scrap-results';
    const outputFilename = `${outputDir}/${service}-${date}-offers.json`;

    try {
      if (!fs.existsSync(`${outputDir}`)) {
        fs.mkdirSync(`${outputDir}`, { recursive: true });
        console.log(`Directory for data is created.`);
      } else {
        console.log(`Directory for data already exists.`);
      }

      fs.writeFileSync(outputFilename, JSON.stringify(data), 'utf8');
      console.log(`Data saved to ${outputFilename}`);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  writeToCsv(data: JobOffer[], serviceName: string): void {
    if (!data || data.length === 0) {
      console.log('No data to save.');
      return;
    }
    const outputDir = './scrap-results';
    const outputFilename = `${serviceName.replace(/[^a-zA-Z0-9]/g, "_")}-offers.csv`;
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
