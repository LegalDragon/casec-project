import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Globe } from "lucide-react";
import { eventProgramsAPI, getAssetUrl } from "../services/api";

/*
 * ProgramPoster — Public poster-style program view
 * Mimics a traditional Chinese gala printed program (红金主题).
 * Route: /program/:slug/poster
 *
 * Same data as EventProgram.jsx but rendered as a scrollable poster
 * with red/gold Chinese New Year theme, section banners, and
 * bilingual Chinese/English text.
 */

// ── Language config ──────────────────────────────────────────────────────
const LANG = {
  zh: {
    title: "节目单",
    footer: "在热烈欢快的歌舞声中，全体演员重返舞台，共庆团结、欢乐与祝福，圆满结束本届佛州华人春晚。",
    footerEn: "",
    programSubject: "Program is subject to change",
    locale: "zh-CN",
  },
  en: {
    title: "Program",
    footer: "In a joyful and festive finale, all performers return to the stage, celebrating unity, happiness, and shared blessings.",
    footerEn: "",
    programSubject: "Program is subject to change",
    locale: "en-US",
  },
};

export default function ProgramPoster() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const langParam = searchParams.get("lang") || "zh";
  const lang = LANG[langParam] ? langParam : "zh";
  const t = LANG[lang];

  const toggleLanguage = () => {
    setSearchParams({ lang: lang === "zh" ? "en" : "zh" });
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
      } else {
        setError(response.message || "Program not found");
      }
    } catch (err) {
      setError(err?.message || "Failed to load program");
    } finally {
      setLoading(false);
    }
  };

  // Bilingual text helper
  const getText = (zh, en, fallback) => {
    const z = zh?.trim?.() || "";
    const e = en?.trim?.() || "";
    const f = fallback?.trim?.() || "";
    if (lang === "zh") return z || f || e;
    return e || f || z;
  };

  // Get both languages for display (Chinese main + English subtitle)
  const getBilingual = (zh, en, fallback) => {
    const z = zh?.trim?.() || fallback?.trim?.() || "";
    const e = en?.trim?.() || "";
    return { zh: z, en: e };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#facc15" }} />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: "#fff" }}>{error || "Program not found"}</p>
      </div>
    );
  }

  const sections = (program.sections || []).filter((s) => s.isActive !== false);

  return (
    <div style={styles.page}>
      {/* Language Toggle */}
      <button onClick={toggleLanguage} style={styles.langButton}>
        <Globe size={14} />
        {lang === "zh" ? "EN" : "中文"}
      </button>

      {/* ── Poster Container ────────────────────────────────────── */}
      <div style={styles.poster}>
        {/* Decorative top border */}
        <div style={styles.topBorder} />

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={styles.header}>
          {/* Decorative curtain/lantern elements */}
          <div style={styles.curtainLeft} />
          <div style={styles.curtainRight} />

          {/* Subtitle */}
          {getText(program.subtitleZh, program.subtitleEn, program.subtitle) && (
            <p style={styles.headerSubtitle}>
              {getText(program.subtitleZh, program.subtitleEn, program.subtitle)}
            </p>
          )}

          {/* Main Title */}
          <h1 style={styles.headerTitle}>
            {getText(program.titleZh, program.titleEn, program.title)}
          </h1>

          {/* Year Badge */}
          {program.eventDate && (
            <div style={styles.yearBadge}>
              {new Date(program.eventDate).getFullYear()}
            </div>
          )}
        </div>

        {/* ── Program Title Banner ───────────────────────────── */}
        <div style={styles.programTitleBanner}>
          <div style={styles.programTitleInner}>
            {t.title}
          </div>
        </div>

        {/* ── Sections ───────────────────────────────────────── */}
        <div style={styles.sectionsContainer}>
          {sections.map((section, sIdx) => (
            <PosterSection
              key={section.sectionId}
              section={section}
              sectionIndex={sIdx}
              lang={lang}
              getText={getText}
              getBilingual={getBilingual}
            />
          ))}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div style={styles.footer}>
          <p style={styles.footerText}>{t.footer}</p>
          <p style={styles.footerDisclaimer}>{t.programSubject}</p>
        </div>

        {/* Decorative bottom border */}
        <div style={styles.bottomBorder} />
      </div>
    </div>
  );
}

// ── Section Component ──────────────────────────────────────────────────
function PosterSection({ section, sectionIndex, lang, getText, getBilingual }) {
  const items = (section.items || []).filter((i) => i.isActive !== false);
  const sectionTitle = getBilingual(section.titleZh, section.titleEn, section.title);

  return (
    <div style={styles.section}>
      {/* Section Banner */}
      <div style={styles.sectionBanner}>
        <div style={styles.sectionBannerDecorLeft}>◆</div>
        <div style={styles.sectionBannerContent}>
          <span style={styles.sectionBannerTitle}>{sectionTitle.zh}</span>
          {sectionTitle.en && (
            <span style={styles.sectionBannerSubtitle}>{sectionTitle.en}</span>
          )}
        </div>
        <div style={styles.sectionBannerDecorRight}>◆</div>
      </div>

      {/* Section Description */}
      {getText(section.descriptionZh, section.descriptionEn, section.description) && (
        <div
          style={styles.sectionDescription}
          dangerouslySetInnerHTML={{
            __html: getText(section.descriptionZh, section.descriptionEn, section.description),
          }}
        />
      )}

      {/* Items */}
      <div style={styles.itemsList}>
        {items.map((item, iIdx) => (
          <PosterItem
            key={item.itemId}
            item={item}
            itemIndex={iIdx}
            lang={lang}
            getText={getText}
            getBilingual={getBilingual}
          />
        ))}
      </div>
    </div>
  );
}

// ── Item Component ─────────────────────────────────────────────────────
function PosterItem({ item, itemIndex, lang, getText, getBilingual }) {
  const displayStyle = item.displayStyle || "default";
  const isCredits = displayStyle === "credits";
  const isFeature = displayStyle === "feature";
  const itemTitle = getBilingual(item.titleZh, item.titleEn, item.title);
  const perfType = getBilingual(item.performanceTypeZh, item.performanceTypeEn, item.performanceType);

  const allPerformers = item.performers || [];

  // Helper to get performer name
  const getPerformerName = (p) => {
    if (!p) return "";
    const zh = p.chineseName || p.name || "";
    const en = p.englishName || "";
    if (zh && en) return `${zh} ${en}`;
    return zh || en;
  };

  // Performer display from linked list or raw fields
  const getPerformerDisplay = () => {
    if (allPerformers.length > 0) {
      return allPerformers.map((p) => getPerformerName(p)).join("、");
    }
    const parts = [];
    if (item.performerNames) parts.push(item.performerNames);
    if (item.performerNames2) parts.push(item.performerNames2);
    return parts.join("、");
  };

  const performerDisplay = getPerformerDisplay();
  const itemDesc = getText(item.descriptionZh, item.descriptionEn, item.description);
  const showNumber = !isCredits && !isFeature && (item.itemNumber ?? itemIndex + 1) > 0;
  const itemNumber = item.itemNumber ?? (itemIndex + 1);

  // ── Credits style (e.g., "Musical Director: John Smith") ──
  if (isCredits) {
    return (
      <div style={styles.creditsItem}>
        <span style={styles.creditsTitle}>{itemTitle.zh || itemTitle.en}</span>
        {performerDisplay && (
          <span style={styles.creditsPerformer}>{performerDisplay}</span>
        )}
      </div>
    );
  }

  // ── Feature style (highlighted item) ──
  if (isFeature) {
    return (
      <div style={styles.featureItem}>
        <div style={styles.featureTitle}>{itemTitle.zh || itemTitle.en}</div>
        {itemTitle.en && itemTitle.zh && (
          <div style={styles.featureSubtitle}>{itemTitle.en}</div>
        )}
        {performerDisplay && (
          <div style={styles.featurePerformer}>{performerDisplay}</div>
        )}
      </div>
    );
  }

  // ── Default style ──
  return (
    <div style={styles.item}>
      {/* Emoji bullet / number */}
      <div style={styles.itemBullet}>
        {showNumber ? `${itemNumber}.` : "●"}
      </div>

      {/* Content */}
      <div style={styles.itemContent}>
        {/* Title row: Chinese name + performance type */}
        <div style={styles.itemTitleRow}>
          <span style={styles.itemTitleZh}>
            {itemTitle.zh ? `《${itemTitle.zh}》` : itemTitle.en}
          </span>
          {perfType.zh && (
            <span style={styles.itemPerfType}>{perfType.zh}</span>
          )}
        </div>

        {/* English title + English performance type */}
        {(itemTitle.en || perfType.en) && (
          <div style={styles.itemEnglishRow}>
            {itemTitle.en && (
              <span style={styles.itemTitleEn}>
                <em>{itemTitle.en}</em>
              </span>
            )}
            {perfType.en && (
              <span style={styles.itemPerfTypeEn}>{perfType.en}</span>
            )}
          </div>
        )}

        {/* Performer / group info */}
        {performerDisplay && (
          <div style={styles.itemPerformer}>
            {performerDisplay}
          </div>
        )}

        {/* Extra description */}
        {itemDesc && !isFeature && (
          <div
            style={styles.itemDescription}
            dangerouslySetInnerHTML={{ __html: itemDesc }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES — inline CSS to match the printed poster aesthetic
// ═══════════════════════════════════════════════════════════════════════
const styles = {
  // ── Page ──
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #1a0000 0%, #2d0a0a 100%)",
    display: "flex",
    justifyContent: "center",
    padding: "20px 10px",
    fontFamily: "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif",
  },

  loadingContainer: {
    minHeight: "100vh",
    background: "#1a0000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  langButton: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(0,0,0,0.6)",
    color: "#facc15",
    border: "1px solid rgba(250,204,21,0.3)",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },

  // ── Poster ──
  poster: {
    width: "100%",
    maxWidth: 680,
    background: "linear-gradient(180deg, #8b1a1a 0%, #a01c1c 3%, #b22222 8%, #a01c1c 15%, #8b0000 50%, #7a0000 85%, #6b0000 100%)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 0 60px rgba(139,0,0,0.6), 0 0 120px rgba(0,0,0,0.8)",
    position: "relative",
  },

  topBorder: {
    height: 6,
    background: "linear-gradient(90deg, #b8860b, #ffd700, #daa520, #ffd700, #b8860b)",
  },

  bottomBorder: {
    height: 6,
    background: "linear-gradient(90deg, #b8860b, #ffd700, #daa520, #ffd700, #b8860b)",
  },

  // ── Header ──
  header: {
    position: "relative",
    textAlign: "center",
    padding: "40px 30px 24px",
    background: "linear-gradient(180deg, rgba(139,26,26,0.9) 0%, transparent 100%)",
    overflow: "hidden",
  },

  curtainLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 60,
    height: "100%",
    background: "linear-gradient(90deg, rgba(100,0,0,0.8), transparent)",
    pointerEvents: "none",
  },

  curtainRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 60,
    height: "100%",
    background: "linear-gradient(-90deg, rgba(100,0,0,0.8), transparent)",
    pointerEvents: "none",
  },

  headerSubtitle: {
    color: "#ffd700",
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 2,
    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
  },

  headerTitle: {
    color: "#ffd700",
    fontSize: 36,
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: 4,
    textShadow: "0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.3)",
    lineHeight: 1.3,
  },

  yearBadge: {
    display: "inline-block",
    color: "#ffd700",
    fontSize: 28,
    fontWeight: 700,
    fontStyle: "italic",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
    marginTop: 4,
  },

  // ── Program Title Banner ──
  programTitleBanner: {
    display: "flex",
    justifyContent: "center",
    padding: "16px 30px",
  },

  programTitleInner: {
    background: "linear-gradient(180deg, #ffd700, #daa520)",
    color: "#5c1010",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 6,
    padding: "10px 40px",
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    border: "2px solid #b8860b",
  },

  // ── Sections Container ──
  sectionsContainer: {
    padding: "8px 20px 20px",
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },

  sectionBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    margin: "0 0 12px",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,215,0,0.3)",
    borderBottom: "1px solid rgba(255,215,0,0.3)",
  },

  sectionBannerDecorLeft: {
    color: "#ffd700",
    fontSize: 10,
    opacity: 0.6,
  },

  sectionBannerDecorRight: {
    color: "#ffd700",
    fontSize: 10,
    opacity: 0.6,
  },

  sectionBannerContent: {
    textAlign: "center",
  },

  sectionBannerTitle: {
    display: "block",
    color: "#ffd700",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 2,
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
  },

  sectionBannerSubtitle: {
    display: "block",
    color: "rgba(255,215,0,0.7)",
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 1,
  },

  sectionDescription: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 1.6,
  },

  // ── Items List ──
  itemsList: {
    padding: "0 8px",
  },

  // ── Default Item ──
  item: {
    display: "flex",
    gap: 10,
    marginBottom: 14,
    alignItems: "flex-start",
  },

  itemBullet: {
    color: "#ffd700",
    fontSize: 13,
    fontWeight: 700,
    minWidth: 24,
    textAlign: "right",
    paddingTop: 2,
    opacity: 0.8,
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemTitleRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },

  itemTitleZh: {
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
  },

  itemPerfType: {
    color: "rgba(255,215,0,0.8)",
    fontSize: 13,
  },

  itemEnglishRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
    marginTop: 1,
  },

  itemTitleEn: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  itemPerfTypeEn: {
    color: "rgba(255,215,0,0.5)",
    fontSize: 11,
  },

  itemPerformer: {
    color: "rgba(255,215,0,0.65)",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 1.5,
  },

  itemDescription: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 1.5,
  },

  // ── Credits Item ──
  creditsItem: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 6,
    textAlign: "center",
  },

  creditsTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
  },

  creditsPerformer: {
    color: "rgba(255,215,0,0.7)",
    fontSize: 13,
  },

  // ── Feature Item ──
  featureItem: {
    textAlign: "center",
    marginBottom: 14,
    padding: "12px 16px",
    background: "rgba(255,215,0,0.08)",
    borderRadius: 8,
    border: "1px solid rgba(255,215,0,0.15)",
  },

  featureTitle: {
    color: "#ffd700",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 2,
    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
  },

  featureSubtitle: {
    color: "rgba(255,215,0,0.7)",
    fontSize: 13,
    marginTop: 4,
  },

  featurePerformer: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 6,
  },

  // ── Footer ──
  footer: {
    textAlign: "center",
    padding: "24px 30px",
    borderTop: "1px solid rgba(255,215,0,0.2)",
  },

  footerText: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 12,
    lineHeight: 1.8,
    maxWidth: 500,
    margin: "0 auto 8px",
  },

  footerDisclaimer: {
    color: "rgba(255,215,0,0.35)",
    fontSize: 11,
    fontStyle: "italic",
  },
};
