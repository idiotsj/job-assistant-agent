import type { JobListQuery } from "@job-assistant/contracts/jobs";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { getSingleFilterValue } from "../utils";

export function JobsFiltersSection({
  filters,
  cityOptions,
  industryOptions,
  onKeywordChange,
  onSelectCity,
  onSelectIndustry,
  onToggleFeaturedOnly,
  onApply,
  onReset,
}: {
  filters: JobListQuery;
  cityOptions: readonly string[];
  industryOptions: readonly string[];
  onKeywordChange: (value: string) => void;
  onSelectCity: (value: string) => void;
  onSelectIndustry: (value: string) => void;
  onToggleFeaturedOnly: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const currentCity = getSingleFilterValue(filters.city);
  const currentIndustry = getSingleFilterValue(filters.industry);

  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>筛选器</h2>
          <p>岗位页继续保留城市、行业、关键词和精选态筛选；筛选草稿和已应用结果分开维护，方便后续扩展更多条件。</p>
        </div>
        <Search size={18} color="hsl(var(--primary))" />
      </div>

      <div className="catalog-filter-stack">
        <label className="field-group">
          <span className="field-label">关键词</span>
          <Input
            value={getSingleFilterValue(filters.keyword)}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索岗位、公司、行业或技能"
          />
        </label>

        <div className="field-group">
          <span className="field-label">城市</span>
          <div className="choice-row">
            {cityOptions.map((city) => {
              const value = city === "全部" ? "" : city;
              const active = currentCity === value;

              return (
                <button
                  key={city}
                  type="button"
                  className={`choice-toggle${active ? " choice-toggle--active" : ""}`}
                  onClick={() => onSelectCity(value)}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">行业</span>
          <div className="choice-row">
            {industryOptions.map((industry) => {
              const value = industry === "全部" ? "" : industry;
              const active = currentIndustry === value;

              return (
                <button
                  key={industry}
                  type="button"
                  className={`choice-toggle${active ? " choice-toggle--active" : ""}`}
                  onClick={() => onSelectIndustry(value)}
                >
                  {industry}
                </button>
              );
            })}
          </div>
        </div>

        <div className="choice-row">
          <button
            type="button"
            className={`choice-toggle${filters.featuredOnly ? " choice-toggle--active" : ""}`}
            onClick={onToggleFeaturedOnly}
          >
            仅看精选岗位
          </button>
        </div>

        <div className="catalog-actions">
          <Button onClick={onApply}>应用筛选</Button>
          <Button variant="secondary" onClick={onReset}>
            重置筛选
          </Button>
        </div>
      </div>
    </Card>
  );
}
