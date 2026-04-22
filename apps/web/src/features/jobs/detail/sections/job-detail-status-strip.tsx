export function JobDetailStatusStrip({
  message,
  errorMessage,
}: {
  message: string;
  errorMessage: string;
}) {
  return (
    <>
      {message ? <div className="message-strip message-strip--success">{message}</div> : null}
      {errorMessage ? <div className="message-strip message-strip--error">{errorMessage}</div> : null}
    </>
  );
}
