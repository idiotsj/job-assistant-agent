import { NotFoundError } from "@/core/errors/app-error";
import { type CompanyRepository } from "@/modules/companies/repository";
import { type CompanyListQuery } from "@/modules/companies/schema";

export interface CompaniesService {
  listCompanies(query: CompanyListQuery): ReturnType<CompanyRepository["list"]>;
  getCompany(id: string): Promise<Awaited<ReturnType<CompanyRepository["getById"]>>>;
  getFeaturedCompany(): Promise<Awaited<ReturnType<CompanyRepository["listFeatured"]>>[number] | null>;
}

export function createCompaniesService(repository: CompanyRepository): CompaniesService {
  return {
    listCompanies(query) {
      return repository.list(query);
    },

    async getCompany(id) {
      const company = await repository.getById(id);
      if (!company) {
        throw new NotFoundError("Company not found", { id });
      }
      return company;
    },

    async getFeaturedCompany() {
      const companies = await repository.listFeatured(1);
      return companies[0] ?? null;
    },
  };
}
