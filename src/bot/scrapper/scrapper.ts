import puppeteer from "puppeteer";
import {Page, Browser} from "puppeteer";

interface ScrapperOptions {
    searchValue: string;
    maxRecords: number;
}

export class Scrapper implements ScrapperOptions {
    searchValue: string;
    maxRecords: number;

    constructor(options: ScrapperOptions) {
        this.searchValue = options.searchValue;
        this.maxRecords = options.maxRecords;
    }

    async initializePage() {
        const browser = await puppeteer.launch();
        return browser.newPage();
    }
    async navigateToUrl(page: Page, url: string) {
        await page.goto(url);
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

    async closeBrowser(browser: Browser) {
        await browser.close();
    }

}
