import type { ReactNode } from "react";

import { MessageCircle } from "lucide-react";

interface ConversationShellProps {
  children: ReactNode;
  historyPanel?: ReactNode;
  headerContent?: ReactNode;
  composerContent?: ReactNode;
}

function DefaultHistoryPlaceholder() {
  return (
    <div className="conversation-shell__history-placeholder">
      <MessageCircle size={32} className="conversation-shell__history-placeholder-icon" />
      <span className="conversation-shell__history-placeholder-text">暂无对话历史</span>
    </div>
  );
}

export function ConversationShell({
  children,
  historyPanel,
  headerContent,
  composerContent,
}: ConversationShellProps) {
  return (
    <div className="conversation-shell">
      <div className="conversation-shell__body">
        <aside className="conversation-shell__history">
          {historyPanel ?? <DefaultHistoryPlaceholder />}
        </aside>
        <div className="conversation-shell__main">
          <header className="conversation-shell__header">{headerContent}</header>
          <div className="conversation-shell__messages">{children}</div>
          <div className="conversation-shell__composer">{composerContent}</div>
        </div>
      </div>
    </div>
  );
}
