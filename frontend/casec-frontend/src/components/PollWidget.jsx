import { useState, useEffect } from 'react';
import { BarChart3, Check, Star, MessageSquare, Lock, EyeOff } from 'lucide-react';
import { pollsAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';

export default function PollWidget({ pollId, featured = false }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [ratingValue, setRatingValue] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [wantAnonymous, setWantAnonymous] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadPoll();
  }, [pollId, featured]);

  const loadPoll = async () => {
    try {
      let response;
      if (pollId) {
        response = await pollsAPI.getById(pollId);
      } else if (featured) {
        response = await pollsAPI.getFeatured();
      } else {
        response = await pollsAPI.getActive();
        if (response.success && response.data?.length > 0) {
          response.data = response.data[0]; // Get first active poll
        }
      }

      if (response.success && response.data) {
        setPoll(response.data);
        // Restore user's previous response if any
        if (response.data.userResponse) {
          setSelectedOptions(response.data.userResponse.selectedOptionIds || []);
          setRatingValue(response.data.userResponse.ratingValue);
          setTextResponse(response.data.userResponse.textResponse || '');
          setWantAnonymous(response.data.userResponse.isAnonymous);
        }
      }
    } catch (err) {
      console.error('Failed to load poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (optionId) => {
    if (poll.pollType === 'SingleChoice') {
      setSelectedOptions([optionId]);
    } else {
      // Multiple choice
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        if (poll.maxSelections && selectedOptions.length >= poll.maxSelections) {
          return; // Max reached
        }
        setSelectedOptions([...selectedOptions, optionId]);
      }
    }
  };

  const handleVote = async () => {
    if (voting) return;

    // Validate
    if (['SingleChoice', 'MultipleChoice'].includes(poll.pollType)) {
      if (selectedOptions.length === 0) {
        alert('Please select an option');
        return;
      }
    } else if (poll.pollType === 'Rating') {
      if (ratingValue === null) {
        alert('Please select a rating');
        return;
      }
    } else if (poll.pollType === 'Text') {
      if (!textResponse.trim()) {
        alert('Please enter your response');
        return;
      }
    }

    setVoting(true);
    try {
      const response = await pollsAPI.vote(poll.pollId, {
        selectedOptionIds: selectedOptions.length > 0 ? selectedOptions : null,
        ratingValue,
        textResponse: textResponse.trim() || null,
        isAnonymous: user && wantAnonymous,
      });

      if (response.success) {
        setPoll(response.data);
      }
    } catch (err) {
      alert('Failed to submit vote: ' + (err.message || 'Please try again'));
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null; // No poll to display
  }

  const hasVoted = poll.hasVoted;
  const showResults = hasVoted && poll.showResultsToVoters;
  const canChangeVote = hasVoted && poll.allowChangeVote;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{poll.question}</h3>
          {poll.description && (
            <p className="text-gray-600 text-sm mt-1">{poll.description}</p>
          )}
        </div>
        <BarChart3 className="w-5 h-5 text-primary flex-shrink-0" />
      </div>

      {/* Voting UI */}
      {(!hasVoted || canChangeVote) && (
        <div className="space-y-4">
          {/* Single/Multiple Choice */}
          {['SingleChoice', 'MultipleChoice'].includes(poll.pollType) && (
            <div className="space-y-2">
              {poll.options.map((option) => (
                <button
                  key={option.optionId}
                  onClick={() => handleOptionToggle(option.optionId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    selectedOptions.includes(option.optionId)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOptions.includes(option.optionId)
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}>
                    {selectedOptions.includes(option.optionId) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="flex-1 text-gray-900">{option.optionText}</span>
                </button>
              ))}
              {poll.pollType === 'MultipleChoice' && poll.maxSelections && (
                <p className="text-xs text-gray-500">Select up to {poll.maxSelections} options</p>
              )}
            </div>
          )}

          {/* Rating */}
          {poll.pollType === 'Rating' && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: (poll.ratingMax || 5) - (poll.ratingMin || 1) + 1 }, (_, i) => i + (poll.ratingMin || 1)).map((value) => (
                <button
                  key={value}
                  onClick={() => setRatingValue(value)}
                  className={`p-2 rounded-lg transition-all ${
                    ratingValue === value
                      ? 'text-accent'
                      : 'text-gray-300 hover:text-accent/50'
                  }`}
                >
                  <Star className={`w-8 h-8 ${ratingValue !== null && value <= ratingValue ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          )}

          {/* Text Response */}
          {poll.pollType === 'Text' && (
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Enter your response..."
            />
          )}

          {/* Anonymous option for logged-in users */}
          {user && poll.allowAnonymous && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={wantAnonymous}
                onChange={(e) => setWantAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <EyeOff className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Submit anonymously</span>
            </label>
          )}

          {/* Submit button */}
          <button
            onClick={handleVote}
            disabled={voting}
            className="w-full btn btn-primary"
          >
            {voting ? 'Submitting...' : hasVoted ? 'Update Vote' : 'Submit Vote'}
          </button>

          {/* Login hint for guest users on members-only polls */}
          {poll.visibility === 'MembersOnly' && !user && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Lock className="w-4 h-4" />
              <a href="/login" className="text-primary hover:underline">Log in</a> to vote on this poll
            </p>
          )}
        </div>
      )}

      {/* Results UI */}
      {showResults && (
        <div className="space-y-4">
          {/* Choice results */}
          {['SingleChoice', 'MultipleChoice'].includes(poll.pollType) && (
            <div className="space-y-3">
              {poll.options.map((option) => {
                const isSelected = poll.userResponse?.selectedOptionIds?.includes(option.optionId);
                return (
                  <div key={option.optionId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={`flex items-center gap-2 ${isSelected ? 'font-medium text-primary' : 'text-gray-700'}`}>
                        {isSelected && <Check className="w-4 h-4" />}
                        {option.optionText}
                      </span>
                      <span className="text-gray-500">{option.voteCount} ({option.percentage || 0}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isSelected ? 'bg-primary' : 'bg-gray-300'}`}
                        style={{ width: `${option.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rating result */}
          {poll.pollType === 'Rating' && poll.userResponse?.ratingValue && (
            <div className="text-center">
              <p className="text-gray-600 mb-2">Your rating:</p>
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: (poll.ratingMax || 5) - (poll.ratingMin || 1) + 1 }, (_, i) => i + (poll.ratingMin || 1)).map((value) => (
                  <Star
                    key={value}
                    className={`w-6 h-6 ${value <= poll.userResponse.ratingValue ? 'text-accent fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Text response confirmation */}
          {poll.pollType === 'Text' && poll.userResponse?.textResponse && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Your response:
              </p>
              <p className="text-gray-900">{poll.userResponse.textResponse}</p>
            </div>
          )}

          {/* Total responses */}
          {poll.totalResponses !== null && (
            <p className="text-sm text-gray-500 text-center">
              {poll.totalResponses} {poll.totalResponses === 1 ? 'response' : 'responses'}
            </p>
          )}

          {/* Change vote button */}
          {canChangeVote && (
            <p className="text-sm text-center">
              <button
                onClick={() => {/* Already showing form */}}
                className="text-primary hover:underline"
              >
                Change your vote
              </button>
            </p>
          )}
        </div>
      )}

      {/* Thank you message when voted and no results shown */}
      {hasVoted && !showResults && (
        <div className="text-center py-4">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-900 font-medium">Thank you for your response!</p>
          {poll.userResponse?.isAnonymous && (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
              <EyeOff className="w-4 h-4" />
              Submitted anonymously
            </p>
          )}
        </div>
      )}
    </div>
  );
}
