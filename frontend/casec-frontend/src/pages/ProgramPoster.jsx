import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Globe } from "lucide-react";
import { eventProgramsAPI, getAssetUrl } from "../services/api";

/*
 * ProgramPoster — Public poster-style program view
 * Mimics a traditional Chinese gala printed program (红金主题).
 * Route: /program/:slug/poster
 *
 * Uses real image assets from /assets/poster/ for authentic look.
 */

// ── Poster image assets (public folder) ──────────────────────────────
const POSTER = {
  headerEmblem: "/assets/poster/header-emblem.png",
  bannerTop: "/assets/poster/banner-top.png",
  bannerBottom: "/assets/poster/banner-bottom.png",
  goldBar: "/assets/poster/gold-bar.png",
  cloudLarge: "/assets/poster/cloud-large.png",
  cloudSmall: "/assets/poster/cloud-small.png",
  firework: "/assets/poster/firework.png",
  waveBottom: "/assets/poster/wave-bottom.png",
};

// ── Language config ──────────────────────────────────────────────────
const LANG = {
  zh: {
    title: "节目单",
    footer:
      "在热烈欢快的歌舞声中，全体演员重返舞台，共庆团结、欢乐与祝福，圆满结束本届佛州华人春晚。",
    footerEn:
      "In a joyful and festive finale, all performers return to the stage, celebrating unity, happiness, and shared blessings to conclude the 2026 Florida Chinese New Year Gala.",
    disclaimer: "节目内容可能会有所调整，以实际演出为准",
    locale: "zh-CN",
  },
  en: {
    title: "Program",
    footer:
      "In a joyful and festive finale, all performers return to the stage, celebrating unity, happiness, and shared blessings.",
    footerEn: "",
    disclaimer: "Program is subject to change",
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

  // Bilingual text helpers
  const getText = (zh, en, fallback) => {
    const z = zh?.trim?.() || "";
    const e = en?.trim?.() || "";
    const f = fallback?.trim?.() || "";
    if (lang === "zh") return z || f || e;
    return e || f || z;
  };

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

      {/* ── Poster Container ──────────────────────────────────── */}
      <div style={styles.poster}>
        {/* ── Header with emblem ──────────────────────────────── */}
        <div style={styles.header}>
          {/* Decorative clouds */}
          <img
            src={POSTER.cloudLarge}
            alt=""
            style={styles.cloudTopLeft}
          />
          <img
            src={POSTER.cloudSmall}
            alt=""
            style={styles.cloudTopRight}
          />

          {/* Main emblem */}
          <img
            src={POSTER.headerEmblem}
            alt={getText(program.titleZh, program.titleEn, program.title)}
            style={styles.headerEmblem}
          />
        </div>

        {/* ── 节目单 Title Banner ─────────────────────────────── */}
        <div style={styles.programTitleWrap}>
          <img src={POSTER.bannerTop} alt="" style={styles.bannerDivider} />
          <div style={styles.programTitleBanner}>
            <img src={POSTER.goldBar} alt="" style={styles.goldBarBg} />
            <span style={styles.programTitleText}>{t.title}</span>
          </div>
          <img src={POSTER.bannerBottom} alt="" style={styles.bannerDivider} />
        </div>

        {/* ── Sections ────────────────────────────────────────── */}
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

        {/* ── Footer ──────────────────────────────────────────── */}
        <div style={styles.footer}>
          {/* Decorative fireworks */}
          <img src={POSTER.firework} alt="" style={styles.fireworkLeft} />
          <img src={POSTER.firework} alt="" style={styles.fireworkRight} />

          <p style={styles.footerTextZh}>{LANG.zh.footer}</p>
          <p style={styles.footerTextEn}>{LANG.zh.footerEn}</p>
        </div>

        {/* ── Bottom wave decoration ──────────────────────────── */}
        <img src={POSTER.waveBottom} alt="" style={styles.waveBottom} />
      </div>
    </div>
  );
}

// ── Section Component ─────────────────────────────────────────────────
function PosterSection({ section, sectionIndex, lang, getText, getBilingual }) {
  const items = (section.items || []).filter((i) => i.isActive !== false);
  const sectionTitle = getBilingual(section.titleZh, section.titleEn, section.title);

  return (
    <div style={styles.section}>
      {/* Section Header — red banner image with text overlay */}
      <div style={styles.sectionHeader}>
        <img src={POSTER.bannerTop} alt="" style={styles.sectionBannerImg} />
        <div style={styles.sectionTitleOverlay}>
          <span style={styles.sectionTitleZh}>{sectionTitle.zh}</span>
          {sectionTitle.en && (
            <span style={styles.sectionTitleEn}>{sectionTitle.en}</span>
          )}
        </div>
        <img src={POSTER.bannerBottom} alt="" style={styles.sectionBannerImg} />
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

// ── Item Component ────────────────────────────────────────────────────
function PosterItem({ item, itemIndex, lang, getText, getBilingual }) {
  const displayStyle = item.displayStyle || "default";
  const isCredits = displayStyle === "credits";
  const isFeature = displayStyle === "feature";
  const itemTitle = getBilingual(item.titleZh, item.titleEn, item.title);
  const perfType = getBilingual(
    item.performanceTypeZh,
    item.performanceTypeEn,
    item.performanceType
  );

  const allPerformers = item.performers || [];

  const getPerformerName = (p) => {
    if (!p) return "";
    const zh = p.chineseName || p.name || "";
    const en = p.englishName || "";
    if (zh && en) return `${zh} ${en}`;
    return zh || en;
  };

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
  const itemNumber = item.itemNumber ?? itemIndex + 1;

  // ── Credits style ──
  if (isCredits) {
    return (
      <div style={styles.creditsItem}>
        <span style={styles.creditsLabel}>{itemTitle.zh || itemTitle.en}</span>
        {performerDisplay && (
          <span style={styles.creditsNames}>{performerDisplay}</span>
        )}
      </div>
    );
  }

  // ── Feature style ──
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
      {/* Bullet / Emoji */}
      <div style={styles.itemBullet}>
        {showNumber ? "●" : ""}
      </div>

      {/* Content */}
      <div style={styles.itemContent}>
        {/* Chinese title + type */}
        <div style={styles.itemTitleRow}>
          <span style={styles.itemTitleZh}>
            {itemTitle.zh ? `《${itemTitle.zh}》` : itemTitle.en}
          </span>
          {perfType.zh && <span style={styles.itemPerfType}>{perfType.zh}</span>}
        </div>

        {/* English title + type */}
        {(itemTitle.en || perfType.en) && (
          <div style={styles.itemEnglishRow}>
            {itemTitle.en && (
              <span style={styles.itemTitleEn}>
                <em>{itemTitle.en}</em>
              </span>
            )}
            {perfType.en && <span style={styles.itemPerfTypeEn}>{perfType.en}</span>}
          </div>
        )}

        {/* Performers */}
        {performerDisplay && (
          <div style={styles.itemPerformer}>{performerDisplay}</div>
        )}

        {/* Description */}
        {itemDesc && (
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
// STYLES
// ═══════════════════════════════════════════════════════════════════════
const styles = {
  // ── Page ──
  page: {
    minHeight: "100vh",
    background: "#1a0000",
    display: "flex",
    justifyContent: "center",
    padding: "0",
    fontFamily:
      "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', 'Georgia', serif",
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
    top: 12,
    right: 12,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(0,0,0,0.6)",
    color: "#ffd700",
    border: "1px solid rgba(255,215,0,0.3)",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },

  // ── Poster ──
  poster: {
    width: "100%",
    maxWidth: 640,
    background: "linear-gradient(180deg, #b22222 0%, #a01c1c 10%, #8b0000 30%, #7a0000 60%, #6b0000 80%, #5c0000 100%)",
    position: "relative",
    overflow: "hidden",
  },

  // ── Header ──
  header: {
    position: "relative",
    textAlign: "center",
    padding: "30px 20px 10px",
    minHeight: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  headerEmblem: {
    width: "85%",
    maxWidth: 440,
    height: "auto",
    position: "relative",
    zIndex: 2,
    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.4))",
  },

  cloudTopLeft: {
    position: "absolute",
    top: 12,
    left: -10,
    width: 120,
    opacity: 0.15,
    transform: "scaleX(-1)",
    zIndex: 1,
  },

  cloudTopRight: {
    position: "absolute",
    top: 60,
    right: -5,
    width: 90,
    opacity: 0.12,
    zIndex: 1,
  },

  // ── Program Title ──
  programTitleWrap: {
    textAlign: "center",
    padding: "8px 40px 4px",
  },

  bannerDivider: {
    width: "70%",
    maxWidth: 300,
    height: "auto",
    display: "block",
    margin: "0 auto",
  },

  programTitleBanner: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "6px 0",
    minWidth: 200,
  },

  goldBarBg: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 4,
    objectFit: "fill",
  },

  programTitleText: {
    position: "relative",
    zIndex: 2,
    color: "#5c1010",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 8,
    padding: "10px 40px",
  },

  // ── Sections Container ──
  sectionsContainer: {
    padding: "12px 24px 16px",
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    margin: "0 0 12px",
  },

  sectionBannerImg: {
    width: "80%",
    maxWidth: 360,
    height: "auto",
    display: "block",
  },

  sectionTitleOverlay: {
    textAlign: "center",
    padding: "8px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },

  sectionTitleZh: {
    color: "#ffd700",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 3,
    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
  },

  sectionTitleEn: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: 1,
  },

  sectionDescription: {
    color: "rgba(255,215,0,0.5)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 1.6,
  },

  // ── Items ──
  itemsList: {
    padding: "0 4px",
  },

  item: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    alignItems: "flex-start",
  },

  itemBullet: {
    color: "#ffd700",
    fontSize: 8,
    minWidth: 16,
    textAlign: "right",
    paddingTop: 6,
    opacity: 0.7,
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemTitleRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 6,
  },

  itemTitleZh: {
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.4,
  },

  itemPerfType: {
    color: "rgba(255,215,0,0.8)",
    fontSize: 13,
  },

  itemEnglishRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 6,
    marginTop: 1,
  },

  itemTitleEn: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 1.4,
  },

  itemPerfTypeEn: {
    color: "rgba(255,215,0,0.45)",
    fontSize: 11,
  },

  itemPerformer: {
    color: "rgba(255,215,0,0.55)",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 1.5,
  },

  itemDescription: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 3,
    lineHeight: 1.5,
  },

  // ── Credits Item ──
  creditsItem: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 5,
    textAlign: "center",
  },

  creditsLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
  },

  creditsNames: {
    color: "rgba(255,215,0,0.65)",
    fontSize: 12,
  },

  // ── Feature Item ──
  featureItem: {
    textAlign: "center",
    marginBottom: 12,
    padding: "10px 16px",
    background: "rgba(255,215,0,0.06)",
    borderRadius: 6,
    border: "1px solid rgba(255,215,0,0.12)",
  },

  featureTitle: {
    color: "#ffd700",
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: 2,
    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
  },

  featureSubtitle: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 12,
    marginTop: 3,
  },

  featurePerformer: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 5,
  },

  // ── Footer ──
  footer: {
    position: "relative",
    textAlign: "center",
    padding: "20px 30px 16px",
    borderTop: "1px solid rgba(255,215,0,0.15)",
  },

  fireworkLeft: {
    position: "absolute",
    top: -20,
    left: 20,
    width: 50,
    opacity: 0.1,
  },

  fireworkRight: {
    position: "absolute",
    top: -20,
    right: 20,
    width: 50,
    opacity: 0.1,
  },

  footerTextZh: {
    color: "rgba(255,215,0,0.5)",
    fontSize: 12,
    lineHeight: 1.8,
    maxWidth: 480,
    margin: "0 auto 6px",
  },

  footerTextEn: {
    color: "rgba(255,215,0,0.35)",
    fontSize: 11,
    lineHeight: 1.7,
    maxWidth: 480,
    margin: "0 auto",
    fontStyle: "italic",
  },

  // ── Wave Bottom ──
  waveBottom: {
    width: "100%",
    height: "auto",
    display: "block",
    marginTop: 8,
  },
};
