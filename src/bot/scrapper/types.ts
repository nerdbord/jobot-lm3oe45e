export interface ScrapperOptions {
  searchValue: string;
  maxRecords: number;
}

export interface JobOffer {
  title: string;
  description: string;
  company: string;
  salaryFrom: string;
  salaryTo: string;
  currency: string;
  offerURL: string;
  technologies: string[];
  addedAt: string;
}
