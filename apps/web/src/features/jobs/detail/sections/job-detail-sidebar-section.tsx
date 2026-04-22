import type { Job } from "@job-assistant/contracts/jobs";
import { Building2 } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

import type { JobDetailLinkItem } from "../types";

export function JobDetailSidebarSection({
  job,
  continueLinks,
}: {
  job: Job;
  continueLinks: JobDetailLinkItem[];
}) {
  const companyLink = continueLinks.find((item) => item.href === `/companies/${job.companyId}`) ?? null;
  const browseLinks = continueLinks.filter((item) => item !== companyLink);

  return (
    <div className="page-stack">
      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>企业信息</h2>
            <p>把岗位详情和企业详情串起来，避免用户在不同模块之间断层。</p>
          </div>
          <Building2 size={18} color="hsl(var(--primary))" />
        </div>
        <div className="tag-row">
          <span className="tag-pill">{job.companyName}</span>
          <span className="tag-pill">{job.companyIndustry}</span>
        </div>
        {companyLink ? (
          <div className="catalog-actions">
            <Link href={companyLink.href} className="wa-button wa-button--secondary wa-button--md">
              {companyLink.label}
            </Link>
          </div>
        ) : null}
      </Card>

      <Card className="feature-panel">
        <div className="section-heading">
          <div>
            <h2>继续浏览</h2>
            <p>这块保留为后续串首页、活动和日程入口的稳定区位。</p>
          </div>
        </div>
        <div className="catalog-actions">
          {browseLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`wa-button ${item.tone === "primary" ? "wa-button--primary" : "wa-button--secondary"} wa-button--md`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
