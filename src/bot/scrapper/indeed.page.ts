import { JobOffer } from "./types";
import { ScrapperOptions, Scrapper } from "./scrapper";
import { Page } from "puppeteer";

export class IndeedScrapper extends Scrapper {
    
    private url: string = 'https://www.indeed.com/jobs?q=';
    private page: Page;
    private offers: JobOffer[];
    private jobUrls: string[];

    constructor(
        options: ScrapperOptions
    ){
        super(options);
        this.jobUrls = [];
        this.offers = [];
    }

    private getUrlToScrap(): string{
        return `${this.url}${this.searchValue.split(' ').join('+')}`;
    }

    async showOffers(): Promise<JobOffer[]>{
        return this.offers;
    }

    async getJobOffer(jobUrl: string): Promise<JobOffer>{
        await this.navigateToUrl(this.page, jobUrl);
        await this.page.waitForSelector('#viewJobSSRRoot');
        let offer = await this.page.$eval('#viewJobSSRRoot', function(element) {
            function formatSalaryRange(salaryText: string) {
                let currency = salaryText.includes('$') ? '$' : 'other';
                if(!salaryText || salaryText.length === 0) return [ '', '', currency ];
                if(!salaryText.includes('-')) return [ salaryText, '', currency ];
                let salaryArray = salaryText.split('-');
                let salaryFrom = salaryArray[0].trim();
                let salaryTo = salaryArray[1].trim();
        
                return [ salaryFrom, salaryTo, currency ];
            }
            const [ salaryFrom, salaryTo, currency ] = formatSalaryRange(element.querySelector('#salaryInfoAndJobType > span')?.textContent ?? '')
            return {
                title: element.querySelector('h1')?.textContent,
                description: element.querySelector('#jobDescriptionText')?.textContent.replace('\n', '').slice(0,100).concat('','...') ?? '',
                company: element.querySelector('[data-testid="inlineHeader-companyName"] > span > a')?.textContent ?? '',
                salaryFrom,
                salaryTo,
                currency,
                technologies: [],
                addedAt: ''
            }
        });
        return { ...offer, offerURL: jobUrl};
    }

    async getPageLinks(){
        const tmpUrls = await this.page.$$eval(
            'h2.jobTitle', 
            elements => elements.map(el => (el.querySelector('a')?.href))
        );
        this.jobUrls = this.jobUrls.concat(tmpUrls.filter(url => url?.length > 0));
    }

    async checkIfIsNextPage(){
        let isNextPage = false;
        await this.page.waitForSelector('[data-testid="pagination-page-next"]')
        .then(() => isNextPage = true)
        .catch(() => isNextPage = false);
        return isNextPage;
    }
    
    async getAllPagesLinks(): Promise<void>{
        await this.getPageLinks();
        let isNextPage = await this.checkIfIsNextPage();
        while ( isNextPage ) {
            isNextPage = await this.checkIfIsNextPage();
            await this.getPageLinks();
            await this.checkIfIsNextPage();
            if(isNextPage) await this.page.click('[data-testid="pagination-page-next"]');
        } 
    }

    async getDataFromAllUrls(): Promise<void>{
        if(this.jobUrls.length === 0) return;
        for(let jobUrl of this.jobUrls){
            let offer = await this.getJobOffer(jobUrl);
            this.offers.push(offer);
        }
    }
    
    async run(): Promise<void>{
        this.page = await this.initializePage();
        const urlToScrap = this.getUrlToScrap();
        await this.navigateToUrl(this.page, urlToScrap);
        await this.page.setViewport({width: 600, height: 1024});

        await this.getAllPagesLinks();
        await this.getDataFromAllUrls();
        
        await this.closePage(this.page);
        await this.closeBrowser();
    }
}

