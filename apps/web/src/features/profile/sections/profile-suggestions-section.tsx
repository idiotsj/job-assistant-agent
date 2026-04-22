import { Card } from "@/components/ui/card";

import type { ProfileSuggestionGroup } from "../types";

export function ProfileSuggestionsSection({
  groups,
  onAppendTag,
}: {
  groups: ProfileSuggestionGroup[];
  onAppendTag: (field: ProfileSuggestionGroup["field"], value: string) => void;
}) {
  return (
    <Card className="feature-panel">
      <div className="section-heading">
        <div>
          <h2>建议先补哪些内容</h2>
          <p>把最影响推荐和频道判断的字段优先补齐。</p>
        </div>
      </div>

      <div className="page-stack">
        {groups.map((group) => (
          <div className="page-stack" key={group.label}>
            <strong>{group.label}</strong>
            <div className="tag-wall">
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="suggestion-chip"
                  onClick={() => onAppendTag(group.field, item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
