import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  Star,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Phone,
  Music,
  MessageSquare,
  Sparkles,
  Heart,
} from "lucide-react";
import { eventProgramsAPI, programRatingsAPI, getAssetUrl } from "../services/api";

// Bilingual text
const T = {
  zh: {
    enterPhone: "输入手机号码",
    phonePlaceholder: "请输入手机号",
    continue: "开始评分",
    overallRating: "整体评价",
    rateEvent: "请为本次活动整体评分",
    rateItem: "为此节目评分",
    comment: "留言（可选）",
    commentPlaceholder: "写下您的感想...",
    submit: "提交评分",
    submitting: "提交中...",
    thankYou: "感谢您的评价！",
    updated: "评分已更新！",
    avgRating: "平均",
    ratings: "人评",
    tapToRate: "点击评分",
    program: "节目单",
    yourRating: "我的评分",
    noProgram: "未找到节目单",
    footer: "感谢您参加佛罗里达华人春晚 2026",
  },
  en: {
    enterPhone: "Enter your phone number",
    phonePlaceholder: "Phone number",
    continue: "Start Rating",
    overallRating: "Overall Rating",
    rateEvent: "Rate this event overall",
    rateItem: "Rate this performance",
    comment: "Comment (optional)",
    commentPlaceholder: "Share your thoughts...",
    submit: "Submit Rating",
    submitting: "Submitting...",
    thankYou: "Thank you for your feedback!",
    updated: "Rating updated!",
    avgRating: "Avg",
    ratings: "ratings",
    tapToRate: "Tap to rate",
    program: "Program",
    yourRating: "My rating",
    noProgram: "Program not found",
    footer: "Thank you for attending CASEC Spring Gala 2026",
  },
};

// Phone storage key
const PHONE_KEY = "program-rating-phone";

// Star Rating Input
function StarInput({ value, onChange, size = "md" }) {
  const starSizes = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  const cls = starSizes[size] || starSizes.md;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="p-0.5 active:scale-110 transition-transform"
          type="button"
        >
          <Star
            className={`${cls} transition-all duration-200 ${
              value !== null && star <= value
                ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]"
                : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Mini star display for aggregate ratings
function MiniStars({ average, count }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= Math.round(average)
                ? "text-yellow-400 fill-yellow-400"
                : "text-white/15"
            }`}
          />
        ))}
      </div>
      <span className="text-yellow-400/80 text-xs font-medium">
        {average.toFixed(1)}
      </span>
      <span className="text-white/30 text-xs">({count})</span>
    </div>
  );
}

// Success toast animation
function SuccessToast({ message, visible }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium">
        <Check className="w-5 h-5" />
        {message}
      </div>
    </div>
  );
}

// Program Item Card
function ProgramItemCard({
  item,
  itemNumber,
  lang,
  aggregate,
  myRating,
  onSubmitRating,
  submittingItemId,
}) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(myRating?.rating || null);
  const [comment, setComment] = useState(myRating?.comment || "");
  const t = T[lang];

  // Sync when myRating changes from parent
  useEffect(() => {
    if (myRating) {
      setRating(myRating.rating);
      setComment(myRating.comment || "");
    }
  }, [myRating]);

  const getText = (zhField, enField, fallback) => {
    const zh = zhField?.trim?.() || zhField || "";
    const en = enField?.trim?.() || enField || "";
    const fb = fallback?.trim?.() || fallback || "";
    if (lang === "zh") return zh || fb || en;
    return en || fb || zh;
  };

  const title = getText(item.titleZh, item.titleEn, item.title);
  const perfType = getText(
    item.performanceTypeZh,
    item.performanceTypeEn,
    item.performanceType
  );

  // Get performer names
  const performers = item.performers || [];
  const performerNames = performers
    .map((p) =>
      lang === "zh"
        ? p.chineseName || p.name || p.englishName
        : p.englishName || p.name || p.chineseName
    )
    .filter(Boolean)
    .join(", ");
  const fallbackPerformers =
    performerNames || item.performerNames || "";

  const isSubmitting = submittingItemId === item.itemId;

  const handleSubmit = () => {
    if (!rating) return;
    onSubmitRating(item.itemId, rating, comment.trim() || null);
  };

  return (
    <div className="bg-black/15 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Item Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3 active:bg-white/5 transition-colors"
      >
        {/* Number */}
        {itemNumber > 0 && (
          <span className="text-yellow-400/60 font-mono text-sm w-6 text-right flex-shrink-0 pt-0.5">
            {itemNumber}
          </span>
        )}

        {/* Thumbnail */}
        {item.imageUrl && (
          <img
            src={getAssetUrl(item.imageUrl)}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-base leading-tight">
            {title}
          </h3>
          {perfType && (
            <p className="text-yellow-400/60 text-xs mt-0.5">{perfType}</p>
          )}
          {fallbackPerformers && (
            <p className="text-white/40 text-xs mt-0.5 truncate">
              {fallbackPerformers}
            </p>
          )}
          {/* Aggregate rating */}
          {aggregate && (
            <div className="mt-1">
              <MiniStars
                average={aggregate.averageRating}
                count={aggregate.totalRatings}
              />
            </div>
          )}
        </div>

        {/* My rating indicator + expand icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {myRating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold">
                {myRating.rating}
              </span>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-white/30" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded Rating Area */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          <div className="text-center">
            <p className="text-white/40 text-xs mb-2">
              {myRating ? t.yourRating : t.rateItem}
            </p>
            <StarInput value={rating} onChange={setRating} size="md" />
          </div>

          {/* Comment */}
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 resize-none"
              rows={2}
              maxLength={500}
              placeholder={t.commentPlaceholder}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
            className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t.submit}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProgramRating() {
  const { eventSlug } = useParams();
  const [lang, setLang] = useState("zh");
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // phone, rate
  const [ratingsData, setRatingsData] = useState(null);
  const [submittingItemId, setSubmittingItemId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });

  // Overall event rating state
  const [overallRating, setOverallRating] = useState(null);
  const [overallComment, setOverallComment] = useState("");
  const [submittingOverall, setSubmittingOverall] = useState(false);

  const t = T[lang];

  // Load program
  const loadProgram = useCallback(async () => {
    try {
      const response = await eventProgramsAPI.getById(eventSlug);
      if (response.success && response.data) {
        setProgram(response.data);
      } else {
        setError(t.noProgram);
      }
    } catch (err) {
      setError(t.noProgram);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  // Load ratings
  const loadRatings = useCallback(async () => {
    if (!program) return;
    try {
      const response = await programRatingsAPI.getEventRatings(
        program.programId,
        phone || undefined
      );
      if (response.success) {
        setRatingsData(response.data);

        // Restore overall rating
        const myOverall = response.data.myRatings?.find(
          (r) => r.programItemId === null
        );
        if (myOverall) {
          setOverallRating(myOverall.rating);
          setOverallComment(myOverall.comment || "");
        }
      }
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  }, [program, phone]);

  useEffect(() => {
    // Restore phone
    const savedPhone = localStorage.getItem(PHONE_KEY);
    if (savedPhone) {
      setPhone(savedPhone);
      setStep("rate");
    }
    loadProgram();
  }, [eventSlug, loadProgram]);

  useEffect(() => {
    if (program && step === "rate") {
      loadRatings();
      // Poll for rating updates every 15s
      const interval = setInterval(loadRatings, 15000);
      return () => clearInterval(interval);
    }
  }, [program, step, loadRatings]);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    localStorage.setItem(PHONE_KEY, phone.trim());
    setStep("rate");
  };

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2500);
  };

  const handleSubmitItemRating = async (programItemId, rating, comment) => {
    if (!program || !phone) return;
    setSubmittingItemId(programItemId);
    try {
      const response = await programRatingsAPI.submitRating({
        eventProgramId: program.programId,
        programItemId,
        phoneNumber: phone.trim(),
        rating,
        comment,
      });
      if (response.success) {
        showToast(t.thankYou);
        await loadRatings();
      }
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setSubmittingItemId(null);
    }
  };

  const handleSubmitOverall = async () => {
    if (!program || !phone || !overallRating) return;
    setSubmittingOverall(true);
    try {
      const response = await programRatingsAPI.submitRating({
        eventProgramId: program.programId,
        programItemId: null,
        phoneNumber: phone.trim(),
        rating: overallRating,
        comment: overallComment.trim() || null,
      });
      if (response.success) {
        showToast(t.thankYou);
        await loadRatings();
      }
    } catch (err) {
      console.error("Failed to submit overall rating:", err);
    } finally {
      setSubmittingOverall(false);
    }
  };

  const toggleLang = () => {
    setLang((l) => (l === "zh" ? "en" : "zh"));
  };

  // Helper for bilingual text
  const getText = (zhField, enField, fallback) => {
    const zh = zhField?.trim?.() || zhField || "";
    const en = enField?.trim?.() || enField || "";
    const fb = fallback?.trim?.() || fallback || "";
    if (lang === "zh") return zh || fb || en;
    return en || fb || zh;
  };

  // Get aggregate for a specific item
  const getItemAggregate = (itemId) => {
    return ratingsData?.itemRatings?.find(
      (r) => r.programItemId === itemId
    );
  };

  // Get my rating for a specific item
  const getMyRating = (itemId) => {
    return ratingsData?.myRatings?.find(
      (r) => r.programItemId === itemId
    );
  };

  // Flatten all items from all sections
  const allItems = program?.sections
    ?.filter((s) => s.isActive !== false)
    ?.flatMap((s) =>
      (s.items || [])
        .filter((i) => i.isActive !== false)
        .map((item, idx) => ({
          ...item,
          sectionTitle: getText(s.titleZh, s.titleEn, s.title),
          itemNumber: item.itemNumber ?? idx + 1,
        }))
    ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-amber-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-amber-950 flex items-center justify-center p-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 text-center max-w-sm w-full">
          <Music className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-amber-950">
      <SuccessToast message={toast.message} visible={toast.visible} />

      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm hover:bg-black/60 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === "zh" ? "EN" : "中文"}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-red-950 px-4 py-1.5 rounded-full text-sm font-bold mb-3">
            <Sparkles className="w-4 h-4" />
            <span>CASEC Spring Gala 2026</span>
          </div>
          {program && (
            <h1 className="text-2xl font-bold text-yellow-400">
              {getText(program.titleZh, program.titleEn, program.title)}
            </h1>
          )}
        </div>

        {/* Phone Entry Step */}
        {step === "phone" && (
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <Phone className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white">{t.enterPhone}</h2>
            </div>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                  placeholder={t.phonePlaceholder}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
              >
                {t.continue}
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Rating Step */}
        {step === "rate" && program && (
          <div className="space-y-6">
            {/* Overall Event Rating */}
            <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-center mb-4">
                <Heart className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-yellow-400">
                  {t.overallRating}
                </h2>
                <p className="text-white/40 text-sm">{t.rateEvent}</p>
                {ratingsData?.overallRating && (
                  <div className="mt-2">
                    <MiniStars
                      average={ratingsData.overallRating.averageRating}
                      count={ratingsData.overallRating.totalRatings}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-center mb-4">
                <StarInput
                  value={overallRating}
                  onChange={setOverallRating}
                  size="lg"
                />
              </div>
              <textarea
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 resize-none mb-3"
                rows={2}
                maxLength={500}
                placeholder={t.commentPlaceholder}
              />
              <button
                onClick={handleSubmitOverall}
                disabled={!overallRating || submittingOverall}
                className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submittingOverall ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t.submit}
                  </>
                )}
              </button>
            </div>

            {/* Program Items */}
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                <Music className="w-5 h-5" />
                {t.program}
              </h3>

              {/* Group by section */}
              {program.sections
                ?.filter((s) => s.isActive !== false)
                .map((section) => (
                  <div key={section.sectionId} className="mb-4">
                    <h4 className="text-sm font-medium text-yellow-400/60 mb-2 px-1">
                      {getText(section.titleZh, section.titleEn, section.title)}
                    </h4>
                    <div className="space-y-2">
                      {section.items
                        ?.filter((i) => i.isActive !== false && i.displayStyle !== "credits")
                        .map((item, idx) => (
                          <ProgramItemCard
                            key={item.itemId}
                            item={item}
                            itemNumber={item.itemNumber ?? idx + 1}
                            lang={lang}
                            aggregate={getItemAggregate(item.itemId)}
                            myRating={getMyRating(item.itemId)}
                            onSubmitRating={handleSubmitItemRating}
                            submittingItemId={submittingItemId}
                          />
                        ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-center pt-4 pb-8">
              <p className="text-white/30 text-xs">{t.footer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
