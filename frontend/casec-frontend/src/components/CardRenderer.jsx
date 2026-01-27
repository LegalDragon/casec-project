import { getAssetUrl } from "../services/api";

// Card layouts: left, right, top, bottom, overlay, fullwidth
const LAYOUT_STYLES = {
  left: "flex flex-row",
  right: "flex flex-row-reverse",
  top: "flex flex-col",
  bottom: "flex flex-col-reverse",
  overlay: "relative",
  fullwidth: "flex flex-col",
};

export default function CardRenderer({ card, lang = "zh" }) {
  const title = lang === "zh" ? card.titleZh : card.titleEn;
  const bodyText = lang === "zh" ? card.bodyTextZh : card.bodyTextEn;
  const hasMedia = !!card.mediaUrl;
  const hasText = title || bodyText;
  const isVideo = card.mediaType === "video";

  // Overlay layout
  if (card.layoutType === "overlay") {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {hasMedia && (
          <div className="w-full aspect-video">
            {isVideo ? (
              <video
                src={getAssetUrl(card.mediaUrl)}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <img
                src={getAssetUrl(card.mediaUrl)}
                alt={title || ""}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}
        {hasText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
            {title && (
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            )}
            {bodyText && (
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                {bodyText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fullwidth layout
  if (card.layoutType === "fullwidth") {
    return (
      <div className="space-y-4">
        {hasMedia && (
          <div className="w-full rounded-xl overflow-hidden">
            {isVideo ? (
              <video
                src={getAssetUrl(card.mediaUrl)}
                className="w-full aspect-video object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <img
                src={getAssetUrl(card.mediaUrl)}
                alt={title || ""}
                className="w-full object-contain max-h-96"
              />
            )}
          </div>
        )}
        {hasText && (
          <div className="px-2">
            {title && (
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            )}
            {bodyText && (
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {bodyText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Left, right, top, bottom layouts
  const isHorizontal =
    card.layoutType === "left" || card.layoutType === "right";

  return (
    <div
      className={`${LAYOUT_STYLES[card.layoutType]} gap-4 ${
        isHorizontal ? "items-start" : ""
      }`}
    >
      {hasMedia && (
        <div
          className={`${
            isHorizontal ? "w-1/2 flex-shrink-0" : "w-full"
          } rounded-xl overflow-hidden`}
        >
          {isVideo ? (
            <video
              src={getAssetUrl(card.mediaUrl)}
              className="w-full aspect-video object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <img
              src={getAssetUrl(card.mediaUrl)}
              alt={title || ""}
              className="w-full object-cover"
            />
          )}
        </div>
      )}
      {hasText && (
        <div className={`${isHorizontal ? "flex-1" : ""}`}>
          {title && (
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          )}
          {bodyText && (
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {bodyText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
