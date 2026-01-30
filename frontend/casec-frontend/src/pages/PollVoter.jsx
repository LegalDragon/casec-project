import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  Star,
  Check,
  ChevronRight,
  Globe,
  Phone,
  BarChart3,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { pollsAPI } from "../services/api";

// Bilingual text helper
const T = {
  zh: {
    enterPhone: "输入手机号码",
    phonePlaceholder: "请输入手机号",
    continue: "开始投票",
    question: "投票问题",
    submit: "提交投票",
    submitting: "提交中...",
    thankYou: "感谢您的投票！",
    yourVote: "您的选择",
    changeVote: "更改投票",
    results: "当前结果",
    totalVotes: "总投票数",
    selectOption: "请选择一个选项",
    selectOptions: "请选择选项",
    rateHere: "点击星星评分",
    pollClosed: "投票已结束",
    pollNotFound: "找不到投票",
    votes: "票",
    backToVote: "返回投票",
    maxSelections: "最多可选",
    options: "项",
  },
  en: {
    enterPhone: "Enter your phone number",
    phonePlaceholder: "Phone number",
    continue: "Start Voting",
    question: "Poll Question",
    submit: "Submit Vote",
    submitting: "Submitting...",
    thankYou: "Thank you for voting!",
    yourVote: "Your vote",
    changeVote: "Change Vote",
    results: "Current Results",
    totalVotes: "Total Votes",
    selectOption: "Select an option",
    selectOptions: "Select options",
    rateHere: "Tap stars to rate",
    pollClosed: "This poll has ended",
    pollNotFound: "Poll not found",
    votes: "votes",
    backToVote: "Back to Vote",
    maxSelections: "Select up to",
    options: "options",
  },
};

// Session storage key
const getSessionKey = (pollId) => `poll-voter-${pollId}`;
const getPhoneKey = () => `poll-voter-phone`;

export default function PollVoter() {
  const { pollId } = useParams();
  const [lang, setLang] = useState("zh");
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // phone, vote, thanks
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [ratingValue, setRatingValue] = useState(null);
  const [voting, setVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const t = T[lang];

  // Load poll data
  const loadPoll = useCallback(async () => {
    try {
      const response = await pollsAPI.getById(pollId);
      if (response.success && response.data) {
        setPoll(response.data);
        // Restore previous vote state
        if (response.data.hasVoted) {
          if (response.data.userResponse) {
            setSelectedOptions(
              response.data.userResponse.selectedOptionIds || []
            );
            setRatingValue(response.data.userResponse.ratingValue);
          }
          setStep("thanks");
        }
      } else {
        setError(t.pollNotFound);
      }
    } catch (err) {
      setError(t.pollNotFound);
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    // Restore phone from localStorage
    const savedPhone = localStorage.getItem(getPhoneKey());
    if (savedPhone) {
      setPhone(savedPhone);
    }
    // Check if already voted (by session)
    const session = localStorage.getItem(getSessionKey(pollId));
    if (session && savedPhone) {
      setStep("vote"); // Will be overridden to "thanks" if hasVoted
    }
    loadPoll();
  }, [pollId, loadPoll]);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    localStorage.setItem(getPhoneKey(), phone.trim());
    localStorage.setItem(getSessionKey(pollId), "true");
    setStep("vote");
  };

  const handleOptionToggle = (optionId) => {
    if (poll.pollType === "SingleChoice") {
      setSelectedOptions([optionId]);
    } else {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
      } else {
        if (
          poll.maxSelections &&
          selectedOptions.length >= poll.maxSelections
        ) {
          return;
        }
        setSelectedOptions([...selectedOptions, optionId]);
      }
    }
  };

  const handleVote = async () => {
    if (voting) return;

    // Validate
    if (
      ["SingleChoice", "MultipleChoice"].includes(poll.pollType) &&
      selectedOptions.length === 0
    ) {
      return;
    }
    if (poll.pollType === "Rating" && ratingValue === null) {
      return;
    }

    setVoting(true);
    try {
      const response = await pollsAPI.vote(poll.pollId, {
        selectedOptionIds:
          selectedOptions.length > 0 ? selectedOptions : null,
        ratingValue,
        isAnonymous: true,
      });

      if (response.success) {
        setPoll(response.data);
        setStep("thanks");
        setShowResults(response.data.showResultsToVoters);
      }
    } catch (err) {
      setError(err.message || "Failed to submit vote");
    } finally {
      setVoting(false);
    }
  };

  const handleChangeVote = () => {
    setStep("vote");
  };

  const toggleLang = () => {
    setLang((l) => (l === "zh" ? "en" : "zh"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-amber-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-amber-950 flex items-center justify-center p-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 text-center max-w-sm w-full">
          <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-amber-950">
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
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-red-950 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" />
            <span>CASEC Spring Gala 2026</span>
          </div>
        </div>

        {/* Phone Entry Step */}
        {step === "phone" && (
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <Phone className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white">
                {t.enterPhone}
              </h2>
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

        {/* Vote Step */}
        {step === "vote" && poll && (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h1 className="text-2xl font-bold text-yellow-400 mb-2">
                {poll.question}
              </h1>
              {poll.description && (
                <p className="text-white/60 text-sm">{poll.description}</p>
              )}
            </div>

            {/* Choice Options */}
            {["SingleChoice", "MultipleChoice"].includes(poll.pollType) && (
              <div className="space-y-3">
                {poll.pollType === "MultipleChoice" &&
                  poll.maxSelections && (
                    <p className="text-white/50 text-sm text-center">
                      {t.maxSelections} {poll.maxSelections} {t.options}
                    </p>
                  )}
                {poll.options?.map((option) => {
                  const isSelected = selectedOptions.includes(option.optionId);
                  return (
                    <button
                      key={option.optionId}
                      onClick={() => handleOptionToggle(option.optionId)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? "border-yellow-400 bg-yellow-400/15 shadow-lg shadow-yellow-400/10"
                          : "border-white/15 bg-black/10 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? "border-yellow-400 bg-yellow-400"
                              : "border-white/30"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-red-950" />
                          )}
                        </div>
                        <span
                          className={`text-lg font-medium ${
                            isSelected ? "text-yellow-400" : "text-white"
                          }`}
                        >
                          {option.optionText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Rating */}
            {poll.pollType === "Rating" && (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <p className="text-white/50 text-center mb-6">{t.rateHere}</p>
                <div className="flex items-center justify-center gap-3">
                  {Array.from(
                    {
                      length:
                        (poll.ratingMax || 5) - (poll.ratingMin || 1) + 1,
                    },
                    (_, i) => i + (poll.ratingMin || 1)
                  ).map((value) => (
                    <button
                      key={value}
                      onClick={() => setRatingValue(value)}
                      className="p-1 active:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-12 h-12 transition-all duration-200 ${
                          ratingValue !== null && value <= ratingValue
                            ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                            : "text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {ratingValue && (
                  <p className="text-center text-yellow-400 text-2xl font-bold mt-4">
                    {ratingValue} / {poll.ratingMax || 5}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleVote}
              disabled={
                voting ||
                (["SingleChoice", "MultipleChoice"].includes(
                  poll.pollType
                ) &&
                  selectedOptions.length === 0) ||
                (poll.pollType === "Rating" && ratingValue === null)
              }
              className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white py-5 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-red-900/40"
            >
              {voting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  {t.submit}
                </>
              )}
            </button>
          </div>
        )}

        {/* Thank You Step */}
        {step === "thanks" && poll && (
          <div className="space-y-6">
            {/* Success Card */}
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-400/30 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-400/30">
                <Check className="w-10 h-10 text-red-950" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                {t.thankYou}
              </h2>
              <p className="text-white/50 text-sm">{poll.question}</p>
            </div>

            {/* Results (if ShowResultsToVoters) */}
            {poll.showResultsToVoters && poll.options && (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                  {t.results}
                </h3>
                <div className="space-y-3">
                  {poll.options.map((option) => {
                    const isMyVote =
                      poll.userResponse?.selectedOptionIds?.includes(
                        option.optionId
                      );
                    return (
                      <div key={option.optionId} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span
                            className={`flex items-center gap-2 ${
                              isMyVote
                                ? "text-yellow-400 font-medium"
                                : "text-white/80"
                            }`}
                          >
                            {isMyVote && <Check className="w-4 h-4" />}
                            {option.optionText}
                          </span>
                          <span className="text-white/50">
                            {option.voteCount || 0} ({option.percentage || 0}%)
                          </span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isMyVote
                                ? "bg-gradient-to-r from-red-500 to-yellow-400"
                                : "bg-white/20"
                            }`}
                            style={{
                              width: `${option.percentage || 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {poll.totalResponses != null && (
                  <p className="text-sm text-white/40 text-center mt-4">
                    {poll.totalResponses} {t.totalVotes}
                  </p>
                )}
              </div>
            )}

            {/* Rating result */}
            {poll.showResultsToVoters &&
              poll.pollType === "Rating" &&
              poll.userResponse?.ratingValue && (
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                  <p className="text-white/60 mb-3">{t.yourVote}</p>
                  <div className="flex items-center justify-center gap-1">
                    {Array.from(
                      {
                        length:
                          (poll.ratingMax || 5) - (poll.ratingMin || 1) + 1,
                      },
                      (_, i) => i + (poll.ratingMin || 1)
                    ).map((value) => (
                      <Star
                        key={value}
                        className={`w-8 h-8 ${
                          value <= poll.userResponse.ratingValue
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Change vote */}
            {poll.allowChangeVote && (
              <button
                onClick={handleChangeVote}
                className="w-full bg-white/10 text-white py-4 rounded-xl font-medium text-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                <RefreshCw className="w-5 h-5" />
                {t.changeVote}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
