import type { HomeMessageTone } from "../types";

interface HomeStatusStripProps {
  message: string;
  messageTone: HomeMessageTone;
  errorMessage: string;
}

export function HomeStatusStrip({
  message,
  messageTone,
  errorMessage,
}: HomeStatusStripProps) {
  return (
    <>
      {message ? (
        <div className={`message-strip${messageTone === "success" ? " message-strip--success" : ""}`}>
          {message}
        </div>
      ) : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}
    </>
  );
}
