import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, Play } from 'lucide-react';
import { slideShowsAPI, getAssetUrl } from '../services/api';
import './SlideShow.css';

/**
 * SlideShow Component
 *
 * Usage:
 * <SlideShow
 *   code="home-intro"           // Load by code (preferred)
 *   id={1}                      // Or load by ID
 *   onComplete={() => {}}       // Called when slideshow finishes
 *   onSkip={() => {}}           // Called when user skips
 * />
 */
export default function SlideShow({ code, id, onComplete, onSkip }) {
  const [config, setConfig] = useState(null);
  const [sharedVideos, setSharedVideos] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slideProgress, setSlideProgress] = useState(0);

  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const videoRef = useRef(null);

  // Load slideshow configuration
  useEffect(() => {
    const loadSlideShow = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load slideshow config and shared videos in parallel
        const [configRes, videosRes] = await Promise.all([
          code ? slideShowsAPI.getByCode(code) : slideShowsAPI.getById(id),
          slideShowsAPI.getVideos()
        ]);

        if (configRes.success && configRes.data) {
          setConfig(configRes.data);
          if (configRes.data.autoPlay) {
            setIsPlaying(true);
          }
        } else {
          setError('Slideshow not found');
        }

        if (videosRes.success) {
          setSharedVideos(videosRes.data);
        }
      } catch (err) {
        console.error('Failed to load slideshow:', err);
        setError('Failed to load slideshow');
      } finally {
        setLoading(false);
      }
    };

    if (code || id) {
      loadSlideShow();
    }
  }, [code, id]);

  // Get current slide
  const currentSlide = config?.slides?.[currentSlideIndex];

  // Get video URL for current slide
  const getVideoUrl = useCallback(() => {
    if (!currentSlide) return null;

    if (currentSlide.useRandomVideo && sharedVideos.length > 0) {
      // Use a consistent random video per slide based on slide index
      const videoIndex = currentSlideIndex % sharedVideos.length;
      return sharedVideos[videoIndex].url;
    }

    return currentSlide.videoUrl;
  }, [currentSlide, sharedVideos, currentSlideIndex]);

  // Handle slide progression
  useEffect(() => {
    if (!isPlaying || !currentSlide || !config) return;

    const slideDuration = currentSlide.duration || 5000;

    // Progress bar animation
    setSlideProgress(0);
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / slideDuration) * 100, 100);
      setSlideProgress(progress);
    }, 50);

    // Slide timer
    timerRef.current = setTimeout(() => {
      if (currentSlideIndex < config.slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      } else {
        // End of slideshow
        if (config.loop) {
          setCurrentSlideIndex(0);
        } else {
          setIsPlaying(false);
          onComplete?.();
        }
      }
    }, slideDuration);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [isPlaying, currentSlideIndex, currentSlide, config, onComplete]);

  // Handle skip
  const handleSkip = () => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    setIsPlaying(false);
    onSkip?.();
    onComplete?.();
  };

  // Handle replay
  const handleReplay = () => {
    setCurrentSlideIndex(0);
    setIsPlaying(true);
  };

  // Get overlay style
  const getOverlayStyle = () => {
    if (!currentSlide) return {};

    const opacity = (currentSlide.overlayOpacity || 50) / 100;

    switch (currentSlide.overlayType) {
      case 'dark':
        return { backgroundColor: `rgba(0, 0, 0, ${opacity})` };
      case 'light':
        return { backgroundColor: `rgba(255, 255, 255, ${opacity})` };
      case 'gradient':
        return {
          background: `linear-gradient(to bottom, rgba(0,0,0,${opacity * 0.5}), rgba(0,0,0,${opacity}))`
        };
      case 'none':
      default:
        return {};
    }
  };

  // Get layout classes
  const getLayoutClasses = () => {
    if (!currentSlide) return 'items-center justify-center text-center';

    switch (currentSlide.layout) {
      case 'left':
        return 'items-center justify-start text-left pl-12 md:pl-24';
      case 'right':
        return 'items-center justify-end text-right pr-12 md:pr-24';
      case 'split':
        return 'items-center justify-center text-center';
      case 'center':
      default:
        return 'items-center justify-center text-center';
    }
  };

  // Get title size classes
  const getTitleSizeClasses = (size) => {
    switch (size) {
      case 'small': return 'text-2xl md:text-3xl';
      case 'medium': return 'text-3xl md:text-4xl';
      case 'xlarge': return 'text-5xl md:text-7xl';
      case 'large':
      default: return 'text-4xl md:text-6xl';
    }
  };

  // Get subtitle size classes
  const getSubtitleSizeClasses = (size) => {
    switch (size) {
      case 'small': return 'text-base md:text-lg';
      case 'large': return 'text-xl md:text-2xl';
      case 'medium':
      default: return 'text-lg md:text-xl';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error || !config) {
    return null; // Don't show anything if slideshow can't load
  }

  // Not playing state (after completion)
  if (!isPlaying && currentSlideIndex === config.slides.length - 1 && !config.loop) {
    return null;
  }

  const videoUrl = getVideoUrl();

  // Debug logging for video URL
  console.log('[SlideShow] Video debug:', {
    currentSlideIndex,
    useRandomVideo: currentSlide?.useRandomVideo,
    slideVideoUrl: currentSlide?.videoUrl,
    sharedVideosCount: sharedVideos.length,
    rawVideoUrl: videoUrl,
    resolvedVideoUrl: videoUrl ? getAssetUrl(videoUrl) : null
  });

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Debug Display - Video URL */}
      <div className="absolute top-4 left-4 z-[100] bg-black/80 text-white p-3 rounded-lg text-xs max-w-md font-mono">
        <div className="text-yellow-400 font-bold mb-1">Video Debug:</div>
        <div>Raw URL: {videoUrl || 'null'}</div>
        <div>Resolved: {videoUrl ? getAssetUrl(videoUrl) : 'null'}</div>
        <div>Shared Videos: {sharedVideos.length}</div>
        <div>UseRandom: {currentSlide?.useRandomVideo ? 'true' : 'false'}</div>
      </div>

      {/* Video Background */}
      {videoUrl && (
        <video
          ref={videoRef}
          key={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          src={getAssetUrl(videoUrl)}
          autoPlay
          muted
          loop
          playsInline
          onError={(e) => console.error('[SlideShow] Video error:', e.target.error, 'src:', e.target.src)}
          onLoadStart={() => console.log('[SlideShow] Video loading:', getAssetUrl(videoUrl))}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={getOverlayStyle()}
      />

      {/* Content */}
      <div className={`absolute inset-0 flex flex-col ${getLayoutClasses()}`}>
        <div className="max-w-4xl px-6">
          {/* Title */}
          {currentSlide?.titleText && (
            <h1
              key={`title-${currentSlideIndex}`}
              className={`font-display font-bold text-white mb-4 slideshow-animate slideshow-${currentSlide.titleAnimation} ${getTitleSizeClasses(currentSlide.titleSize)}`}
              style={{
                animationDuration: `${currentSlide.titleDuration}ms`,
                animationDelay: `${currentSlide.titleDelay}ms`,
                color: currentSlide.titleColor || 'white'
              }}
            >
              {currentSlide.titleText}
            </h1>
          )}

          {/* Subtitle */}
          {currentSlide?.subtitleText && (
            <p
              key={`subtitle-${currentSlideIndex}`}
              className={`text-white/90 slideshow-animate slideshow-${currentSlide.subtitleAnimation} ${getSubtitleSizeClasses(currentSlide.subtitleSize)}`}
              style={{
                animationDuration: `${currentSlide.subtitleDuration}ms`,
                animationDelay: `${currentSlide.subtitleDelay}ms`,
                color: currentSlide.subtitleColor || 'rgba(255, 255, 255, 0.9)'
              }}
            >
              {currentSlide.subtitleText}
            </p>
          )}

          {/* Slide Images */}
          {currentSlide?.images?.map((image, imgIndex) => (
            <SlideImage key={image.slideImageId || imgIndex} image={image} />
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      {config.showProgress && config.slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2">
          {config.slides.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlideIndex
                  ? 'w-8 bg-white'
                  : index < currentSlideIndex
                    ? 'w-2 bg-white/80'
                    : 'w-2 bg-white/40'
              }`}
            >
              {index === currentSlideIndex && (
                <div
                  className="h-full bg-white/50 rounded-full"
                  style={{ width: `${slideProgress}%` }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skip Button */}
      {config.allowSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full"
        >
          <span className="text-sm">Skip</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Slide Counter */}
      <div className="absolute bottom-6 right-6 text-white/60 text-sm">
        {currentSlideIndex + 1} / {config.slides.length}
      </div>
    </div>
  );
}

// Slide Image Component
function SlideImage({ image }) {
  // Get position classes
  const getPositionClasses = () => {
    switch (image.position) {
      case 'top-left': return 'top-8 left-8';
      case 'top-right': return 'top-8 right-8';
      case 'bottom-left': return 'bottom-24 left-8';
      case 'bottom-right': return 'bottom-24 right-8';
      case 'left': return 'left-8 top-1/2 -translate-y-1/2';
      case 'right': return 'right-8 top-1/2 -translate-y-1/2';
      case 'center':
      default: return 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (image.size) {
      case 'small': return 'w-24 h-24 md:w-32 md:h-32';
      case 'large': return 'w-48 h-48 md:w-64 md:h-64';
      case 'full': return 'w-full h-auto max-w-lg';
      case 'medium':
      default: return 'w-32 h-32 md:w-48 md:h-48';
    }
  };

  return (
    <img
      src={getAssetUrl(image.imageUrl)}
      alt=""
      className={`absolute ${getPositionClasses()} ${getSizeClasses()} object-cover slideshow-animate slideshow-${image.animation} ${image.borderRadius || 'rounded-lg'} ${image.shadow || ''}`}
      style={{
        animationDuration: `${image.duration}ms`,
        animationDelay: `${image.delay}ms`,
        opacity: image.opacity ? image.opacity / 100 : 1
      }}
    />
  );
}

/**
 * Hook to manage slideshow state for a page
 */
export function useSlideShow(code, { autoShow = true } = {}) {
  const [showIntro, setShowIntro] = useState(autoShow);
  const [hasShown, setHasShown] = useState(false);

  const handleComplete = useCallback(() => {
    setShowIntro(false);
    setHasShown(true);
  }, []);

  const replay = useCallback(() => {
    setShowIntro(true);
  }, []);

  return {
    showIntro,
    hasShown,
    handleComplete,
    replay,
    SlideShowComponent: showIntro ? (
      <SlideShow code={code} onComplete={handleComplete} onSkip={handleComplete} />
    ) : null
  };
}
