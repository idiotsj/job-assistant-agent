import { type CaseListQuery } from "@/modules/cases/schema";
import { type CaseRepository } from "@/modules/cases/repository";

export interface CasesService {
  listCases(query: CaseListQuery): ReturnType<CaseRepository["list"]>;
}

export function createCasesService(repository: CaseRepository): CasesService {
  return {
    listCases(query) {
      return repository.list(query);
    },
  };
}

