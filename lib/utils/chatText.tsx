const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export function renderMessageWithLinks(message: string, linkClassName: string) {
  return message.split(URL_PATTERN).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}
