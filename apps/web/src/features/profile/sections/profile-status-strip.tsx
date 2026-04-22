export function ProfileStatusStrip({
  loading,
  message,
  errorMessage,
}: {
  loading: boolean;
  message: string;
  errorMessage: string;
}) {
  return (
    <>
      {loading ? <div className="message-strip">正在读取当前画像...</div> : null}
      {message ? <div className="message-strip message-strip--success">{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}
    </>
  );
}
