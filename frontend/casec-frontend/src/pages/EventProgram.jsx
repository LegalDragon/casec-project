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

  // Color theme state
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);

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

  // Update document title and Open Graph meta tags for social sharing
  useEffect(() => {
    if (!program) return;

    const title = lang === "zh"
      ? (program.titleZh || program.title)
      : (program.titleEn || program.title);
    const description = lang === "zh"
      ? (program.descriptionZh || program.description || program.subtitleZh || program.subtitle)
      : (program.descriptionEn || program.description || program.subtitleEn || program.subtitle);
    const imageUrl = program.imageUrl ? getAssetUrl(program.imageUrl) : null;

    // Update document title
    document.title = title || "Event Program";

    // Helper to update or create meta tag
    const updateMetaTag = (property, content) => {
      if (!content) return;
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Helper to update or create name-based meta tag
    const updateNameMetaTag = (name, content) => {
      if (!content) return;
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Open Graph tags for Facebook, LinkedIn, etc.
    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:type", "article");
    updateMetaTag("og:url", window.location.href);
    if (imageUrl) {
      updateMetaTag("og:image", imageUrl);
    }

    // Twitter Card tags
    updateNameMetaTag("twitter:card", "summary_large_image");
    updateNameMetaTag("twitter:title", title);
    updateNameMetaTag("twitter:description", description);
    if (imageUrl) {
      updateNameMetaTag("twitter:image", imageUrl);
    }

    // Standard meta description
    updateNameMetaTag("description", description);

    // Cleanup on unmount
    return () => {
      document.title = "Community Membership Portal";
    };
  }, [program, lang]);

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
  // Returns trimmed text, or empty string if all values are empty/whitespace
  const getText = (zhField, enField, fallback) => {
    const zh = zhField?.trim?.() || zhField || "";
    const en = enField?.trim?.() || enField || "";
    const fb = fallback?.trim?.() || fallback || "";
    if (lang === "zh") {
      return zh || fb || en;
    }
    return en || fb || zh;
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

  // Color theme logic
  const colorThemes = program.colorThemes || [];
  const defaultTheme = {
    name: "Default",
    primary: "#facc15",
    link: "#60a5fa",
    bgFrom: "#7f1d1d",
    bgVia: "#991b1b",
    bgTo: "#78350f"
  };
  const rawTheme = colorThemes.length > 0
    ? (colorThemes[selectedThemeIndex] || colorThemes[0])
    : defaultTheme;
  // Ensure link color exists (fallback to a complementary blue)
  const currentTheme = {
    ...rawTheme,
    link: rawTheme.link || "#60a5fa"
  };
  const hasMultipleThemes = colorThemes.length > 1;

  // Background image URL
  const backgroundImageUrl = program.showBackgroundImage && program.imageUrl
    ? getAssetUrl(program.imageUrl)
    : null;

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
    <div
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(to bottom right, ${currentTheme.bgFrom}, ${currentTheme.bgVia}, ${currentTheme.bgTo})`
      }}
    >
      {/* Background Image Overlay - full width, fixed position so it stays while scrolling */}
      {backgroundImageUrl && (
        <div
          className="fixed inset-0 bg-top bg-no-repeat opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: '100% auto'
          }}
        />
      )}

      {/* Top action buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Theme Switcher - only show if multiple themes */}
        {hasMultipleThemes && (
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
            {colorThemes.map((theme, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedThemeIndex(idx)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  idx === selectedThemeIndex ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                }`}
                style={{
                  background: `linear-gradient(to bottom right, ${theme.bgFrom}, ${theme.bgVia}, ${theme.bgTo})`
                }}
                title={theme.name || `Theme ${idx + 1}`}
              />
            ))}
          </div>
        )}

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
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          {getText(program.subtitleZh, program.subtitleEn, program.subtitle) && (
            <p className="text-xl mb-2 font-serif" style={{ color: currentTheme.primary }}>
              "{getText(program.subtitleZh, program.subtitleEn, program.subtitle)}"
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-serif" style={{ color: currentTheme.primary }}>
            {getText(program.titleZh, program.titleEn, program.title)}
          </h1>

          {/* Event Info */}
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: `${currentTheme.primary}cc` }}>
            {program.eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(program.eventDate).toLocaleDateString(t.locale, t.dateFormat)}
                  {program.timeBlock && ` · ${program.timeBlock}`}
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
            <div
              className="mt-4 max-w-2xl mx-auto prose prose-sm prose-invert"
              style={{ color: `${currentTheme.primary}b3` }}
              dangerouslySetInnerHTML={{
                __html: getText(program.descriptionZh, program.descriptionEn, program.description)
              }}
            />
          )}
        </div>

        {/* Program Sections - filter out inactive sections */}
        <div className="space-y-8">
          {program.sections?.filter(s => s.isActive !== false).map((section, sectionIdx) => (
            <div key={section.sectionId} className="bg-white/5 rounded-xl p-6">
              {/* Section Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold font-serif" style={{ color: currentTheme.primary }}>
                  {getText(section.titleZh, section.titleEn, section.title)}
                </h2>
                {getText(section.subtitleZh, section.subtitleEn, section.subtitle) && (
                  <p className="text-sm mt-1" style={{ color: `${currentTheme.primary}99` }}>
                    {getText(section.subtitleZh, section.subtitleEn, section.subtitle)}
                  </p>
                )}
                {getText(section.descriptionZh, section.descriptionEn, section.description) && (
                  <div
                    className="text-sm mt-2 prose prose-sm prose-invert max-w-none"
                    style={{ color: `${currentTheme.primary}b3` }}
                    dangerouslySetInnerHTML={{
                      __html: getText(section.descriptionZh, section.descriptionEn, section.description)
                    }}
                  />
                )}
              </div>

              {/* Section Items - filter out inactive items */}
              <div className="space-y-3">
                {section.items?.filter(i => i.isActive !== false).map((item, itemIdx) => (
                  <ProgramItemRow
                    key={item.itemId}
                    item={item}
                    itemNumber={item.itemNumber ?? (itemIdx + 1)}
                    lang={lang}
                    onShowCards={showCards}
                    getText={getText}
                    primaryColor={currentTheme.primary}
                    linkColor={currentTheme.link}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm" style={{ color: `${currentTheme.primary}80` }}>
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
function ProgramItemRow({ item, itemNumber, lang = "zh", onShowCards, getText, primaryColor = "#facc15", linkColor = "#60a5fa" }) {
  const t = LANGUAGES[lang] || LANGUAGES.zh;

  // Item title and fields using bilingual support
  const itemTitle = getText(item.titleZh, item.titleEn, item.title);
  const itemPerformanceType = getText(item.performanceTypeZh, item.performanceTypeEn, item.performanceType);
  const itemDescription = getText(item.descriptionZh, item.descriptionEn, item.description);
  const estimatedLength = item.estimatedLength?.trim?.() || "";

  // Display style: "default", "credits", or "feature"
  const displayStyle = item.displayStyle || "default";
  const isCreditsStyle = displayStyle === "credits";
  const isFeatureStyle = displayStyle === "feature";

  const hasCards = item.cards?.length > 0;
  const hasDescription = !isCreditsStyle && !isFeatureStyle && (itemDescription || itemPerformanceType);

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
    if (!performer) return;

    const performerName =
      lang === "zh"
        ? performer.chineseName || performer.name
        : performer.englishName || performer.name;

    // Create a default info card from performer basic data
    const defaultCard = {
      cardId: `performer-default-${performer.performerId}`,
      entityType: "Performer",
      entityId: performer.performerId,
      titleZh: performer.chineseName || performer.name,
      titleEn: performer.englishName || performer.name,
      bodyTextZh: performer.bioZh || performer.bio || "",
      bodyTextEn: performer.bioEn || performer.bio || "",
      mediaUrl: performer.photoUrl || "",
      mediaType: "image",
      layoutType: performer.photoUrl ? "left" : "fullwidth",
      displayOrder: 0,
      isDefault: true, // Mark as default card
    };

    // Combine default card with any existing content cards
    const existingCards = performer.cards || [];
    const allCards = [defaultCard, ...existingCards];

    if (onShowCards) {
      onShowCards(allCards, `${t.aboutPerformer}: ${performerName}`);
    }
  };

  // Check if performers have data (from linked Performer entities)
  // API returns performers as a flat list of PerformerDto objects
  const performer1 = item.performers?.find(p =>
    p.name === item.performerNames ||
    p.chineseName === item.performerNames ||
    p.englishName === item.performerNames
  );
  const performer2 = item.performers?.find(p =>
    p.name === item.performerNames2 ||
    p.chineseName === item.performerNames2 ||
    p.englishName === item.performerNames2
  );

  // Performers are clickable if they have data (not just cards)
  const performer1Clickable = !!performer1;
  const performer2Clickable = !!performer2;

  // Whether to show item number (hide if 0, credits, or feature style)
  const showNumber = !isCreditsStyle && !isFeatureStyle && itemNumber > 0;

  // Feature style: larger item name + larger performer avatar, no performer name, no description
  if (isFeatureStyle) {
    const allPerformers = item.performers || [];
    // Use description field as a link URL for the title
    const featureLink = itemDescription?.trim() || "";

    return (
      <div className="border-b border-white/10 last:border-0 pb-3 last:pb-0">
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
          {/* Item Title - larger, linked if description has a URL */}
          {featureLink ? (
            <a
              href={featureLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold transition-opacity hover:opacity-80"
              style={{ color: linkColor }}
            >
              {itemTitle}
            </a>
          ) : (
            <span className="text-lg font-semibold" style={{ color: primaryColor }}>
              {itemTitle}
            </span>
          )}

          {/* Performer avatars only (no names) - larger */}
          {allPerformers.map((performer, idx) => (
            performer.photoUrl ? (
              <button
                key={performer.performerId || idx}
                onClick={(e) => handlePerformerCardsClick(e, performer)}
                className="transition-opacity"
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <img
                  src={getAssetUrl(performer.photoUrl)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              </button>
            ) : null
          ))}
        </div>
      </div>
    );
  }

  // Credits style: show item title followed by performer avatars and names inline
  if (isCreditsStyle) {
    // Get all performers (from linked performers list)
    const allPerformers = item.performers || [];

    // Helper to get performer display name
    const getPerformerName = (performer) => {
      if (!performer) return "";
      return lang === "zh"
        ? performer.chineseName || performer.name || performer.englishName
        : performer.englishName || performer.name || performer.chineseName;
    };

    return (
      <div className="border-b border-white/10 last:border-0 pb-2 last:pb-0">
        <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
          {/* Item Title */}
          <span className="font-medium" style={{ color: primaryColor }}>
            {itemTitle}
          </span>

          {/* Performer avatars and names */}
          {allPerformers.length > 0 ? (
            allPerformers.map((performer, idx) => (
              <button
                key={performer.performerId || idx}
                onClick={(e) => handlePerformerCardsClick(e, performer)}
                className="inline-flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: linkColor }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {performer.photoUrl && (
                  <img
                    src={getAssetUrl(performer.photoUrl)}
                    alt={getPerformerName(performer)}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span>{getPerformerName(performer)}</span>
              </button>
            ))
          ) : (
            // Fallback to performer names if no linked performers
            <>
              {item.performerNames && (
                <span className="text-sm" style={{ color: linkColor }}>
                  {item.performerNames}
                </span>
              )}
              {item.performerNames2 && (
                <span className="text-sm" style={{ color: linkColor }}>
                  {item.performerNames2}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Default style rendering
  return (
    <div className="border-b border-white/10 last:border-0 pb-3 last:pb-0">
      {/* Main Row: Number, Title, Performers */}
      <div className="flex items-start gap-4">
        {/* Item Number - hidden when set to 0 */}
        {showNumber && (
          <span className="font-mono text-sm w-6 text-right flex-shrink-0 pt-0.5" style={{ color: `${primaryColor}b3` }}>
            {itemNumber}:
          </span>
        )}

        {/* Title - clickable if has cards */}
        <div className="flex-1 min-w-0">
          {hasCards ? (
            <button
              onClick={handleItemCardsClick}
              className="font-medium transition-colors inline-flex items-center gap-1.5 text-left"
              style={{ color: linkColor }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              {itemTitle}
              {estimatedLength && <span style={{ color: `${primaryColor}80` }} className="font-normal text-sm">({estimatedLength})</span>}
              <Info className="w-3.5 h-3.5" style={{ color: `${linkColor}99` }} />
            </button>
          ) : (
            <span className="font-medium" style={{ color: primaryColor }}>
              {itemTitle}
              {estimatedLength && <span style={{ color: `${primaryColor}80` }} className="font-normal text-sm ml-1">({estimatedLength})</span>}
            </span>
          )}
        </div>

        {/* Performer Names - clickable if they have performer data */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {item.performerNames && (
            performer1Clickable ? (
              <button
                onClick={(e) => handlePerformerCardsClick(e, performer1)}
                className="text-sm transition-colors inline-flex items-center gap-1"
                style={{ color: linkColor }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {item.performerNames}
                <Info className="w-3 h-3" style={{ color: `${linkColor}80` }} />
              </button>
            ) : (
              <span className="text-sm" style={{ color: `${primaryColor}cc` }}>
                {item.performerNames}
              </span>
            )
          )}
          {item.performerNames2 && (
            performer2Clickable ? (
              <button
                onClick={(e) => handlePerformerCardsClick(e, performer2)}
                className="text-sm transition-colors inline-flex items-center gap-1"
                style={{ color: linkColor }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {item.performerNames2}
                <Info className="w-3 h-3" style={{ color: `${linkColor}80` }} />
              </button>
            ) : (
              <span className="text-sm" style={{ color: `${primaryColor}cc` }}>
                {item.performerNames2}
              </span>
            )
          )}
        </div>
      </div>

      {/* Description Box - always visible if has content (not shown in credits style) */}
      {hasDescription && (
        <div className={`${showNumber ? 'ml-10' : 'ml-0'} mt-2 p-3 bg-white/5 rounded-lg`}>
          {/* Performance Type as first line */}
          {itemPerformanceType && (
            <p className="text-sm" style={{ color: `${primaryColor}99` }}>
              {itemPerformanceType}
            </p>
          )}

          {/* Description - supports HTML */}
          {itemDescription && (
            <div
              className="text-sm mt-1 prose prose-sm prose-invert max-w-none"
              style={{ color: `${primaryColor}b3` }}
              dangerouslySetInnerHTML={{ __html: itemDescription }}
            />
          )}
        </div>
      )}
    </div>
  );
}
