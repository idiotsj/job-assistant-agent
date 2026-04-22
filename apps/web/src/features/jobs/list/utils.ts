import type { Job, JobListQuery } from "@job-assistant/contracts/jobs";

import { buildDemoPaginatedResponse, includesText } from "@/features/catalog/catalog-helpers";
import { demoJobs } from "@/features/shared/demo-data";

import type { JobsPageResponse, JobsSourceMode, JobsSummaryCard, JobsViewState } from "./types";

export const jobsCityOptions = ["全部", "上海", "杭州", "深圳", "北京", "广州"] as const;
export const jobsIndustryOptions = [
  "全部",
  "AI 产品",
  "企业服务",
  "互联网平台",
  "教育科技",
  "新消费",
  "数据智能",
] as const;

export const defaultJobFilters: JobListQuery = {
  page: 1,
  limit: 6,
  city: "",
  industry: "",
  keyword: "",
  featuredOnly: false,
};

export function getSingleFilterValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getJobCity(job: Job) {
  return job.workLocation.split(/[·\-]/)[0] ?? job.workLocation;
}

export function getDemoJobsResponse(filters: JobListQuery): JobsPageResponse {
  const city = getSingleFilterValue(filters.city);
  const industry = getSingleFilterValue(filters.industry);
  const keyword = getSingleFilterValue(filters.keyword);
  const filtered = demoJobs.filter((job) => {
    if (city && getJobCity(job) !== city) {
      return false;
    }

    if (industry && job.companyIndustry !== industry) {
      return false;
    }

    if (filters.featuredOnly && !job.isFeatured) {
      return false;
    }

    return (
      includesText(job.title, keyword) ||
      includesText(job.companyName, keyword) ||
      includesText(job.companyIndustry, keyword) ||
      includesText(job.description, keyword) ||
      job.tags.some((tag) => includesText(tag, keyword)) ||
      job.requiredSkills.some((skill) => includesText(skill, keyword))
    );
  });

  return buildDemoPaginatedResponse(filtered, filters.page, filters.limit);
}

export function createJobInsight(job: Job) {
  if (job.requiredSkills.length > 0) {
    return `优先围绕 ${job.requiredSkills.slice(0, 2).join(" / ")} 组织你的简历亮点，会更贴近这条岗位。`;
  }

  return "建议先把岗位关键词、项目结果和目标岗位标题统一起来，再进入详细分析。";
}

export function getCompanyInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("")
    .toUpperCase();
}

export function buildJobsSummaryCards(response: JobsPageResponse, appliedFilters: JobListQuery): JobsSummaryCard[] {
  const featuredCount = response.data.filter((job) => job.isFeatured).length;
  const averagePopularity =
    response.data.length > 0
      ? Math.round(response.data.reduce((total, job) => total + job.popularity, 0) / response.data.length)
      : 0;

  return [
    {
      label: "当前结果",
      value: response.pagination.total,
      description: "符合当前筛选条件的岗位总量。",
    },
    {
      label: "精选岗位",
      value: featuredCount,
      description: "适合作为首页稳定曝光位或重点投递列表的岗位数量。",
    },
    {
      label: "平均热度",
      value: averagePopularity,
      description: "基于本页岗位 popularity 的粗略均值，帮助用户快速判断窗口活跃度。",
    },
    {
      label: "当前城市",
      value: getSingleFilterValue(appliedFilters.city) || "全部",
      description: "当前筛选仍保持与后端 query 语义一致，后续可平滑扩展为多选。",
    },
  ];
}

export function getJobsViewState({
  response,
  mode,
  loading,
  errorMessage,
}: {
  response: JobsPageResponse;
  mode: JobsSourceMode;
  loading: boolean;
  errorMessage: string;
}): JobsViewState {
  if (loading) {
    return "loading";
  }

  if (errorMessage && response.data.length === 0) {
    return "error";
  }

  if (response.data.length === 0) {
    return mode === "live" ? "empty-live" : "empty-demo";
  }

  return mode === "live" ? "ready-live" : "ready-demo";
}
