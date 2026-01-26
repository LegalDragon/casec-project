import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Music,
  Users,
  ChevronRight,
  Loader2,
  ExternalLink,
  Play,
} from "lucide-react";
import { eventProgramsAPI, slideshowsAPI, getAssetUrl } from "../services/api";

export default function EventProgram() {
  const { slug } = useParams();
  const [program, setProgram] = useState(null);
  const [slideshows, setSlideshows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSlideshow, setShowSlideshow] = useState(true);
  const [currentSlideshow, setCurrentSlideshow] = useState(null);

  useEffect(() => {
    loadProgram();
  }, [slug]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const response = await eventProgramsAPI.getById(slug);
      if (response.success) {
        setProgram(response.data);

        // Load slideshows if any
        if (response.data.slideShowIds?.length > 0) {
          try {
            const allSlideshows = await slideshowsAPI.getAll();
            if (allSlideshows.success) {
              const programSlideshows = allSlideshows.data.filter((s) =>
                response.data.slideShowIds.includes(s.slideShowId)
              );
              setSlideshows(programSlideshows);
              if (programSlideshows.length > 0) {
                setCurrentSlideshow(programSlideshows[0]);
              }
            }
          } catch (err) {
            console.error("Error loading slideshows:", err);
          }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900">
      {/* Slideshow Section */}
      {showSlideshow && slideshows.length > 0 && (
        <div className="relative">
          {/* Slideshow placeholder - integrate with your slideshow component */}
          <div className="aspect-video max-h-[60vh] bg-black/50 flex items-center justify-center">
            {currentSlideshow ? (
              <Link
                to={`/slideshow/${currentSlideshow.code}`}
                className="flex flex-col items-center gap-4 text-white hover:text-yellow-400 transition-colors"
              >
                <Play className="w-16 h-16" />
                <span className="text-lg">View Slideshow: {currentSlideshow.name}</span>
              </Link>
            ) : (
              <span className="text-white/50">No slideshow available</span>
            )}
          </div>

          {/* Multiple slideshow buttons */}
          {slideshows.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slideshows.map((slideshow, idx) => (
                <button
                  key={slideshow.slideShowId}
                  onClick={() => setCurrentSlideshow(slideshow)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    currentSlideshow?.slideShowId === slideshow.slideShowId
                      ? "bg-yellow-500 text-black"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {slideshow.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSlideshow(false)}
            className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm hover:bg-black/70 transition-colors"
          >
            Skip to Program
          </button>
        </div>
      )}

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
                  {new Date(program.eventDate).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/50 text-sm">
          <p>节目内容可能会有所调整，以实际演出为准</p>
        </div>
      </div>
    </div>
  );
}

// Program Item Row Component
function ProgramItemRow({ item, itemNumber }) {
  const [expanded, setExpanded] = useState(false);

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
              {item.performers.map((performer) => (
                <div
                  key={performer.performerId}
                  className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1"
                >
                  {performer.photoUrl && (
                    <img
                      src={getAssetUrl(performer.photoUrl)}
                      alt={performer.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="text-white/80 text-sm">{performer.name}</span>
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
              ))}
            </div>
          )}

          {item.contentPageId && (
            <Link
              to={`/content/${item.contentPageId}`}
              className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              View More <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
