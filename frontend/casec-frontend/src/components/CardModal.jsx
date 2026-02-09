import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import CardRenderer from "./CardRenderer";

// Threshold: 3 or fewer cards = carousel, more = scrollable list
const CAROUSEL_THRESHOLD = 3;

export default function CardModal({
  isOpen,
  onClose,
  cards = [],
  title,
  lang = "zh",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first card when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && cards.length <= CAROUSEL_THRESHOLD) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
      } else if (e.key === "ArrowRight" && cards.length <= CAROUSEL_THRESHOLD) {
        setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, cards.length]);

  if (!isOpen || !cards.length) return null;

  const useCarousel = cards.length <= CAROUSEL_THRESHOLD;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {useCarousel ? (
          // Carousel view for 3 or fewer cards
          <div className="relative">
            <div className="p-6">
              {/* Key forces remount when switching cards - fixes video player issues */}
              <CardRenderer 
                key={cards[currentIndex]?.cardId || currentIndex} 
                card={cards[currentIndex]} 
                lang={lang} 
              />
            </div>

            {/* Navigation arrows (only show if more than 1 card) */}
            {cards.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev > 0 ? prev - 1 : cards.length - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev < cards.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots indicator */}
            {cards.length > 1 && (
              <div className="flex justify-center gap-2 pb-4">
                {cards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex
                        ? "bg-yellow-400"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Scrollable list for more than 3 cards
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
            {cards.map((card, idx) => (
              <div
                key={card.cardId || idx}
                className="pb-6 border-b border-white/10 last:border-0 last:pb-0"
              >
                <CardRenderer card={card} lang={lang} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
