const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import {Page, Browser} from "puppeteer";
const { stringify } = require("csv-stringify");
import { JobOffer } from "./types";
const fs = require('fs');
const path = require('path');

export interface ScrapperOptions {
    searchValue: string;
    maxRecords: number;
}
puppeteer.use(StealthPlugin());

export class Scrapper implements ScrapperOptions {
    searchValue: string;
    maxRecords: number;
    private browser: Browser

    constructor(options: ScrapperOptions) {
        this.searchValue = options.searchValue;
        this.maxRecords = options.maxRecords;
    }

    async initializePage() {
        this.browser = await puppeteer.launch({headless: 'new'});
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

    async scrapeData(page: Page, selector: string) {
        const data = await page.$$eval(selector, elements => {
            // Przetwarzanie elementów i ekstrakcja danych
            return elements.map(element => element.textContent);
        });
        return data;
    }

    async closePage(page: Page) {
        await page.close();
    }

    async closeBrowser() {
        await this.browser.close();
    }

    writeToCsv(data: JobOffer[]):void {
        if(!data || data.length === 0) {
            console.log('No data to save.');
            return;
        };
        let outputDir = './scrap-results';
        let outputFilename = 'offers.csv';
        try {
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir)
              console.log('Directory is created.')
            } else {
              console.log('Directory already exists.')
            }

        } catch (err) {
            console.log(err);
            return;
        }
        console.log(`Saving data to ${outputFilename}`);
        const writableStream = fs.createWriteStream(path.join(outputDir, outputFilename));
        const columns = [
            'title',
            'description',
            'company',
            'salaryFrom',
            'salaryTo',
            'currency',
            'technologies',
            'addedAt',
            'offerURL'
        ];
        const stringifier = stringify({ header: true, columns });
        for(let offer of data){
            stringifier.write(offer);
        }
        try{
            stringifier.pipe(writableStream);
            console.log("Finished writing data");
        } catch (error){
            console.log('An error occurred while saving data to a file');
        }
    }
}
