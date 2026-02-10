import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, DollarSign, Building2, ChevronDown, ChevronUp, BarChart3, ClipboardList, Check } from 'lucide-react';
import { eventsAPI, pollsAPI, surveysAPI, getAssetUrl } from '../services/api';
import { useTheme } from '../components/ThemeProvider';
import PollWidget from '../components/PollWidget';
import SurveyWidget from '../components/SurveyWidget';

export default function Home() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentPastEvents, setRecentPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Temporary redirect to gala program page after 3 seconds
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/program/2026-spring-gala');
    }, 3000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  const upcomingScrollRef = useRef(null);
  const pastScrollRef = useRef(null);
  const [upcomingPaused, setUpcomingPaused] = useState(false);
  const [pastPaused, setPastPaused] = useState(false);

  // Poll and Survey collapsed state
  const [pollAnswered, setPollAnswered] = useState(false);
  const [surveyAnswered, setSurveyAnswered] = useState(false);
  const [pollCollapsed, setPollCollapsed] = useState(false);
  const [surveyCollapsed, setSurveyCollapsed] = useState(false);
  const [hasPoll, setHasPoll] = useState(false);
  const [hasSurvey, setHasSurvey] = useState(false);

  // Parse hero video URLs
  const heroVideos = useMemo(() => {
    if (!theme?.heroVideoUrls) return [];
    try {
      const videos = JSON.parse(theme.heroVideoUrls);
      return Array.isArray(videos) ? videos : [];
    } catch {
      return [];
    }
  }, [theme?.heroVideoUrls]);

  // Track current video index for sequential playback
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Auto-advance to next video every 30 seconds
  useEffect(() => {
    if (heroVideos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
    }, 30000); // 30 seconds per video

    return () => clearInterval(interval);
  }, [heroVideos.length]);

  // Current hero video URL based on index
  const heroVideoUrl = heroVideos[currentVideoIndex] || null;

  // Convert YouTube URL to embeddable format
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    let videoId = null;

    // Handle youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    }
    // Handle youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // Handle youtube.com/embed/VIDEO_ID
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }

    if (!videoId) return null;

    // Return embed URL with autoplay, mute, loop
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`;
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  // Check if URL is an uploaded asset
  const isAssetUrl = (url) => {
    return url?.startsWith('/asset/');
  };

  // Get the video info for the selected video
  const videoInfo = useMemo(() => {
    if (!heroVideoUrl) return { type: null, url: null };

    if (isAssetUrl(heroVideoUrl)) {
      return { type: 'asset', url: getAssetUrl(heroVideoUrl) };
    }

    if (isYouTubeUrl(heroVideoUrl)) {
      return { type: 'youtube', url: getYouTubeEmbedUrl(heroVideoUrl) };
    }

    // TikTok videos can't be easily embedded as background, skip for now
    return { type: null, url: null };
  }, [heroVideoUrl]);

  // Custom smooth scroll with easing
  const smoothScrollTo = useCallback((element, targetPosition, duration = 800) => {
    if (!element) return;

    const startPosition = element.scrollLeft;
    const distance = targetPosition - startPosition;
    let startTime = null;

    // Easing function - ease-in-out cubic
    const easeInOutCubic = (t) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = easeInOutCubic(progress);
      element.scrollLeft = startPosition + (distance * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }, []);

  useEffect(() => {
    fetchEvents();
    checkPollSurveyStatus();
  }, []);

  // Check if user has already answered poll/survey
  const checkPollSurveyStatus = async () => {
    try {
      // Check featured poll
      const pollRes = await pollsAPI.getFeatured();
      if (pollRes.success && pollRes.data) {
        setHasPoll(true);
        if (pollRes.data.hasVoted) {
          setPollAnswered(true);
          setPollCollapsed(true);
        }
      }
    } catch (err) {
      // No featured poll
    }

    try {
      // Check featured survey
      const surveyRes = await surveysAPI.getFeatured();
      if (surveyRes.success && surveyRes.data) {
        setHasSurvey(true);
        // Check for existing response
        const responseRes = await surveysAPI.getMyResponse(surveyRes.data.surveyId);
        if (responseRes?.data?.status === 'Completed') {
          setSurveyAnswered(true);
          setSurveyCollapsed(true);
        }
      }
    } catch (err) {
      // No featured survey
    }
  };

  // Auto-scroll for upcoming events - always animate even with 1 card
  useEffect(() => {
    if (upcomingEvents.length === 0 || upcomingPaused) return;

    const container = upcomingScrollRef.current;
    if (!container) return;

    const scrollInterval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      if (container.scrollLeft >= maxScroll - 10) {
        smoothScrollTo(container, 0, 1000);
      } else {
        const newPosition = Math.min(container.scrollLeft + 440, maxScroll);
        smoothScrollTo(container, newPosition, 800);
      }
    }, 5000);

    return () => clearInterval(scrollInterval);
  }, [upcomingEvents.length, upcomingPaused, smoothScrollTo]);

  // Auto-scroll for past events
  useEffect(() => {
    if (recentPastEvents.length === 0 || pastPaused) return;

    const container = pastScrollRef.current;
    if (!container) return;

    const scrollInterval = setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      if (container.scrollLeft >= maxScroll - 10) {
        smoothScrollTo(container, 0, 1000);
      } else {
        const newPosition = Math.min(container.scrollLeft + 440, maxScroll);
        smoothScrollTo(container, newPosition, 800);
      }
    }, 5000);

    return () => clearInterval(scrollInterval);
  }, [recentPastEvents.length, pastPaused, smoothScrollTo]);

  const fetchEvents = async () => {
    try {
      // Fetch upcoming events
      const upcomingResponse = await eventsAPI.getAll({ upcoming: true });
      const upcoming = (upcomingResponse.data || []).slice(0, 15);
      setUpcomingEvents(upcoming);

      // Fetch all events to get recent past events (sorted by most recent first)
      const allResponse = await eventsAPI.getAll({ upcoming: false });
      const now = new Date();
      const pastEvents = (allResponse.data || [])
        .filter(e => new Date(e.eventDate) < now)
        .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate)) // Most recent first
        .slice(0, 15);
      setRecentPastEvents(pastEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFee = (fee) => {
    if (!fee || fee === 0) return 'Free';
    return `$${fee}`;
  };

  const scrollLeft = (ref, amount = 440) => {
    const container = ref.current;
    if (!container) return;
    const newPosition = Math.max(container.scrollLeft - amount, 0);
    smoothScrollTo(container, newPosition, 600);
  };

  const scrollRight = (ref, amount = 440) => {
    const container = ref.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const newPosition = Math.min(container.scrollLeft + amount, maxScroll);
    smoothScrollTo(container, newPosition, 600);
  };

  // Wide horizontal card for upcoming events
  const UpcomingEventCard = ({ event }) => (
    <Link
      to={`/event/${event.eventId}`}
      className="flex-shrink-0 w-[420px] bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] flex"
    >
      {/* Thumbnail on left */}
      <div className="w-40 h-full relative bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
        {event.thumbnailUrl ? (
          <img
            src={getAssetUrl(event.thumbnailUrl)}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: `${event.thumbnailFocusX ?? 50}% ${event.thumbnailFocusY ?? 50}%` }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.target) e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-primary/30" />
          </div>
        )}
      </div>

      {/* Content on right */}
      <div className="flex-1 p-4 flex flex-col justify-between min-h-[160px]">
        <div>
          <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {event.description}
            </p>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{formatTime(event.eventDate)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {event.location && (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{formatFee(event.eventFee)}</span>
            </div>
          </div>

          {event.hostClubName && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{event.hostClubName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  // Wide horizontal card for past events (similar to upcoming)
  const PastEventCard = ({ event }) => (
    <Link
      to={`/event/${event.eventId}`}
      className="flex-shrink-0 w-[420px] bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] flex opacity-95"
    >
      {/* Thumbnail on left */}
      <div className="w-40 h-full relative bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
        {event.thumbnailUrl ? (
          <img
            src={getAssetUrl(event.thumbnailUrl)}
            alt={event.title}
            className="w-full h-full object-cover grayscale-[30%]"
            style={{ objectPosition: `${event.thumbnailFocusX ?? 50}% ${event.thumbnailFocusY ?? 50}%` }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.target) e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content on right */}
      <div className="flex-1 p-4 flex flex-col justify-between min-h-[160px]">
        <div>
          <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base leading-tight">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {event.description}
            </p>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>{formatTime(event.eventDate)}</span>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.hostClubName && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="truncate">{event.hostClubName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent flex flex-col">
      {/* Gala Invitation Banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 text-white py-6 px-6 text-center relative overflow-hidden">
        {/* Decorative lanterns/sparkles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-[10%] text-4xl">🏮</div>
          <div className="absolute top-1 left-[30%] text-3xl">✨</div>
          <div className="absolute top-3 right-[25%] text-4xl">🏮</div>
          <div className="absolute top-1 right-[10%] text-3xl">✨</div>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            🐍 You're Invited to the Year of the Snake Celebration! 🎊
          </h2>
          <p className="text-lg md:text-xl mb-3">
            Join us for CASEC's 2026 Spring Gala — an evening of culture, community, and celebration!
          </p>
          <p className="text-base opacity-90">
            Taking you to the event program in {redirectCountdown}...{' '}
            <Link to="/program/2026-spring-gala" className="underline font-semibold hover:text-yellow-300 ml-2">
              Go Now →
            </Link>
          </p>
        </div>
      </div>

      {/* Hero Section - Logo, Name, and CTAs Centered */}
      <section className="px-6 py-12 md:py-16 relative overflow-hidden">
        {/* Video Background */}
        {videoInfo.url && (
          <>
            {/* Video container */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
              {videoInfo.type === 'asset' ? (
                /* Native HTML5 video for uploaded assets */
                <video
                  key={currentVideoIndex}
                  src={videoInfo.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover"
                  style={{ minWidth: '100%', minHeight: '100%' }}
                />
              ) : (
                /* YouTube iframe for external videos */
                <iframe
                  key={currentVideoIndex}
                  src={videoInfo.url}
                  title="Hero Background Video"
                  className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 object-cover"
                  style={{ minWidth: '100%', minHeight: '100%' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              )}
            </div>
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}

        {/* Video Progress Indicators */}
        {heroVideos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20">
            {heroVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentVideoIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                title={`Video ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Large Logo with Name */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center justify-center gap-4">
              {theme?.logoUrl ? (
                <img
                  src={getAssetUrl(theme.logoUrl)}
                  alt={theme.organizationName || 'Logo'}
                  className="h-32 md:h-48 w-auto object-contain"
                />
              ) : null}
              <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white">
                {theme?.organizationName || 'CASEC'}<span className="text-accent-light">.</span>
              </h1>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link
              to="/login"
              className="px-8 py-3 text-white font-semibold text-lg border-2 border-white/50 rounded-xl hover:bg-white/10 transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-primary font-bold text-lg rounded-xl hover:bg-accent hover:text-white transition-all shadow-xl"
            >
              Join Us
            </Link>
          </div>

          {/* Inspirational Quote Block */}
          <div className="relative bg-white/25 backdrop-blur-md rounded-2xl p-8 md:p-12 border-2 border-white/40 shadow-2xl">
            {/* Decorative quote mark */}
            <div className="absolute -top-4 left-8 text-6xl text-white/30 font-serif leading-none">"</div>
            <blockquote className="text-2xl md:text-3xl font-display font-bold text-white leading-relaxed mb-4 drop-shadow-lg">
              {theme?.homeQuote || 'Building bridges across cultures, creating connections that last a lifetime.'}
            </blockquote>
            <p className="text-white text-lg font-medium drop-shadow">
              {theme?.homeQuoteSubtext || 'Join our vibrant community celebrating heritage, fostering friendships, and making memories together.'}
            </p>
          </div>
        </div>
      </section>

      {/* Events Section - Full Width Carousels */}
      <section className="py-12 bg-black/20 backdrop-blur-sm flex-1 space-y-10">
        {/* Upcoming Events Carousel */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <h3 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Upcoming Events
            </h3>
          </div>

          {loading ? (
            <div className="flex gap-4 px-6 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[420px] h-40 bg-white/20 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="relative group">
              {/* Left Arrow */}
              <button
                onClick={() => scrollLeft(upcomingScrollRef)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Scrolling Container */}
              <div
                ref={upcomingScrollRef}
                onMouseEnter={() => setUpcomingPaused(true)}
                onMouseLeave={() => setUpcomingPaused(false)}
                className="flex gap-4 px-6 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {upcomingEvents.map((event) => (
                  <UpcomingEventCard key={event.eventId} event={event} />
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollRight(upcomingScrollRef)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Gradient Edges */}
              <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-6">
              <div className="bg-white/10 rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/70">No upcoming events scheduled</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Past Events Carousel */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <h3 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Events
            </h3>
          </div>

          {loading ? (
            <div className="flex gap-4 px-6 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[420px] h-40 bg-white/20 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentPastEvents.length > 0 ? (
            <div className="relative group">
              {/* Left Arrow */}
              <button
                onClick={() => scrollLeft(pastScrollRef)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Scrolling Container */}
              <div
                ref={pastScrollRef}
                onMouseEnter={() => setPastPaused(true)}
                onMouseLeave={() => setPastPaused(false)}
                className="flex gap-4 px-6 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recentPastEvents.map((event) => (
                  <PastEventCard key={event.eventId} event={event} />
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollRight(pastScrollRef)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Gradient Edges */}
              <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-6">
              <div className="bg-white/10 rounded-xl p-8 text-center">
                <Clock className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/70">No recent events yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Featured Poll & Survey - Collapsible when answered */}
        {(hasPoll || hasSurvey) && (
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6">
            {/* Poll Section */}
            {hasPoll && (
              <div>
                {pollAnswered ? (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => setPollCollapsed(!pollCollapsed)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-gray-900">Poll Completed</span>
                          <p className="text-xs text-gray-500">Thank you for your response</p>
                        </div>
                      </div>
                      {pollCollapsed ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {!pollCollapsed && (
                      <div className="border-t">
                        <PollWidget featured />
                      </div>
                    )}
                  </div>
                ) : (
                  <PollWidget featured />
                )}
              </div>
            )}

            {/* Survey Section */}
            {hasSurvey && (
              <div>
                {surveyAnswered ? (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => setSurveyCollapsed(!surveyCollapsed)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-gray-900">Survey Completed</span>
                          <p className="text-xs text-gray-500">Thank you for your feedback</p>
                        </div>
                      </div>
                      {surveyCollapsed ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {!surveyCollapsed && (
                      <div className="border-t">
                        <SurveyWidget featured />
                      </div>
                    )}
                  </div>
                ) : (
                  <SurveyWidget featured />
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 bg-black/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} {theme?.organizationName || 'CASEC'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
