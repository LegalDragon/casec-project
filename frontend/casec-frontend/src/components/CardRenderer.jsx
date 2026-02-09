import { useRef, useEffect } from "react";
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

// Aspect ratio CSS classes
const ASPECT_RATIO_CLASSES = {
  original: "", // No fixed aspect ratio - use natural dimensions
  // Landscape ratios
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "3:2": "aspect-[3/2]",
  // Square
  "1:1": "aspect-square",
  // Portrait ratios
  "2:3": "aspect-[2/3]",
  "3:4": "aspect-[3/4]",
  "9:16": "aspect-[9/16]",
};

export default function CardRenderer({ card, lang = "zh" }) {
  const videoRef = useRef(null);
  
  // Cleanup video on unmount to prevent blank page issues
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, []);

  const title = lang === "zh" ? card.titleZh : card.titleEn;
  const bodyText = lang === "zh" ? card.bodyTextZh : card.bodyTextEn;
  const hasMedia = !!card.mediaUrl;
  const hasText = title || bodyText;
  const isVideo = card.mediaType === "video";
  const aspectRatio = card.aspectRatio || "original";
  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || "";

  // Overlay layout
  if (card.layoutType === "overlay") {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {hasMedia && (
          <div className={`w-full ${aspectClass || "aspect-video"}`}>
            {isVideo ? (
              <video
                ref={videoRef}
                src={getAssetUrl(card.mediaUrl)}
                className="w-full h-full object-cover"
                autoPlay
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
              <div
                className="text-white/90 text-sm leading-relaxed prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyText }}
              />
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
          <div className={`w-full rounded-xl overflow-hidden ${aspectClass}`}>
            {isVideo ? (
              <video
                ref={videoRef}
                src={getAssetUrl(card.mediaUrl)}
                className={`w-full ${aspectClass ? "h-full object-cover" : ""}`}
                autoPlay
                loop
                playsInline
                controls
              />
            ) : (
              <img
                src={getAssetUrl(card.mediaUrl)}
                alt={title || ""}
                className={`w-full ${aspectClass ? "h-full object-cover" : "object-contain"}`}
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
              <div
                className="text-white/80 text-sm leading-relaxed prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyText }}
              />
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
          } rounded-xl overflow-hidden ${aspectClass}`}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={getAssetUrl(card.mediaUrl)}
              className={`w-full ${aspectClass ? "h-full object-cover" : ""}`}
              autoPlay
              loop
              playsInline
              controls
            />
          ) : (
            <img
              src={getAssetUrl(card.mediaUrl)}
              alt={title || ""}
              className={`w-full ${aspectClass ? "h-full object-cover" : ""}`}
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
            <div
              className="text-white/80 text-sm leading-relaxed prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: bodyText }}
            />
          )}
        </div>
      )}
    </div>
  );
}
