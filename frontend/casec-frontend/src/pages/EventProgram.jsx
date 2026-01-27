import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Loader2,
  ExternalLink,
  Play,
  Globe,
} from "lucide-react";
import { eventProgramsAPI, getAssetUrl } from "../services/api";
import SlideShow from "../components/SlideShow";

// Language configuration
const LANGUAGES = {
  zh: {
    locale: "zh-CN",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
    footer: "节目内容可能会有所调整，以实际演出为准",
    replayButton: "重播幻灯片",
    viewMore: "查看更多",
  },
  en: {
    locale: "en-US",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
    footer: "Program content is subject to change",
    replayButton: "Replay Slideshow",
    viewMore: "View More",
  },
};

export default function EventProgram() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSlideshow, setShowSlideshow] = useState(true);
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState(0);

  // Get language from query string, default to "zh"
  const langParam = searchParams.get("lang") || "zh";
  const lang = LANGUAGES[langParam] ? langParam : "zh";
  const t = LANGUAGES[lang];

  // Toggle language between Chinese and English
  const toggleLanguage = () => {
    const newLang = lang === "zh" ? "en" : "zh";
    setSearchParams({ lang: newLang });
  };

  useEffect(() => {
    loadProgram();
  }, [slug]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const response = await eventProgramsAPI.getById(slug);
      if (response.success) {
        setProgram(response.data);
        // If no slideshows, skip directly to content
        if (!response.data.slideShowIds?.length) {
          setShowSlideshow(false);
        }
      } else {
        setError(response.message || "Program not found");
      }
    } catch (err) {
      setError(err?.message || "Failed to load program");
    } finally {
      setLoading(false);
    }
  };

  // Handle slideshow completion
  const handleSlideshowComplete = () => {
    const slideShowIds = program?.slideShowIds || [];
    // If there are more slideshows, play the next one
    if (currentSlideshowIndex < slideShowIds.length - 1) {
      setCurrentSlideshowIndex((prev) => prev + 1);
    } else {
      // All slideshows complete, show program content
      setShowSlideshow(false);
    }
  };

  // Handle skip - go directly to program content
  const handleSkip = () => {
    setShowSlideshow(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center max-w-md">
          <p className="text-white mb-4">{error}</p>
          <Link
            to="/"
            className="text-yellow-400 hover:text-yellow-300 underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!program) return null;

  const slideShowIds = program.slideShowIds || [];
  const currentSlideshowId = slideShowIds[currentSlideshowIndex];

  // Show slideshow if enabled and there are slideshows
  if (showSlideshow && currentSlideshowId) {
    return (
      <SlideShow
        id={currentSlideshowId}
        onComplete={handleSlideshowComplete}
        onSkip={handleSkip}
      />
    );
  }

  // Show program content
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900">
      {/* Top action buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full text-sm hover:bg-black/70 transition-colors"
          title={lang === "zh" ? "Switch to English" : "切换到中文"}
        >
          <Globe className="w-4 h-4" />
          <span className="font-medium">{lang === "zh" ? "EN" : "中文"}</span>
        </button>

        {/* Replay slideshow button (if there were slideshows) */}
        {slideShowIds.length > 0 && (
          <button
            onClick={() => {
              setCurrentSlideshowIndex(0);
              setShowSlideshow(true);
            }}
            className="flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full text-sm hover:bg-black/70 transition-colors"
          >
            <Play className="w-4 h-4" />
            {t.replayButton}
          </button>
        )}
      </div>

      {/* Program Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          {program.subtitle && (
            <p className="text-yellow-400 text-xl mb-2 font-serif">
              "{program.subtitle}"
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
            {program.title}
          </h1>

          {/* Event Info */}
          <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
            {program.eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(program.eventDate).toLocaleDateString(t.locale, t.dateFormat)}
                </span>
              </div>
            )}
            {program.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{program.venue}</span>
              </div>
            )}
          </div>

          {program.description && (
            <p className="text-white/70 mt-4 max-w-2xl mx-auto">
              {program.description}
            </p>
          )}
        </div>

        {/* Program Sections */}
        <div className="space-y-8">
          {program.sections?.map((section, sectionIdx) => (
            <div key={section.sectionId} className="bg-white/5 rounded-xl p-6">
              {/* Section Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-yellow-400 font-serif">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-white/60 text-sm mt-1">
                    {section.subtitle}
                  </p>
                )}
              </div>

              {/* Section Items */}
              <div className="space-y-3">
                {section.items?.map((item, itemIdx) => (
                  <ProgramItemRow
                    key={item.itemId}
                    item={item}
                    itemNumber={item.itemNumber || itemIdx + 1}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/50 text-sm">
          <p>{t.footer}</p>
        </div>
      </div>
    </div>
  );
}

// Program Item Row Component
function ProgramItemRow({ item, itemNumber, lang = "zh" }) {
  const [expanded, setExpanded] = useState(false);
  const t = LANGUAGES[lang] || LANGUAGES.zh;

  const hasDetails =
    item.description ||
    item.performers?.length > 0 ||
    item.imageUrl ||
    item.contentPageId;

  return (
    <div className="border-b border-white/10 last:border-0 pb-3 last:pb-0">
      <div
        className={`flex items-start gap-4 ${
          hasDetails ? "cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1 rounded" : ""
        }`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {/* Item Number */}
        <span className="text-yellow-400/70 font-mono text-sm w-6 text-right flex-shrink-0 pt-0.5">
          {itemNumber}:
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium">{item.title}</span>
        </div>

        {/* Performance Type */}
        {item.performanceType && (
          <span className="text-white/60 text-sm flex-shrink-0 w-24 text-center">
            {item.performanceType}
          </span>
        )}

        {/* Performer Names */}
        {item.performerNames && (
          <span className="text-yellow-400/80 text-sm flex-shrink-0 w-32 text-right">
            {item.performerNames}
          </span>
        )}

        {/* Expand indicator */}
        {hasDetails && (
          <ChevronRight
            className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </div>

      {/* Expanded Details */}
      {expanded && hasDetails && (
        <div className="ml-10 mt-3 p-4 bg-white/5 rounded-lg space-y-3">
          {item.imageUrl && (
            <img
              src={getAssetUrl(item.imageUrl)}
              alt={item.title}
              className="w-full max-w-sm rounded-lg"
            />
          )}

          {item.description && (
            <p className="text-white/70 text-sm">{item.description}</p>
          )}

          {item.performers?.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {item.performers.map((performer) => {
                // Get performer name based on selected language
                const performerName = lang === "zh"
                  ? (performer.chineseName || performer.name)
                  : (performer.englishName || performer.name);

                return (
                  <div
                    key={performer.performerId}
                    className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1"
                  >
                    {performer.photoUrl && (
                      <img
                        src={getAssetUrl(performer.photoUrl)}
                        alt={performerName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-white/80 text-sm">{performerName}</span>
                    {performer.contentPageId && (
                      <Link
                        to={`/content/${performer.contentPageId}`}
                        className="text-yellow-400 hover:text-yellow-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {item.contentPageId && (
            <Link
              to={`/content/${item.contentPageId}`}
              className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {t.viewMore} <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
