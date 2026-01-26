import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import SlideShow from '../components/SlideShow';

/**
 * Public SlideShow Preview Page
 * Accessible via /preview/slideshow/:code
 */
export default function SlideShowPreview() {
  const { code } = useParams();
  const navigate = useNavigate();

  const handleComplete = () => {
    // Stay on page, allow replay
  };

  const handleClose = () => {
    // Go back or to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Invalid Preview Link</h1>
          <p className="text-gray-400">No slideshow code provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <SlideShow
        code={code}
        onComplete={handleComplete}
        onSkip={handleComplete}
      />
      <button
        onClick={handleClose}
        className="fixed top-4 left-4 z-[60] bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Close
      </button>
    </div>
  );
}
