"use client";

import { AdviceChannelPage } from "@/features/channels/advice-channel-page";
import { demoPostgraduateAdvice } from "@/features/shared/demo-data";
import { getPostgraduateAdvice } from "@/lib/api/postgraduate";

export function PostgraduatePage() {
  return (
    <AdviceChannelPage
      title="考研频道"
      description="把升学建议保持为独立频道，和求职主线并行呈现，但不混成同一套推荐流。"
      demoItems={demoPostgraduateAdvice}
      emptyCopy="可以先补充画像里的专业方向和升学意向，后端会据此返回更贴近的建议。"
      channelLabel="Postgraduate Track"
      targetLabel="适配专业"
      helperCopy="用更低焦虑的方式判断：你是适合继续冲就业，还是值得认真评估升学。"
      actionHint="页面里的建议更像一位稳健的陪跑顾问，帮助你先厘清方向、节奏和机会成本，而不是替你做唯一结论。"
      loadLive={getPostgraduateAdvice}
      getTargets={(item) => item.targetMajors}
    />
  );
}
