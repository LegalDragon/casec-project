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
  Info,
} from "lucide-react";
import { eventProgramsAPI, getAssetUrl } from "../services/api";
import SlideShow from "../components/SlideShow";
import CardModal from "../components/CardModal";

// Language configuration
const LANGUAGES = {
  zh: {
    locale: "zh-CN",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
    footer: "节目内容可能会有所调整，以实际演出为准",
    replayButton: "重播幻灯片",
    viewMore: "查看更多",
    learnMoreProgram: "了解节目",
    learnMorePerformer: "了解演员",
    aboutProgram: "节目介绍",
    aboutPerformer: "演员介绍",
  },
  en: {
    locale: "en-US",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
    footer: "Program content is subject to change",
    replayButton: "Replay Slideshow",
    viewMore: "View More",
    learnMoreProgram: "Learn more",
    learnMorePerformer: "Learn more",
    aboutProgram: "About this performance",
    aboutPerformer: "About the performer",
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

  // Cards modal state
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardModalCards, setCardModalCards] = useState([]);
  const [cardModalTitle, setCardModalTitle] = useState("");

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

  // Show cards in modal
  const showCards = (cards, title) => {
    setCardModalCards(cards);
    setCardModalTitle(title);
    setCardModalOpen(true);
  };

  // Helper to get bilingual text based on selected language
  const getText = (zhField, enField, fallback) => {
    if (lang === "zh") {
      return zhField || fallback || enField || "";
    }
    return enField || fallback || zhField || "";
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
          {getText(program.subtitleZh, program.subtitleEn, program.subtitle) && (
            <p className="text-yellow-400 text-xl mb-2 font-serif">
              "{getText(program.subtitleZh, program.subtitleEn, program.subtitle)}"
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
            {getText(program.titleZh, program.titleEn, program.title)}
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

          {getText(program.descriptionZh, program.descriptionEn, program.description) && (
            <p className="text-white/70 mt-4 max-w-2xl mx-auto">
              {getText(program.descriptionZh, program.descriptionEn, program.description)}
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
                  {getText(section.titleZh, section.titleEn, section.title)}
                </h2>
                {getText(section.subtitleZh, section.subtitleEn, section.subtitle) && (
                  <p className="text-white/60 text-sm mt-1">
                    {getText(section.subtitleZh, section.subtitleEn, section.subtitle)}
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
                    onShowCards={showCards}
                    getText={getText}
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

      {/* Cards Modal */}
      <CardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        cards={cardModalCards}
        title={cardModalTitle}
        lang={lang}
      />
    </div>
  );
}

// Program Item Row Component
function ProgramItemRow({ item, itemNumber, lang = "zh", onShowCards, getText }) {
  const t = LANGUAGES[lang] || LANGUAGES.zh;

  // Item title and fields using bilingual support
  const itemTitle = getText(item.titleZh, item.titleEn, item.title);
  const itemPerformanceType = getText(item.performanceTypeZh, item.performanceTypeEn, item.performanceType);
  const itemDescription = getText(item.descriptionZh, item.descriptionEn, item.description);

  const hasCards = item.cards?.length > 0;
  const hasDescription = itemDescription || itemPerformanceType;

  // Handle clicking on item cards (for later use)
  const handleItemCardsClick = (e) => {
    e.stopPropagation();
    if (hasCards && onShowCards) {
      onShowCards(item.cards, `${t.aboutProgram}: ${itemTitle}`);
    }
  };

  // Handle clicking on performer cards (for later use)
  const handlePerformerCardsClick = (e, performer) => {
    e.stopPropagation();
    const performerName =
      lang === "zh"
        ? performer.chineseName || performer.name
        : performer.englishName || performer.name;
    if (performer.cards?.length > 0 && onShowCards) {
      onShowCards(performer.cards, `${t.aboutPerformer}: ${performerName}`);
    }
  };

  return (
    <div className="border-b border-white/10 last:border-0 pb-3 last:pb-0">
      {/* Main Row: Number, Title, Performers */}
      <div className="flex items-start gap-4">
        {/* Item Number */}
        <span className="text-yellow-400/70 font-mono text-sm w-6 text-right flex-shrink-0 pt-0.5">
          {itemNumber}:
        </span>

        {/* Title - will be clickable for cards later */}
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium">{itemTitle}</span>
        </div>

        {/* Performer Names - each will be clickable for cards later */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {item.performerNames && (
            <span className="text-yellow-400/80 text-sm">
              {item.performerNames}
            </span>
          )}
          {item.performerNames2 && (
            <span className="text-yellow-400/80 text-sm">
              {item.performerNames2}
            </span>
          )}
        </div>
      </div>

      {/* Description Box - always visible if has content */}
      {hasDescription && (
        <div className="ml-10 mt-2 p-3 bg-white/5 rounded-lg">
          {/* Performance Type as first line */}
          {itemPerformanceType && (
            <p className="text-white/60 text-sm">
              {itemPerformanceType}
            </p>
          )}

          {/* Description */}
          {itemDescription && (
            <p className="text-white/70 text-sm mt-1">{itemDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}
