import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, Play } from 'lucide-react';
import { slideShowsAPI, getAssetUrl } from '../services/api';
import './SlideShow.css';

// YouTube URL detection and parsing utilities
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  // Handle youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  // Handle youtube.com/watch?v=VIDEO_ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return longMatch[1];
  // Handle youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
};

// Get the proper video source - either asset URL or original YouTube URL
const getVideoSource = (url) => {
  if (!url) return null;
  if (isYouTubeUrl(url)) return url; // Keep YouTube URLs as-is
  return getAssetUrl(url); // Convert asset paths to full URLs
};

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
  const [videoReady, setVideoReady] = useState(false);

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

  // Get background video URL for a specific slide
  const getSlideBackgroundVideoUrl = useCallback((slide, slideIdx) => {
    if (!slide) return null;
    const bgType = slide.backgroundType || 'heroVideos';
    if (bgType !== 'heroVideos') return null;

    const bgVideos = slide.backgroundVideos || [];
    if (bgVideos.length > 0) {
      return bgVideos[0]?.video?.url || bgVideos[0]?.videoUrl || null;
    }
    if (slide.useRandomVideo || slide.useRandomHeroVideos) {
      if (sharedVideos.length > 0) {
        return sharedVideos[slideIdx % sharedVideos.length].url;
      }
    }
    return slide.videoUrl || null;
  }, [sharedVideos]);

  // Preload next slide's assets
  useEffect(() => {
    if (!config?.slides || currentSlideIndex >= config.slides.length - 1) return;

    const nextSlide = config.slides[currentSlideIndex + 1];
    if (!nextSlide) return;

    // Preload next slide's background video
    const nextVideoUrl = getSlideBackgroundVideoUrl(nextSlide, currentSlideIndex + 1);
    if (nextVideoUrl && !isYouTubeUrl(nextVideoUrl)) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = getAssetUrl(nextVideoUrl);
    }

    // Preload next slide's background image
    if (nextSlide.backgroundType === 'image' && nextSlide.backgroundImageUrl) {
      const img = new window.Image();
      img.src = getAssetUrl(nextSlide.backgroundImageUrl);
    }

    // Preload next slide's object images
    (nextSlide.objects || []).forEach(obj => {
      if (obj.objectType === 'image') {
        const props = typeof obj.properties === 'string' ? JSON.parse(obj.properties) : obj.properties;
        if (props?.imageUrl) {
          const img = new window.Image();
          img.src = getAssetUrl(props.imageUrl);
        }
      }
    });
  }, [currentSlideIndex, config, getSlideBackgroundVideoUrl]);

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

  // Reset video ready state when slide changes
  useEffect(() => {
    setVideoReady(false);
  }, [currentSlideIndex]);

  // Loading state with branded experience
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center z-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white"></div>
          <Play className="absolute inset-0 m-auto w-6 h-6 text-white/60" />
        </div>
        <p className="mt-4 text-white/60 text-sm animate-pulse">Loading...</p>
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
        <>
          {/* Video loading placeholder */}
          {!videoReady && !isYouTubeUrl(backgroundVideoUrl) && (
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white/60 animate-spin"></div>
              </div>
            </div>
          )}
          {isYouTubeUrl(backgroundVideoUrl) ? (
            <iframe
              key={backgroundVideoUrl}
              className="absolute inset-0 w-full h-full z-0 pointer-events-none"
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(backgroundVideoUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(backgroundVideoUrl)}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ border: 'none', transform: 'scale(1.5)', transformOrigin: 'center center' }}
              title="Background Video"
              onLoad={() => setVideoReady(true)}
            />
          ) : (
            <video
              ref={videoRef}
              key={backgroundVideoUrl}
              className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
              src={getAssetUrl(backgroundVideoUrl)}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onCanPlayThrough={(e) => {
                setVideoReady(true);
                e.target.play().catch(() => {});
              }}
              onError={(e) => console.error('[SlideShow] Video error:', e.target.error, 'src:', e.target.src)}
            />
          )}
        </>
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

      {/* Progress Indicator - larger on mobile for visibility */}
      {config.showProgress && config.slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 md:space-x-2 z-30 bg-black/20 px-3 py-2 rounded-full">
          {config.slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 md:h-1 rounded-full transition-all duration-300 ${
                index === currentSlideIndex
                  ? 'w-6 md:w-8 bg-white'
                  : index < currentSlideIndex
                    ? 'w-1.5 md:w-2 bg-white/80'
                    : 'w-1.5 md:w-2 bg-white/40'
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

      {/* Skip Button - larger touch target on mobile */}
      {config.allowSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center space-x-2 text-white/80 hover:text-white active:text-white transition-colors bg-black/30 hover:bg-black/50 active:bg-black/60 px-4 py-3 md:px-4 md:py-2 rounded-full z-30 min-w-[80px] justify-center touch-manipulation"
        >
          <span className="text-sm md:text-sm">Skip</span>
          <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      )}

      {/* Slide Counter - adjusted for mobile */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-white/60 text-xs md:text-sm z-30 bg-black/20 px-2 py-1 rounded">
        {currentSlideIndex + 1} / {config.slides.length}
      </div>
    </div>
  );
}

// SlideObject Component - renders text, image, or video with animations
// Uses wrapper pattern: outer div handles positioning, inner element handles animation
function SlideObject({ object, slideIndex }) {
  const [animationPhase, setAnimationPhase] = useState('in'); // 'in', 'visible', 'out', 'hidden'
  const props = object.properties ? (typeof object.properties === 'string' ? JSON.parse(object.properties) : object.properties) : {};

  // Calculate position style for the WRAPPER (handles positioning with transforms)
  // Uses clamp() to scale offsets on mobile (50% of original on small screens)
  const getWrapperStyle = () => {
    const style = {
      position: 'absolute',
    };

    const offsetX = object.offsetX || 0;
    const offsetY = object.offsetY || 0;
    // Scale offsets: use clamp to reduce on mobile (min 50% of value, max 100%)
    const responsiveOffsetX = offsetX !== 0 ? `clamp(${offsetX * 0.5}px, ${offsetX}px, ${offsetX}px)` : '0px';
    const responsiveOffsetY = offsetY !== 0 ? `clamp(${offsetY * 0.5}px, ${offsetY}px, ${offsetY}px)` : '0px';

    // Horizontal alignment
    switch (object.horizontalAlign) {
      case 'left':
        style.left = responsiveOffsetX;
        style.paddingLeft = '1rem'; // Safe area on mobile
        break;
      case 'right':
        style.right = offsetX !== 0 ? `clamp(${-offsetX * 0.5}px, ${-offsetX}px, ${-offsetX}px)` : '0px';
        style.paddingRight = '1rem'; // Safe area on mobile
        break;
      case 'center':
      default:
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        style.marginLeft = responsiveOffsetX;
        break;
    }

    // Vertical alignment
    switch (object.verticalAlign) {
      case 'top':
        style.top = responsiveOffsetY;
        style.paddingTop = '1rem'; // Safe area on mobile
        break;
      case 'bottom':
        style.bottom = offsetY !== 0 ? `clamp(${-offsetY * 0.5}px, ${-offsetY}px, ${-offsetY}px)` : '0px';
        style.paddingBottom = '2rem'; // Extra space for progress bar
        break;
      case 'middle':
      default:
        style.top = '50%';
        if (style.transform) {
          style.transform = 'translate(-50%, -50%)';
        } else {
          style.transform = 'translateY(-50%)';
        }
        style.marginTop = responsiveOffsetY;
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

  // Get animation class and style for the CONTENT (handles animation with its own transforms)
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
  const wrapperStyle = getWrapperStyle();

  // Render based on object type - wrapper handles position, inner element handles animation
  if (object.objectType === 'text') {
    // Map fontSize value to responsive Tailwind classes (mobile first, then desktop)
    const getResponsiveFontSize = (size) => {
      const sizeMap = {
        'xs': 'text-xs md:text-sm',
        'sm': 'text-sm md:text-base',
        'base': 'text-base md:text-lg',
        'lg': 'text-lg md:text-xl',
        'xl': 'text-xl md:text-2xl',
        '2xl': 'text-xl md:text-2xl lg:text-3xl',
        '3xl': 'text-2xl md:text-3xl lg:text-4xl',
        '4xl': 'text-2xl md:text-4xl lg:text-5xl',
        '5xl': 'text-3xl md:text-5xl lg:text-6xl',
        '6xl': 'text-4xl md:text-6xl lg:text-7xl',
        '7xl': 'text-5xl md:text-7xl lg:text-8xl',
        '8xl': 'text-6xl md:text-8xl lg:text-9xl',
      };
      return sizeMap[size] || sizeMap['4xl'];
    };
    const sizeValue = props.fontSize || '4xl';
    const fontSize = getResponsiveFontSize(sizeValue);
    // Map fontWeight value to Tailwind class (e.g., 'bold' -> 'font-bold')
    const weightValue = props.fontWeight || 'bold';
    const fontWeight = weightValue.startsWith('font-') ? weightValue : `font-${weightValue}`;
    const color = props.color || 'white';

    return (
      <div style={wrapperStyle}>
        <div
          key={`${object.slideObjectId}-${slideIndex}`}
          className={`${animProps.className} ${fontSize} ${fontWeight} px-4 md:px-0`}
          style={{
            ...animProps.style,
            color,
            textAlign: props.textAlign || 'center',
            maxWidth: props.maxWidth ? `min(${props.maxWidth}px, 90vw)` : '90vw',
          }}
        >
          {props.content || props.text}
        </div>
      </div>
    );
  }

  if (object.objectType === 'image') {
    const imageUrl = props.imageUrl || props.url;
    if (!imageUrl) return null;

    // Map size property to responsive dimensions (mobile-friendly)
    const getImageDimensions = () => {
      switch (props.size) {
        case 'small': return { width: 'min(200px, 40vw)', height: 'auto' };
        case 'medium': return { width: 'min(400px, 70vw)', height: 'auto' };
        case 'large': return { width: 'min(600px, 90vw)', height: 'auto' };
        case 'full': return { width: '100vw', height: '100vh' };
        default: return { width: props.width || 'auto', height: props.height || 'auto' };
      }
    };
    const dimensions = getImageDimensions();
    const isFull = props.size === 'full';

    // For full size, override wrapper to fill screen
    const imageWrapperStyle = isFull ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    } : wrapperStyle;

    return (
      <div style={imageWrapperStyle}>
        <img
          key={`${object.slideObjectId}-${slideIndex}`}
          src={getAssetUrl(imageUrl)}
          alt={props.alt || ''}
          className={`${animProps.className} ${isFull ? '' : (props.borderRadius || 'rounded-lg')} ${props.shadow || ''}`}
          style={{
            ...animProps.style,
            width: dimensions.width,
            height: dimensions.height,
            objectFit: 'cover',
          }}
        />
      </div>
    );
  }

  if (object.objectType === 'video') {
    const videoUrl = props.videoUrl || props.url;
    if (!videoUrl) return null;

    // Map size property to responsive dimensions (mobile-friendly)
    const getVideoDimensions = () => {
      switch (props.size) {
        case 'small': return { width: 'min(320px, 80vw)', height: 'auto', iframeHeight: '180px' };
        case 'medium': return { width: 'min(640px, 90vw)', height: 'auto', iframeHeight: '360px' };
        case 'large': return { width: 'min(960px, 95vw)', height: 'auto', iframeHeight: '540px' };
        default: return { width: props.width || 'auto', height: props.height || 'auto', iframeHeight: '360px' };
      }
    };
    const dimensions = getVideoDimensions();
    const isYouTube = isYouTubeUrl(videoUrl);
    const youtubeId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

    return (
      <div style={wrapperStyle}>
        {isYouTube ? (
          <iframe
            key={`${object.slideObjectId}-${slideIndex}`}
            className={`${animProps.className} ${props.borderRadius || 'rounded-lg'}`}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${props.autoPlay !== false ? 1 : 0}&mute=${props.muted !== false ? 1 : 0}&loop=${props.loop !== false ? 1 : 0}&playlist=${youtubeId}&controls=${props.showControls ? 1 : 0}&playsinline=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
              ...animProps.style,
              width: dimensions.width,
              height: dimensions.iframeHeight,
              border: 'none',
            }}
            title="Video"
          />
        ) : (
          <video
            key={`${object.slideObjectId}-${slideIndex}`}
            src={getAssetUrl(videoUrl)}
            className={`${animProps.className} ${props.borderRadius || 'rounded-lg'}`}
            style={{
              ...animProps.style,
              width: dimensions.width,
              height: dimensions.height,
            }}
            autoPlay={props.autoPlay !== false}
            muted={props.muted !== false}
            loop={props.loop !== false}
            playsInline
          />
        )}
      </div>
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
