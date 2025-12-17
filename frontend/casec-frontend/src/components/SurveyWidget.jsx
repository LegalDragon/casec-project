import { useState, useEffect, useMemo } from 'react';
import { surveysAPI } from '../services/api';
import { ClipboardList, ChevronRight, ChevronLeft, Check, Star, Lock, AlertCircle } from 'lucide-react';

export default function SurveyWidget({ surveyId, featured = false, onComplete }) {
  const [survey, setSurvey] = useState(null);
  const [response, setResponse] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [surveyId, featured]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      setError(null);

      let surveyResponse;
      if (featured) {
        surveyResponse = await surveysAPI.getFeatured();
      } else if (surveyId) {
        surveyResponse = await surveysAPI.getById(surveyId);
      }

      if (surveyResponse?.data) {
        setSurvey(surveyResponse.data);

        // Check for existing response
        const existingResponse = await surveysAPI.getMyResponse(surveyResponse.data.surveyId);
        if (existingResponse?.data) {
          setResponse(existingResponse.data);
          setStarted(true);
          setCurrentIndex(existingResponse.data.currentQuestionIndex || 0);

          // Restore answers
          const savedAnswers = {};
          existingResponse.data.answers?.forEach(a => {
            savedAnswers[a.questionId] = {
              selectedOption: a.selectedOption,
              selectedOptions: a.selectedOptions || [],
              ratingValue: a.ratingValue,
              textValue: a.textValue,
              numberValue: a.numberValue,
              dateValue: a.dateValue,
            };
          });
          setAnswers(savedAnswers);

          if (existingResponse.data.status === 'Completed') {
            setCompleted(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching survey:', err);
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const questions = useMemo(() => {
    if (!survey?.questions) return [];
    return survey.questions;
  }, [survey]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const startSurvey = async () => {
    try {
      setSubmitting(true);
      const result = await surveysAPI.startSurvey(survey.surveyId, { isAnonymous });
      setResponse(result.data);
      setStarted(true);
    } catch (err) {
      setError(err.message || 'Failed to start survey');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (questionId, answer) => {
    if (!response) return;

    // Update local state immediately
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    try {
      const payload = {
        questionId,
        selectedOption: answer.selectedOption || null,
        selectedOptions: answer.selectedOptions?.length > 0 ? answer.selectedOptions : null,
        ratingValue: answer.ratingValue || null,
        textValue: answer.textValue || null,
        numberValue: answer.numberValue || null,
        dateValue: answer.dateValue || null,
      };

      await surveysAPI.submitAnswer(survey.surveyId, payload);
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Don't show error for individual answers, just log it
    }
  };

  const handleNext = async () => {
    // Submit current answer first
    if (currentQuestion && answers[currentQuestion.questionId]) {
      await submitAnswer(currentQuestion.questionId, answers[currentQuestion.questionId]);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete survey
      try {
        setSubmitting(true);
        const result = await surveysAPI.completeSurvey(survey.surveyId);
        setCompleted(true);
        onComplete?.(result.data);
      } catch (err) {
        setError(err.message || 'Failed to complete survey');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleAnswerChange = (value) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionId]: value,
    }));
  };

  const isCurrentAnswered = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.questionId];
    if (!answer) return false;

    switch (currentQuestion.questionType) {
      case 'SingleChoice':
        return !!answer.selectedOption;
      case 'MultipleChoice':
        return answer.selectedOptions?.length > 0;
      case 'Rating':
        return answer.ratingValue != null;
      case 'Text':
      case 'TextArea':
      case 'Email':
      case 'Phone':
        return !!answer.textValue?.trim();
      case 'Number':
        return answer.numberValue != null;
      case 'Date':
        return !!answer.dateValue;
      default:
        return false;
    }
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.isRequired && !isCurrentAnswered()) return false;
    return true;
  };

  // Don't render if no survey
  if (!loading && !survey) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">{survey.thankYouMessage || 'Your response has been recorded.'}</p>
      </div>
    );
  }

  // Not started - show intro
  if (!started) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{survey.title}</h3>
            <p className="text-sm text-gray-500">{questions.length} questions</p>
          </div>
        </div>

        {survey.description && (
          <p className="text-gray-600 mb-4">{survey.description}</p>
        )}

        {survey.allowAnonymous && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">Submit anonymously</span>
          </label>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={startSurvey}
          disabled={submitting}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
          ) : (
            <>
              Start Survey
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    );
  }

  // Survey in progress
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Progress bar */}
      {survey.showProgressBar && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{survey.title}</h3>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Question */}
        {currentQuestion && (
          <div className="mb-6">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg font-medium text-gray-900">
                {currentQuestion.questionText}
              </span>
              {currentQuestion.isRequired && (
                <span className="text-red-500">*</span>
              )}
            </div>
            {currentQuestion.helpText && (
              <p className="text-sm text-gray-500 mb-4">{currentQuestion.helpText}</p>
            )}

            {/* Answer input based on type */}
            <div className="mt-4">
              {currentQuestion.questionType === 'SingleChoice' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.questionId]?.selectedOption === option
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${currentQuestion.questionId}`}
                        checked={answers[currentQuestion.questionId]?.selectedOption === option}
                        onChange={() => handleAnswerChange({ selectedOption: option })}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.questionType === 'MultipleChoice' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, i) => {
                    const selected = answers[currentQuestion.questionId]?.selectedOptions || [];
                    const isChecked = selected.includes(option);
                    const maxReached = currentQuestion.maxSelections &&
                      selected.length >= currentQuestion.maxSelections && !isChecked;

                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-primary bg-primary/5'
                            : maxReached
                              ? 'border-gray-200 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={maxReached}
                          onChange={() => {
                            const newSelected = isChecked
                              ? selected.filter(s => s !== option)
                              : [...selected, option];
                            handleAnswerChange({ selectedOptions: newSelected });
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                  {currentQuestion.maxSelections && (
                    <p className="text-sm text-gray-500">
                      Select up to {currentQuestion.maxSelections} options
                    </p>
                  )}
                </div>
              )}

              {currentQuestion.questionType === 'Rating' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {currentQuestion.ratingMinLabel && (
                      <span className="text-sm text-gray-500">{currentQuestion.ratingMinLabel}</span>
                    )}
                    {currentQuestion.ratingMaxLabel && (
                      <span className="text-sm text-gray-500">{currentQuestion.ratingMaxLabel}</span>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    {Array.from(
                      { length: (currentQuestion.ratingMax || 5) - (currentQuestion.ratingMin || 1) + 1 },
                      (_, i) => (currentQuestion.ratingMin || 1) + i
                    ).map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleAnswerChange({ ratingValue: value })}
                        className={`w-12 h-12 rounded-lg border-2 font-medium transition-colors ${
                          answers[currentQuestion.questionId]?.ratingValue === value
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 hover:border-primary text-gray-700'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.questionType === 'Text' && (
                <input
                  type="text"
                  value={answers[currentQuestion.questionId]?.textValue || ''}
                  onChange={e => handleAnswerChange({ textValue: e.target.value })}
                  placeholder={currentQuestion.placeholder || 'Type your answer...'}
                  maxLength={currentQuestion.maxLength || undefined}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}

              {currentQuestion.questionType === 'TextArea' && (
                <textarea
                  value={answers[currentQuestion.questionId]?.textValue || ''}
                  onChange={e => handleAnswerChange({ textValue: e.target.value })}
                  placeholder={currentQuestion.placeholder || 'Type your answer...'}
                  maxLength={currentQuestion.maxLength || undefined}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}

              {currentQuestion.questionType === 'Number' && (
                <input
                  type="number"
                  value={answers[currentQuestion.questionId]?.numberValue ?? ''}
                  onChange={e => handleAnswerChange({ numberValue: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder={currentQuestion.placeholder || 'Enter a number...'}
                  min={currentQuestion.minValue ?? undefined}
                  max={currentQuestion.maxValue ?? undefined}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}

              {currentQuestion.questionType === 'Date' && (
                <input
                  type="date"
                  value={answers[currentQuestion.questionId]?.dateValue?.split('T')[0] || ''}
                  onChange={e => handleAnswerChange({ dateValue: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}

              {currentQuestion.questionType === 'Email' && (
                <input
                  type="email"
                  value={answers[currentQuestion.questionId]?.textValue || ''}
                  onChange={e => handleAnswerChange({ textValue: e.target.value })}
                  placeholder={currentQuestion.placeholder || 'Enter your email...'}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}

              {currentQuestion.questionType === 'Phone' && (
                <input
                  type="tel"
                  value={answers[currentQuestion.questionId]?.textValue || ''}
                  onChange={e => handleAnswerChange({ textValue: e.target.value })}
                  placeholder={currentQuestion.placeholder || 'Enter your phone number...'}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || submitting}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : currentIndex === questions.length - 1 ? (
              <>
                Complete
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
