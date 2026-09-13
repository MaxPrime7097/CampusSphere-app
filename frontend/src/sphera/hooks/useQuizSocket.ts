import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuizSocketUrl } from '../services/quizLiveService';
import type { QuizLiveParticipant, CurrentQuestionData, AnswerResult, QuestionResults } from '../types/quizLive.types';

export const useQuizSocket = (roomCode: string | null) => {
  const [participants, setParticipants] = useState<QuizLiveParticipant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionData | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizLiveParticipant[]>([]);
  const [status, setStatus] = useState<'CONNECTING' | 'WAITING' | 'ACTIVE' | 'QUESTION_ACTIVE' | 'QUESTION_RESULTS' | 'FINISHED' | 'DISCONNECTED'>('CONNECTING');
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const connect = useCallback(() => {
    if (!roomCode) return;

    const token = localStorage.getItem('access');
    let url = getQuizSocketUrl(roomCode);
    if (token) {
      url += `?token=${token}`;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Quiz socket connected');
      setIsConnected(true);
      setStatus('WAITING');
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Error parsing socket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('DISCONNECTED');
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        setTimeout(connect, 1000 * retryCount.current); // Backoff
      }
    };

    ws.onerror = (error) => {
      console.error('Quiz socket error:', error);
    };

    socketRef.current = ws;
  }, [roomCode]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const handleMessage = (data: any) => {
    switch (data.type) {
      case 'participants_update':
        setParticipants(data.payload.participants);
        break;
      case 'quiz_started':
        setStatus('ACTIVE');
        break;
      case 'question_started':
        setCurrentQuestion(data.payload);
        setAnswerResult(null);
        setQuestionResults(null);
        setStatus('QUESTION_ACTIVE');
        break;
      case 'answer_result':
        setAnswerResult(data.payload);
        break;
      case 'question_results':
        setQuestionResults(data.payload);
        setLeaderboard(data.payload.leaderboard);
        setStatus('QUESTION_RESULTS');
        break;
      case 'quiz_finished':
        setLeaderboard(data.payload.leaderboard);
        setStatus('FINISHED');
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (type: string, payload?: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const joinRoom = (displayName: string, userId?: number | null) => {
    sendMessage('join', { displayName, userId });
  };

  const startQuiz = () => {
    sendMessage('start_quiz');
  };

  const submitAnswer = (questionIndex: number, selectedIndex: number, timeToAnswer: number) => {
    sendMessage('submit_answer', { questionIndex, selectedIndex, timeToAnswer });
  };

  const nextQuestion = () => {
    sendMessage('next_question');
  };

  return {
    participants,
    currentQuestion,
    answerResult,
    questionResults,
    leaderboard,
    status,
    isConnected,
    joinRoom,
    startQuiz,
    submitAnswer,
    nextQuestion,
  };
};
