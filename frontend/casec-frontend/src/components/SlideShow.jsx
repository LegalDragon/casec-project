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
  const [currentBgVideoIndex, setCurrentBgVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slideProgress, setSlideProgress] = useState(0);

  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const videoRef = useRef(null);
  const bgVideoTimerRef = useRef(null);

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

  // Reset background video index when slide changes
  useEffect(() => {
    setCurrentBgVideoIndex(0);
  }, [currentSlideIndex]);

  // Handle background video cycling (separate from slide timing)
  useEffect(() => {
    if (!isPlaying || !currentSlide) return;

    const bgType = currentSlide.backgroundType || 'heroVideos';
    if (bgType !== 'heroVideos') return;

    const bgVideos = currentSlide.backgroundVideos || [];
    if (bgVideos.length <= 1) return; // No need to cycle if 0 or 1 video

    const currentBgVideo = bgVideos[currentBgVideoIndex];
    const duration = currentBgVideo?.duration || 5000;

    bgVideoTimerRef.current = setTimeout(() => {
      setCurrentBgVideoIndex((prev) => (prev + 1) % bgVideos.length);
    }, duration);

    return () => {
      if (bgVideoTimerRef.current) {
        clearTimeout(bgVideoTimerRef.current);
      }
    };
  }, [isPlaying, currentSlide, currentBgVideoIndex]);

  // Get BACKGROUND video URL for current slide (only for heroVideos background type)
  // This is separate from video SlideObjects which are foreground content
  const getBackgroundVideoUrl = useCallback(() => {
    if (!currentSlide) return null;

    // Only show background video for heroVideos background type
    const bgType = currentSlide.backgroundType || 'heroVideos';
    if (bgType !== 'heroVideos') return null;

    // First, check if there are specific background videos defined
    const bgVideos = currentSlide.backgroundVideos || [];
    if (bgVideos.length > 0) {
      const currentBgVideo = bgVideos[currentBgVideoIndex];
      // Get URL from the video object or direct videoUrl
      return currentBgVideo?.video?.url || currentBgVideo?.videoUrl || null;
    }

    // Fallback: If using random video from shared pool (legacy support)
    if (currentSlide.useRandomVideo || currentSlide.useRandomHeroVideos) {
      if (sharedVideos.length > 0) {
        const videoIndex = currentSlideIndex % sharedVideos.length;
        return sharedVideos[videoIndex].url;
      }
      return null;
    }

    // Fallback: Use specific video URL (legacy support)
    return currentSlide.videoUrl || null;
  }, [currentSlide, currentBgVideoIndex, sharedVideos, currentSlideIndex]);

  // Get background style based on backgroundType
  const getBackgroundStyle = () => {
    if (!currentSlide) return {};

    const bgType = currentSlide.backgroundType || 'heroVideos';

    switch (bgType) {
      case 'color':
        return { backgroundColor: currentSlide.backgroundColor || '#000000' };
      case 'image':
        return currentSlide.backgroundImageUrl
          ? {
              backgroundImage: `url(${getAssetUrl(currentSlide.backgroundImageUrl)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }
          : { backgroundColor: '#000000' };
      case 'none':
        return { backgroundColor: 'transparent' };
      case 'heroVideos':
      default:
        return {}; // Video handled separately
    }
  };

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

  const backgroundVideoUrl = getBackgroundVideoUrl();
  const backgroundStyle = getBackgroundStyle();

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Static Background (color/image) */}
      {!backgroundVideoUrl && (
        <div
          className="absolute inset-0 z-0"
          style={backgroundStyle}
        />
      )}

      {/* Video Background (heroVideos only - separate from video SlideObjects) */}
      {backgroundVideoUrl && (
        <video
          ref={videoRef}
          key={backgroundVideoUrl}
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={getAssetUrl(backgroundVideoUrl)}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => {
            // Ensure video plays when ready
            e.target.play().catch(() => {});
          }}
          onError={(e) => console.error('[SlideShow] Video error:', e.target.error, 'src:', e.target.src)}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 transition-colors duration-500 z-10"
        style={getOverlayStyle()}
      />

      {/* Content - SlideObjects */}
      <div className="absolute inset-0 z-20">
        {currentSlide?.objects?.map((obj, objIndex) => (
          <SlideObject
            key={obj.slideObjectId || objIndex}
            object={obj}
            slideIndex={currentSlideIndex}
          />
        ))}

        {/* Legacy support: Title */}
        {currentSlide?.titleText && !currentSlide?.objects?.length && (
          <div className={`absolute inset-0 flex flex-col ${getLayoutClasses()}`}>
            <div className="max-w-4xl px-6">
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
              {currentSlide?.subtitleText && (
                <p
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
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {config.showProgress && config.slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-30">
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
          className="absolute top-6 right-6 flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full z-30"
        >
          <span className="text-sm">Skip</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Slide Counter */}
      <div className="absolute bottom-6 right-6 text-white/60 text-sm z-30">
        {currentSlideIndex + 1} / {config.slides.length}
      </div>
    </div>
  );
}

// SlideObject Component - renders text, image, or video with animations
function SlideObject({ object, slideIndex }) {
  const [animationPhase, setAnimationPhase] = useState('in'); // 'in', 'visible', 'out', 'hidden'
  const props = object.properties ? (typeof object.properties === 'string' ? JSON.parse(object.properties) : object.properties) : {};

  // Calculate position style based on alignment and offsets
  const getPositionStyle = () => {
    const style = {
      position: 'absolute',
    };

    // Horizontal alignment
    switch (object.horizontalAlign) {
      case 'left':
        style.left = `${object.offsetX || 0}px`;
        break;
      case 'right':
        style.right = `${-(object.offsetX || 0)}px`;
        break;
      case 'center':
      default:
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        style.marginLeft = `${object.offsetX || 0}px`;
        break;
    }

    // Vertical alignment
    switch (object.verticalAlign) {
      case 'top':
        style.top = `${object.offsetY || 0}px`;
        break;
      case 'bottom':
        style.bottom = `${-(object.offsetY || 0)}px`;
        break;
      case 'middle':
      default:
        style.top = '50%';
        if (style.transform) {
          style.transform = 'translate(-50%, -50%)';
        } else {
          style.transform = 'translateY(-50%)';
        }
        style.marginTop = `${object.offsetY || 0}px`;
        break;
    }

    return style;
  };

  // Handle exit animation timing
  useEffect(() => {
    setAnimationPhase('in');

    // After animation in completes, set to visible
    const inDuration = (object.animationInDelay || 0) + (object.animationInDuration || 500);
    const visibleTimer = setTimeout(() => {
      setAnimationPhase('visible');
    }, inDuration);

    // If there's an exit animation, schedule it
    if (object.animationOut && object.animationOutDelay != null) {
      const outTimer = setTimeout(() => {
        setAnimationPhase('out');
      }, object.animationOutDelay);

      const hideTimer = setTimeout(() => {
        if (!object.stayOnScreen) {
          setAnimationPhase('hidden');
        }
      }, object.animationOutDelay + (object.animationOutDuration || 500));

      return () => {
        clearTimeout(visibleTimer);
        clearTimeout(outTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(visibleTimer);
  }, [slideIndex, object]);

  // Don't render if hidden
  if (animationPhase === 'hidden') return null;

  // Get animation class and style
  const getAnimationProps = () => {
    if (animationPhase === 'in') {
      return {
        className: `slideshow-animate slideshow-${object.animationIn || 'fadeIn'}`,
        style: {
          animationDuration: `${object.animationInDuration || 500}ms`,
          animationDelay: `${object.animationInDelay || 0}ms`,
        }
      };
    } else if (animationPhase === 'out' && object.animationOut) {
      return {
        className: `slideshow-animate slideshow-${object.animationOut}`,
        style: {
          animationDuration: `${object.animationOutDuration || 500}ms`,
          animationDelay: '0ms',
        }
      };
    }
    return { className: '', style: {} };
  };

  const animProps = getAnimationProps();
  const posStyle = getPositionStyle();

  // Render based on object type
  if (object.objectType === 'text') {
    const fontSize = props.fontSize || 'text-4xl';
    const fontWeight = props.fontWeight || 'font-bold';
    const color = props.color || 'white';

    return (
      <div
        key={`${object.slideObjectId}-${slideIndex}`}
        className={`${animProps.className} ${fontSize} ${fontWeight}`}
        style={{
          ...posStyle,
          ...animProps.style,
          color,
          textAlign: props.textAlign || 'center',
          maxWidth: props.maxWidth || '80%',
        }}
      >
        {props.text}
      </div>
    );
  }

  if (object.objectType === 'image') {
    const imageUrl = props.imageUrl || props.url;
    if (!imageUrl) return null;

    const width = props.width || 'auto';
    const height = props.height || 'auto';

    return (
      <img
        key={`${object.slideObjectId}-${slideIndex}`}
        src={getAssetUrl(imageUrl)}
        alt={props.alt || ''}
        className={`${animProps.className} ${props.borderRadius || 'rounded-lg'} ${props.shadow || ''}`}
        style={{
          ...posStyle,
          ...animProps.style,
          width,
          height,
          objectFit: props.objectFit || 'cover',
        }}
      />
    );
  }

  if (object.objectType === 'video') {
    const videoUrl = props.videoUrl || props.url;
    if (!videoUrl) return null;

    return (
      <video
        key={`${object.slideObjectId}-${slideIndex}`}
        src={getAssetUrl(videoUrl)}
        className={`${animProps.className} ${props.borderRadius || 'rounded-lg'}`}
        style={{
          ...posStyle,
          ...animProps.style,
          width: props.width || 'auto',
          height: props.height || 'auto',
        }}
        autoPlay={props.autoPlay !== false}
        muted={props.muted !== false}
        loop={props.loop !== false}
        playsInline
      />
    );
  }

  return null;
}

// Slide Image Component (Legacy)
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
