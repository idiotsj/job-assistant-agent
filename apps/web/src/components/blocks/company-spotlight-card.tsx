interface CompanySpotlightCardProps {
  companyName?: string;
  industry?: string;
  highlight?: string;
  logoLetter?: string;
  tags?: string[];
  className?: string;
}

const DEFAULTS = {
  companyName: "字节跳动",
  industry: "互联网 / 科技",
  highlight: "2026 春招补录中，大量算法和产品岗位开放，往届年均招聘 3000+ 人。",
  logoLetter: "字",
  tags: ["算法", "产品", "运营", "设计"],
};

export function CompanySpotlightCard({
  companyName = DEFAULTS.companyName,
  industry = DEFAULTS.industry,
  highlight = DEFAULTS.highlight,
  logoLetter = DEFAULTS.logoLetter,
  tags = DEFAULTS.tags,
  className,
}: CompanySpotlightCardProps) {
  return (
    <div className={`company-spotlight-card${className ? ` ${className}` : ""}`}>
      <div className="company-spotlight-card__header">
        <div className="company-spotlight-card__logo">{logoLetter}</div>
        <div>
          <div className="company-spotlight-card__name">{companyName}</div>
          <div className="company-spotlight-card__industry">{industry}</div>
        </div>
      </div>
      <p className="company-spotlight-card__highlight">{highlight}</p>
      <div className="company-spotlight-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="company-spotlight-card__tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
