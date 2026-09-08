import { useState, useEffect, useCallback, useRef } from 'react';
import { getQuizSocketUrl } from '../services/spheraApi';

export interface QuizLiveParticipant {
  userId?: number;
  displayName: string;
  score: number;
}

export interface CurrentQuestionData {
  question: string;
  options: string[];
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  startTime: number;
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  pointsEarned: number;
}

export interface QuestionResults {
  correctIndex: number;
  leaderboard: QuizLiveParticipant[];
}

export function useQuizSocket(roomCode: string | null) {
  const [participants, setParticipants] = useState<QuizLiveParticipant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionData | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizLiveParticipant[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const [countdownActive, setCountdownActive] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const maxRetries = 3;

  const connect = useCallback(() => {
    if (!roomCode) return;
    setStatus('connecting');

    const url = getQuizSocketUrl(roomCode);
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setStatus('connected');
      reconnectCount.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'connected':
            setStatus('connected');
            break;
          case 'participants_update':
            setParticipants(data.payload.participants || []);
            break;
          case 'countdown_started':
            setCountdownActive(true);
            break;
          case 'new_question':
            setCountdownActive(false);
            setCurrentQuestion(data.payload);
            setAnswerResult(null);
            setQuestionResults(null);
            break;
          case 'answer_result':
            setAnswerResult(data.payload);
            break;
          case 'question_results':
            setQuestionResults(data.payload);
            setLeaderboard(data.payload.leaderboard || []);
            break;
          case 'quiz_finished':
            setLeaderboard(data.payload.leaderboard || []);
            setCurrentQuestion(null);
            setStatus('connected'); // keeps it connected but we know it's finished by state in components
            break;
          case 'error':
            console.error('Quiz socket error:', data.payload.message);
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.current.onclose = () => {
      setStatus('disconnected');
      if (reconnectCount.current < maxRetries) {
        reconnectCount.current++;
        setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectCount.current), 5000));
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [roomCode]);

  useEffect(() => {
    if (roomCode) {
      connect();
    }
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomCode, connect]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not open');
    }
  }, []);

  const joinRoom = useCallback((displayName: string, userId?: number) => {
    sendMessage('join', { displayName, userId });
  }, [sendMessage]);

  const startCountdown = useCallback(() => {
    sendMessage('start_countdown');
  }, [sendMessage]);

  const startQuiz = useCallback(() => {
    sendMessage('start_quiz');
  }, [sendMessage]);

  const submitAnswer = useCallback((questionIndex: number, selectedIndex: number, timeToAnswer: number) => {
    sendMessage('submit_answer', { questionIndex, selectedIndex, timeToAnswer });
  }, [sendMessage]);

  const nextQuestion = useCallback(() => {
    sendMessage('next_question');
  }, [sendMessage]);

  return {
    participants,
    currentQuestion,
    answerResult,
    questionResults,
    leaderboard,
    status,
    countdownActive,
    joinRoom,
    startCountdown,
    startQuiz,
    submitAnswer,
    nextQuestion,
  };
}
