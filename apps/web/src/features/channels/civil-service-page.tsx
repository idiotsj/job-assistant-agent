"use client";

import { AdviceChannelPage } from "@/features/channels/advice-channel-page";
import { demoCivilServiceAdvice } from "@/features/shared/demo-data";
import { getCivilServiceAdvice } from "@/lib/api/civil-service";

export function CivilServicePage() {
  return (
    <AdviceChannelPage
      title="考公频道"
      description="把考公相关建议拆成独立频道，与岗位推荐平行存在，避免把不同人生路径硬塞进同一信息流。"
      demoItems={demoCivilServiceAdvice}
      emptyCopy="如果你暂时没有开启考公意向，频道返回空结果是合理的，不需要前端强行兜造内容。"
      channelLabel="Civil Service Track"
      targetLabel="关注城市"
      helperCopy="先看清自己是否真的接受这条路径，再决定投入多少精力，而不是被情绪带着跑。"
      actionHint="频道建议会围绕城市偏好、准备节奏和机会成本来给出提醒，帮助你把考公放进更清晰的决策框架里。"
      loadLive={getCivilServiceAdvice}
      getTargets={(item) => item.targetCities}
    />
  );
}
