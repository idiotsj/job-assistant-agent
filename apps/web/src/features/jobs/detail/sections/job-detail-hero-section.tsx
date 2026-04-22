import type { Job } from "@job-assistant/contracts/jobs";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { formatJobDate } from "../utils";

export function JobDetailHeroSection({ job }: { job: Job }) {
  return (
    <Card className="wa-card--hero" padded={false}>
      <div className="detail-hero">
        <div className="detail-hero__body">
          <Badge tone={job.isFeatured ? "info" : "neutral"}>{job.isFeatured ? "精选岗位" : job.companyName}</Badge>
          <h2>{job.title}</h2>
          <p>{job.description}</p>
          <div className="tag-row">
            <span className="tag-pill">{job.workLocation}</span>
            {job.tags.map((tag) => (
              <span className="tag-pill" key={`${job.id}-${tag}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="detail-hero__aside">
          <div className="channel-metric">
            <span>岗位热度</span>
            <strong>{job.popularity}</strong>
          </div>
          <div className="channel-metric">
            <span>截止时间</span>
            <strong>{job.deadline ? formatJobDate(job.deadline) : "长期"}</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}
