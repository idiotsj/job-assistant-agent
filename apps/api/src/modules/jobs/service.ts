import { NotFoundError } from "@/core/errors/app-error";
import { type JobListQuery } from "@/modules/jobs/schema";
import { type JobRepository } from "@/modules/jobs/repository";

export interface JobsService {
  listJobs(query: JobListQuery): ReturnType<JobRepository["list"]>;
  getJob(id: string): Promise<Awaited<ReturnType<JobRepository["getById"]>>>;
}

export function createJobsService(repository: JobRepository): JobsService {
  return {
    listJobs(query) {
      return repository.list(query);
    },

    async getJob(id) {
      const job = await repository.getById(id);
      if (!job) {
        throw new NotFoundError("Job not found", { id });
      }
      return job;
    },
  };
}

