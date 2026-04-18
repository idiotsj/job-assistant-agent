"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagEditor({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string[];
  placeholder: string;
  onChange: (nextValue: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function appendTag(rawValue: string) {
    const next = rawValue.trim();

    if (!next) {
      return;
    }

    if (value.includes(next)) {
      setDraft("");
      return;
    }

    onChange([...value, next]);
    setDraft("");
  }

  return (
    <div className="field-group">
      <span className="field-label">{label}</span>

      <div className="tag-editor">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              appendTag(draft);
            }
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => appendTag(draft)}>
          <Plus size={14} />
          添加
        </Button>
      </div>

      <div className="tag-editor__list">
        {value.length === 0 ? (
          <span className="field-help">还没有添加内容，输入后按 Enter 或点击“添加”。</span>
        ) : (
          value.map((item) => (
            <button
              type="button"
              key={item}
              className="tag-editor__item"
              onClick={() => onChange(value.filter((candidate) => candidate !== item))}
            >
              <span>{item}</span>
              <X size={12} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
