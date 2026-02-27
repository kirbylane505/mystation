/**
 * KICKBACK LOUNGE — Black History Quiz Game
 * Gold/purple theme — solo & multiplayer
 * Props: { gameState, myPlayerId, onMove }
 * Works standalone (local state) when gameState is null/undefined
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initQuiz, submitAnswer, nextQuestion, getQuizResults, getStreakMultiplier } from '@/lib/games/quiz';
import { questions, categories } from '@/data/blackHistoryQuestions';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const REVEAL_DELAY = 3500; // ms before auto-advancing from reveal

export default function QuizGame({ gameState: serverState, myPlayerId, onMove }) {
  // Local state for solo play
  const [localState, setLocalState] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timerPercent, setTimerPercent] = useState(100);
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);
  const [animateCorrect, setAnimateCorrect] = useState(null); // index of correct answer
  const [animateWrong, setAnimateWrong] = useState(null); // index of wrong answer
  const [pointsEarned, setPointsEarned] = useState(0);
  const timerRef = useRef(null);
  const revealTimerRef = useRef(null);
  const hasAnsweredRef = useRef(false);

  // Determine which state to use
  const isLocal = !serverState;
  const state = isLocal ? localState : serverState;

  // Start a local game
  const startLocalGame = useCallback((category) => {
    const pid = myPlayerId || 'local_player';
    const newState = initQuiz([pid], { category: category === 'All Categories' ? null : category });
    setLocalState(newState);
    setSelectedAnswer(null);
    setShowDidYouKnow(false);
    setAnimateCorrect(null);
    setAnimateWrong(null);
    setPointsEarned(0);
    hasAnsweredRef.current = false;
  }, [myPlayerId]);

  // Timer countdown
  useEffect(() => {
    if (!state || state.phase !== 'question') {
      setTimerPercent(100);
      return;
    }

    const startTime = state.questionStartTime;
    const duration = state.timePerQuestion;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1 - elapsed / duration);
      setTimerPercent(remaining * 100);

      if (remaining <= 0) {
        // Time expired — auto-submit no answer and move to reveal
        if (!hasAnsweredRef.current) {
          handleTimeExpired();
        }
      }
    };

    timerRef.current = setInterval(tick, 50);
    tick();

    return () => clearInterval(timerRef.current);
  }, [state?.phase, state?.currentQuestion, state?.questionStartTime]);

  // Auto-advance from reveal phase
  useEffect(() => {
    if (!state || state.phase !== 'reveal') return;

    revealTimerRef.current = setTimeout(() => {
      advanceToNext();
    }, REVEAL_DELAY);

    return () => clearTimeout(revealTimerRef.current);
  }, [state?.phase, state?.currentQuestion]);

  // Reset selection state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowDidYouKnow(false);
    setAnimateCorrect(null);
    setAnimateWrong(null);
    setPointsEarned(0);
    hasAnsweredRef.current = false;
  }, [state?.currentQuestion]);

  // Server mode: set animations when reveal state arrives with answer visible
  useEffect(() => {
    if (!state || state.phase !== 'reveal' || isLocal) return;

    const currentQ = state.questions?.[state.currentQuestion];
    if (!currentQ || currentQ.answer === undefined) return;

    const pid = myPlayerId || 'local_player';
    const player = state.players?.[pid];
    const myAnswer = player?.answers?.find(a => a.questionId === currentQ.id);

    if (myAnswer) {
      setSelectedAnswer(myAnswer.answerIndex);
      setAnimateCorrect(currentQ.answer);
      if (!myAnswer.correct) {
        setAnimateWrong(myAnswer.answerIndex);
        setShowDidYouKnow(true);
      }
      setPointsEarned(myAnswer.points || 0);
      hasAnsweredRef.current = true;
    } else {
      // Didn't answer (time expired)
      setAnimateCorrect(currentQ.answer);
      setShowDidYouKnow(true);
      hasAnsweredRef.current = true;
    }
  }, [state?.phase, state?.currentQuestion, isLocal, myPlayerId]);

  const handleTimeExpired = useCallback(() => {
    if (hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;

    if (isLocal && localState) {
      // Move to reveal with no answer
      const revealed = nextQuestion(localState);
      setLocalState(revealed);
      setShowDidYouKnow(true);
      setAnimateCorrect(localState.questions[localState.currentQuestion].answer);
    } else if (!isLocal) {
      // Server mode — advance to reveal when time expires without answering
      onMove?.('next');
    }
  }, [isLocal, localState, onMove]);

  const handleAnswer = useCallback((answerIndex) => {
    if (!state || state.phase !== 'question' || hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;
    setSelectedAnswer(answerIndex);

    const currentQ = state.questions[state.currentQuestion];
    const correct = answerIndex === currentQ.answer;
    const pid = myPlayerId || 'local_player';

    if (isLocal) {
      // Calculate points for display
      const playerBefore = localState.players[pid];
      const updated = submitAnswer(localState, pid, answerIndex);
      const playerAfter = updated.players[pid];
      const earned = playerAfter.score - playerBefore.score;
      setPointsEarned(earned);

      // Animate
      setAnimateCorrect(currentQ.answer);
      if (!correct) {
        setAnimateWrong(answerIndex);
        setShowDidYouKnow(true);
      }

      // Move to reveal
      const revealed = nextQuestion(updated);
      setLocalState(revealed);
    } else {
      // Server mode — send move (action string + data object)
      // Animations set when reveal state arrives via broadcast
      onMove?.('answer', { answerIndex });
    }
  }, [state, isLocal, localState, myPlayerId, onMove]);

  const advanceToNext = useCallback(() => {
    if (!state) return;

    if (isLocal) {
      const next = nextQuestion(localState);
      setLocalState(next);
    } else {
      onMove?.('next');
    }
  }, [state, isLocal, localState, onMove]);

  // Timer color
  const timerColor = timerPercent > 60 ? '#22c55e' : timerPercent > 30 ? '#eab308' : '#ef4444';

  // ========== CATEGORY SELECT ==========
  if (!state) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">&#x270A;&#x1F3FF;</div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400">
            Black History Quiz
          </h2>
          <p className="text-white/50 mt-2">Test your knowledge. 10 questions. How much do you know?</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => startLocalGame('All Categories')}
            className="col-span-2 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-purple-500/20 border border-yellow-500/30 hover:border-yellow-400/60 text-white font-bold text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/20"
          >
            All Categories
            <span className="block text-sm font-normal text-white/50 mt-1">{questions.length} questions</span>
          </button>

          {categories.map((cat) => {
            const count = questions.filter(q => q.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => startLocalGame(cat)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/40 text-white font-medium transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
              >
                {cat}
                <span className="block text-xs text-white/40 mt-1">{count} questions</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const pid = myPlayerId || 'local_player';
  const player = state.players?.[pid];
  const currentQ = state.questions?.[state.currentQuestion];

  // ========== RESULTS SCREEN ==========
  if (state.phase === 'finished') {
    const results = getQuizResults(state);
    const myResult = results.find(r => r.playerId === pid) || results[0];

    return (
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {myResult.accuracy >= 80 ? '\u{1F3C6}' : myResult.accuracy >= 50 ? '\u{1F44F}' : '\u{1F4AA}'}
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400">
            Quiz Complete!
          </h2>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-purple-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-white/50 text-sm">Final Score</p>
            <p className="text-5xl font-black text-yellow-400 mt-1">{myResult.score.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{myResult.accuracy}%</p>
              <p className="text-white/40 text-xs mt-1">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{myResult.correctCount}/{myResult.totalAnswered}</p>
              <p className="text-white/40 text-xs mt-1">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{myResult.longestStreak}</p>
              <p className="text-white/40 text-xs mt-1">Best Streak</p>
            </div>
          </div>
        </div>

        {/* Leaderboard (multiplayer) */}
        {results.length > 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <h3 className="text-white font-bold text-sm mb-3">Leaderboard</h3>
            {results.map((r, i) => (
              <div
                key={r.playerId}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  r.playerId === pid ? 'bg-yellow-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/30 font-bold text-lg w-6">{i + 1}</span>
                  <span className={`text-sm ${r.playerId === pid ? 'text-yellow-400 font-bold' : 'text-white/70'}`}>
                    {r.playerId === pid ? 'You' : r.playerId.split('_')[1] || r.playerId}
                  </span>
                </div>
                <span className="text-yellow-400 font-bold">{r.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Answer Review */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <h3 className="text-white font-bold text-sm mb-3">Answer Review</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.questions.map((q, i) => {
              const answer = myResult.answers.find(a => a.questionId === q.id);
              const correct = answer?.correct;
              const answered = !!answer;
              return (
                <div key={q.id} className="flex items-start gap-2 py-1">
                  <span className={`text-sm mt-0.5 ${correct ? 'text-green-400' : 'text-red-400'}`}>
                    {correct ? '\u2713' : answered ? '\u2717' : '\u2014'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs truncate">{q.question}</p>
                    {!correct && (
                      <p className="text-green-400/60 text-xs mt-0.5">Answer: {q.choices[q.answer]}</p>
                    )}
                  </div>
                  {answer && (
                    <span className="text-yellow-400/60 text-xs shrink-0">+{answer.points}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again */}
        <button
          onClick={() => setLocalState(null)}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-purple-500 text-white font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          Play Again
        </button>
      </div>
    );
  }

  if (!currentQ) return null;

  const isReveal = state.phase === 'reveal';
  const streak = player?.streak || 0;
  const multiplier = getStreakMultiplier(streak);

  // Progress dots
  const progressDots = state.questions.map((q, i) => {
    const answer = player?.answers?.find(a => a.questionId === q.id);
    if (i < state.currentQuestion) {
      return answer?.correct ? 'correct' : 'wrong';
    }
    if (i === state.currentQuestion) return 'current';
    return 'upcoming';
  });

  // ========== QUESTION / REVEAL PHASE ==========
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Top Bar: Score + Category + Question Counter */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-yellow-400 font-bold text-xl">{(player?.score || 0).toLocaleString()}</p>
          <p className="text-white/30 text-xs">Score</p>
        </div>
        <div className="text-center">
          <p className="text-white/50 text-xs">{state.category}</p>
          <p className="text-white font-bold">
            {state.currentQuestion + 1}
            <span className="text-white/30">/{state.totalQuestions}</span>
          </p>
        </div>
        <div className="text-right">
          {streak >= 3 && (
            <p className="text-orange-400 font-bold text-sm animate-pulse">
              {'\uD83D\uDD25'} {streak}x STREAK!
            </p>
          )}
          {multiplier > 1 && (
            <p className="text-purple-400 text-xs">{multiplier}x multiplier</p>
          )}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 justify-center mb-4">
        {progressDots.map((dot, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              dot === 'correct' ? 'bg-green-400 scale-100' :
              dot === 'wrong' ? 'bg-red-400 scale-100' :
              dot === 'current' ? 'bg-yellow-400 scale-125 ring-2 ring-yellow-400/30' :
              'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Timer Bar */}
      <div className="w-full h-2 rounded-full bg-white/10 mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100 ease-linear"
          style={{
            width: `${isReveal ? 0 : timerPercent}%`,
            backgroundColor: timerColor,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-purple-500/10 to-yellow-500/5 border border-purple-500/20 rounded-2xl p-6 mb-6">
        <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
          {currentQ.category} &bull; Difficulty {'\u2B50'.repeat(currentQ.difficulty)}
        </p>
        <h3 className="text-white font-bold text-lg leading-relaxed">{currentQ.question}</h3>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6">
        {currentQ.choices.map((choice, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrectChoice = i === currentQ.answer;
          const isRevealing = isReveal || hasAnsweredRef.current;

          let borderColor = 'border-white/10';
          let bgColor = 'bg-white/5';
          let textColor = 'text-white';
          let labelBg = 'bg-white/10';
          let extraClass = '';

          if (isRevealing) {
            if (isCorrectChoice) {
              borderColor = 'border-green-400/60';
              bgColor = 'bg-green-500/15';
              textColor = 'text-green-300';
              labelBg = 'bg-green-500/30';
              if (animateCorrect === i) extraClass = 'animate-correct-pulse';
            } else if (isSelected && !isCorrectChoice) {
              borderColor = 'border-red-400/60';
              bgColor = 'bg-red-500/15';
              textColor = 'text-red-300';
              labelBg = 'bg-red-500/30';
              if (animateWrong === i) extraClass = 'animate-wrong-shake';
            } else {
              bgColor = 'bg-white/[0.02]';
              textColor = 'text-white/30';
              borderColor = 'border-white/5';
            }
          } else {
            if (isSelected) {
              borderColor = 'border-yellow-400/40';
              bgColor = 'bg-yellow-500/10';
            }
          }

          return (
            <button
              key={i}
              onClick={() => !isRevealing && handleAnswer(i)}
              disabled={isRevealing}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${borderColor} ${bgColor} ${textColor} ${extraClass} ${
                !isRevealing ? 'hover:border-yellow-400/30 hover:bg-yellow-500/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg ${labelBg} flex items-center justify-center font-bold text-sm shrink-0`}>
                {CHOICE_LABELS[i]}
              </span>
              <span className="text-left text-sm font-medium leading-snug">{choice}</span>
              {isRevealing && isCorrectChoice && (
                <span className="ml-auto text-green-400 text-lg shrink-0">{'\u2713'}</span>
              )}
              {isRevealing && isSelected && !isCorrectChoice && (
                <span className="ml-auto text-red-400 text-lg shrink-0">{'\u2717'}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Points Earned Pop */}
      {pointsEarned > 0 && isReveal && (
        <div className="text-center mb-4 animate-score-pop">
          <span className="text-yellow-400 font-black text-2xl">+{pointsEarned}</span>
          {multiplier > 1 && (
            <span className="text-purple-400 text-sm ml-2">{multiplier}x streak!</span>
          )}
        </div>
      )}

      {/* Did You Know? */}
      {showDidYouKnow && currentQ.didYouKnow && isReveal && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
          <p className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-1">Did You Know?</p>
          <p className="text-white/70 text-sm leading-relaxed">{currentQ.didYouKnow}</p>
        </div>
      )}

      {/* Manual advance button during reveal (in addition to auto-advance) */}
      {isReveal && (
        <button
          onClick={advanceToNext}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
        >
          {state.currentQuestion + 1 < state.totalQuestions ? 'Next Question' : 'See Results'}
        </button>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes correctPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          100% { transform: scale(1); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes scorePop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-correct-pulse {
          animation: correctPulse 0.6s ease-in-out;
        }
        .animate-wrong-shake {
          animation: wrongShake 0.5s ease-in-out;
        }
        .animate-score-pop {
          animation: scorePop 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
