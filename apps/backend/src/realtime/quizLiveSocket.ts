import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { prisma } from "../lib/prisma.js";
import { publishFrame, quizRoomChannel, subscribe } from "./hub.js";

export const quizLiveWss = new WebSocketServer({ noServer: true });

interface LiveSocket extends WebSocket {
    isAlive?: boolean;
}

interface ParticipantInfo {
    userId?: number;
    displayName: string;
    score: number;
    id?: number;
}

interface RoomState {
    sessionId?: number;
    hostId?: number;
    title?: string;
    questions?: any[];
    status?: "WAITING" | "QUESTION_ACTIVE" | "QUESTION_RESULTS" | "FINISHED";
    currentQuestionIndex: number;
    questionStartTime: number;
    sockets: Map<WebSocket, ParticipantInfo>;
    hostSocket: WebSocket | null;
    timers: NodeJS.Timeout[];
    answeredQuestions: Map<WebSocket, Set<number>>;
    answeredParticipants: Map<number, Set<number>>;
}

const roomStates = new Map<string, RoomState>();

function clearRoomTimers(state: { timers: NodeJS.Timeout[] }) {
    for (const timer of state.timers) {
        clearTimeout(timer);
    }
    state.timers = [];
}

function getRoomState(roomCode: string): RoomState {
    if (!roomStates.has(roomCode)) {
        roomStates.set(roomCode, {
            sockets: new Map(),
            hostSocket: null,
            timers: [],
            answeredQuestions: new Map(),
            answeredParticipants: new Map(),
            currentQuestionIndex: -1,
            questionStartTime: 0,
        });
    }
    return roomStates.get(roomCode)!;
}

function isHostAuthorized(ws: WebSocket, state: RoomState): boolean {
    if (ws === state.hostSocket) return true;
    const socketInfo = state.sockets.get(ws);
    if (!socketInfo) return false;
    if (socketInfo.displayName === "Hôte") {
        state.hostSocket = ws;
        return true;
    }
    if (typeof state.hostId === "number" && socketInfo.userId === state.hostId) {
        state.hostSocket = ws;
        return true;
    }
    return false;
}

function broadcastToRoom(roomCode: string, message: any) {
    // publishFrame delivers locally to all room sockets on this instance
    // and broadcasts across instances via Redis pub/sub.
    publishFrame(quizRoomChannel(roomCode), message);
}

function sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

async function sendNextQuestion(roomCode: string, session: any, questionIndex: number) {
    const state = getRoomState(roomCode);
    const questions = (state.questions && state.questions.length > 0) ? state.questions : (session.questions as any[]);
    state.questions = questions;
    state.status = "QUESTION_ACTIVE";
    state.currentQuestionIndex = questionIndex;
    state.questionStartTime = Date.now();

    const q = questions[questionIndex];
    if (!q) return;

    const timeLimit = typeof q.timeLimit === "number" && q.timeLimit > 0 ? q.timeLimit : 30;
    const points = typeof q.points === "number" && q.points > 0 ? q.points : 1000;
    
    broadcastToRoom(roomCode, {
        type: "new_question",
        payload: {
            questionIndex: questionIndex,
            question: q.question,
            options: q.options,
            timeLimit: timeLimit,
            points: points,
            totalQuestions: questions.length
        }
    });
    
    clearRoomTimers(state);
    const timer = setTimeout(async () => {
        state.status = "QUESTION_RESULTS";

        // Persist status asynchronously to DB
        prisma.quizLiveSession.update({
            where: { roomCode },
            data: { status: "QUESTION_RESULTS" }
        }).catch(err => console.error("Error setting QUESTION_RESULTS:", err));

        const leaderboard = await prisma.quizLiveParticipant.findMany({
            where: { sessionId: session.id },
            orderBy: { score: "desc" },
            select: { displayName: true, score: true, userId: true }
        });
        
        broadcastToRoom(roomCode, {
            type: "question_results",
            payload: {
                correctIndex: q.correctIndex,
                leaderboard
            }
        });
    }, timeLimit * 1000);
    state.timers.push(timer);
}

export function handleQuizLiveUpgrade(
    request: IncomingMessage,
    socket: any,
    head: Buffer,
    wss: WebSocketServer,
    roomCode: string
) {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, roomCode);
    });
}

quizLiveWss.on("connection", (ws: LiveSocket, _request: IncomingMessage, rawRoomCode: string) => {
    let participantId: number | undefined;
    const roomCode = (rawRoomCode || "").toUpperCase().trim();
    const unsubscribeRedis = subscribe(quizRoomChannel(roomCode), ws);

    // Heartbeat ping/pong tracking to prevent cloud proxies dropping idle connections
    ws.isAlive = true;
    ws.on("pong", () => {
        ws.isAlive = true;
    });

    ws.on("message", async (data: string) => {
        try {
            const parsed = JSON.parse(data.toString());
            const type = parsed.type;
            const payload = parsed.payload || {};

            const state = getRoomState(roomCode);

            if (type === "join") {
                const { displayName, userId, role } = payload;
                const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                
                if (!session) {
                    sendToClient(ws, { type: "error", payload: { message: "Room not found" } });
                    return;
                }

                // Cache session details in room state
                state.sessionId = session.id;
                state.hostId = session.hostId;
                state.title = session.title;
                state.status = session.status as any;
                state.questions = session.questions as any[];
                if (state.currentQuestionIndex === -1 && session.currentQuestionIndex >= 0) {
                    state.currentQuestionIndex = session.currentQuestionIndex;
                }

                const parsedUserId = typeof userId === "number" && !isNaN(userId)
                    ? userId
                    : (typeof userId === "string" && !isNaN(parseInt(userId, 10)) ? parseInt(userId, 10) : null);

                // Disambiguate host vs participant:
                // Only treat as host if role is explicitly 'host' or (no role specified AND userId matches hostId)
                const isHost = role === "host" || (!role && parsedUserId !== null && session.hostId === parsedUserId);

                if (isHost) {
                    state.hostSocket = ws;
                    state.sockets.set(ws, {
                        userId: parsedUserId ?? undefined,
                        displayName: displayName || "Hôte",
                        score: 0
                    });
                    sendToClient(ws, { type: "connected", payload: { roomCode, sessionId: session.id } });
                    
                    const allParticipants = await prisma.quizLiveParticipant.findMany({
                        where: { sessionId: session.id },
                        select: { id: true, displayName: true, score: true, userId: true },
                        orderBy: { id: "asc" }
                    });
                    sendToClient(ws, {
                        type: "participants_update",
                        payload: { participants: allParticipants }
                    });

                    // Host reconnection recovery
                    if (state.status === "QUESTION_ACTIVE" && state.currentQuestionIndex >= 0) {
                        const q = state.questions?.[state.currentQuestionIndex];
                        if (q) {
                            const elapsedSec = state.questionStartTime ? Math.floor((Date.now() - state.questionStartTime) / 1000) : 0;
                            const remaining = Math.max(1, (q.timeLimit || 30) - elapsedSec);
                            sendToClient(ws, {
                                type: "new_question",
                                payload: {
                                    questionIndex: state.currentQuestionIndex,
                                    question: q.question,
                                    options: q.options,
                                    timeLimit: remaining,
                                    points: q.points || 1000,
                                    totalQuestions: state.questions!.length
                                }
                            });
                        }
                    } else if (state.status === "QUESTION_RESULTS" && state.currentQuestionIndex >= 0) {
                        const q = state.questions?.[state.currentQuestionIndex];
                        if (q) {
                            sendToClient(ws, {
                                type: "new_question",
                                payload: {
                                    questionIndex: state.currentQuestionIndex,
                                    question: q.question,
                                    options: q.options,
                                    timeLimit: 0,
                                    points: q.points || 1000,
                                    totalQuestions: state.questions!.length
                                }
                            });
                            const leaderboard = await prisma.quizLiveParticipant.findMany({
                                where: { sessionId: session.id },
                                orderBy: { score: "desc" },
                                select: { displayName: true, score: true, userId: true }
                            });
                            sendToClient(ws, {
                                type: "question_results",
                                payload: {
                                    correctIndex: q.correctIndex,
                                    leaderboard
                                }
                            });
                        }
                    }
                    return;
                }

                // If joining as participant
                const safeDisplayName = (displayName && typeof displayName === "string" && displayName.trim())
                    ? displayName.trim().slice(0, 30)
                    : (parsedUserId ? `Joueur #${parsedUserId}` : "Joueur");

                let participant = parsedUserId
                    ? await prisma.quizLiveParticipant.findFirst({
                        where: { sessionId: session.id, userId: parsedUserId }
                    })
                    : await prisma.quizLiveParticipant.findFirst({
                        where: { sessionId: session.id, userId: null, displayName: safeDisplayName }
                    });

                if (!participant) {
                    participant = await prisma.quizLiveParticipant.create({
                        data: {
                            sessionId: session.id,
                            userId: parsedUserId,
                            displayName: safeDisplayName,
                        }
                    });
                }
                
                participantId = participant.id;
                state.sockets.set(ws, {
                    userId: parsedUserId ?? undefined,
                    displayName: participant.displayName,
                    score: participant.score,
                    id: participant.id
                });

                sendToClient(ws, { type: "connected", payload: { roomCode, sessionId: session.id } });

                // Broadcast updated participants list
                const allParticipants = await prisma.quizLiveParticipant.findMany({
                    where: { sessionId: session.id },
                    select: { id: true, displayName: true, score: true, userId: true },
                    orderBy: { id: "asc" }
                });

                broadcastToRoom(roomCode, {
                    type: "participants_update",
                    payload: { participants: allParticipants }
                });

                // Seamless participant reconnection recovery:
                if (state.status === "QUESTION_ACTIVE" && state.currentQuestionIndex >= 0) {
                    const q = state.questions?.[state.currentQuestionIndex];
                    if (q) {
                        const elapsedSec = state.questionStartTime ? Math.floor((Date.now() - state.questionStartTime) / 1000) : 0;
                        const remaining = Math.max(1, (q.timeLimit || 30) - elapsedSec);
                        sendToClient(ws, {
                            type: "new_question",
                            payload: {
                                questionIndex: state.currentQuestionIndex,
                                question: q.question,
                                options: q.options,
                                timeLimit: remaining,
                                points: q.points || 1000,
                                totalQuestions: state.questions!.length
                            }
                        });
                    }
                } else if (state.status === "QUESTION_RESULTS" && state.currentQuestionIndex >= 0) {
                    const q = state.questions?.[state.currentQuestionIndex];
                    if (q) {
                        sendToClient(ws, {
                            type: "new_question",
                            payload: {
                                questionIndex: state.currentQuestionIndex,
                                question: q.question,
                                options: q.options,
                                timeLimit: 0,
                                points: q.points || 1000,
                                totalQuestions: state.questions!.length
                            }
                        });
                        const leaderboard = await prisma.quizLiveParticipant.findMany({
                            where: { sessionId: session.id },
                            orderBy: { score: "desc" },
                            select: { displayName: true, score: true, userId: true }
                        });
                        sendToClient(ws, {
                            type: "question_results",
                            payload: {
                                correctIndex: q.correctIndex,
                                leaderboard
                            }
                        });
                    }
                } else if (state.status === "FINISHED") {
                    const leaderboard = await prisma.quizLiveParticipant.findMany({
                        where: { sessionId: session.id },
                        orderBy: { score: "desc" },
                        select: { displayName: true, score: true, userId: true }
                    });
                    sendToClient(ws, {
                        type: "quiz_finished",
                        payload: { leaderboard }
                    });
                }
            } else if (type === "start_countdown") {
                 if (!isHostAuthorized(ws, state)) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can start the countdown" } });
                     return;
                 }
                 broadcastToRoom(roomCode, {
                     type: "countdown_started",
                     payload: { duration: 3 }
                 });
            } else if (type === "start_quiz") {
                 if (!isHostAuthorized(ws, state)) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can start the quiz" } });
                     return;
                 }
                 state.status = "QUESTION_ACTIVE";
                 state.currentQuestionIndex = 0;
                 state.answeredQuestions.clear();
                 state.answeredParticipants.clear();

                 // Update DB status asynchronously
                 prisma.quizLiveSession.update({
                     where: { roomCode },
                     data: { status: "QUESTION_ACTIVE", currentQuestionIndex: 0 }
                 }).catch(err => console.error("Error setting session QUESTION_ACTIVE:", err));
                 
                 const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                 if (session) {
                     state.sessionId = session.id;
                     state.questions = session.questions as any[];
                     await sendNextQuestion(roomCode, session, 0);
                 }

            } else if (type === "submit_answer") {
                const { questionIndex, selectedIndex } = payload;
                if (state.currentQuestionIndex !== questionIndex || state.status !== "QUESTION_ACTIVE") {
                    return;
                }

                // Prevent duplicate answer submissions
                const answered = state.answeredQuestions.get(ws) ?? new Set<number>();
                if (answered.has(questionIndex)) return;
                if (participantId) {
                    const pAnswered = state.answeredParticipants.get(participantId) ?? new Set<number>();
                    if (pAnswered.has(questionIndex)) return;
                    pAnswered.add(questionIndex);
                    state.answeredParticipants.set(participantId, pAnswered);
                }
                answered.add(questionIndex);
                state.answeredQuestions.set(ws, answered);

                const questions = state.questions || [];
                const q = questions[questionIndex];
                if (!q) return;

                const isCorrect = q.correctIndex === selectedIndex;
                let points = 0;
                if (isCorrect) {
                     points = typeof q.points === "number" && q.points > 0 ? q.points : 1000;
                }

                const currentInfo = state.sockets.get(ws);
                if (currentInfo) {
                    currentInfo.score += points;
                }

                // Ultra-low latency response sent to participant immediately (<2ms)
                sendToClient(ws, {
                    type: "answer_result",
                    payload: { correct: isCorrect, pointsEarned: points, correctIndex: q.correctIndex }
                });

                // Non-blocking asynchronous database update
                if (participantId && points > 0) {
                    prisma.quizLiveParticipant.update({
                        where: { id: participantId },
                        data: { score: { increment: points } }
                    }).catch(err => console.error("Error saving participant score:", err));
                }

            } else if (type === "stop_quiz") {
                 if (!isHostAuthorized(ws, state)) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can stop the quiz" } });
                     return;
                 }
                 clearRoomTimers(state);
                 state.answeredQuestions.clear();
                 state.answeredParticipants.clear();
                 state.status = "WAITING";
                 state.currentQuestionIndex = -1;

                 const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                 if (!session) return;

                 await prisma.quizLiveSession.update({
                     where: { roomCode },
                     data: { status: "WAITING", currentQuestionIndex: 0 }
                 });

                 await prisma.quizLiveParticipant.updateMany({
                     where: { sessionId: session.id },
                     data: { score: 0 }
                 });

                 for (const [, info] of state.sockets.entries()) {
                     info.score = 0;
                 }

                 const allParticipants = await prisma.quizLiveParticipant.findMany({
                     where: { sessionId: session.id },
                     select: { id: true, displayName: true, score: true, userId: true },
                     orderBy: { id: "asc" }
                 });

                 broadcastToRoom(roomCode, {
                     type: "quiz_stopped",
                     payload: { participants: allParticipants }
                 });

            } else if (type === "next_question") {
                 if (!isHostAuthorized(ws, state)) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can go to the next question" } });
                     return;
                 }
                 clearRoomTimers(state);
                 state.answeredQuestions.clear();
                 state.answeredParticipants.clear();

                 const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                 if (!session) return;
                 state.sessionId = session.id;
                 state.questions = session.questions as any[];
                 const questions = state.questions;
                 const nextIndex = (state.currentQuestionIndex >= 0 ? state.currentQuestionIndex : session.currentQuestionIndex) + 1;
                 
                 if (nextIndex >= questions.length) {
                     state.status = "FINISHED";
                     await prisma.quizLiveSession.update({
                         where: { roomCode },
                         data: { status: "FINISHED" }
                     });
                     
                     const allParticipants = await prisma.quizLiveParticipant.findMany({
                        where: { sessionId: session.id },
                        orderBy: { score: "desc" },
                        select: { displayName: true, score: true, userId: true }
                     });
                     
                     broadcastToRoom(roomCode, {
                         type: "quiz_finished",
                         payload: { leaderboard: allParticipants }
                     });
                 } else {
                     state.status = "QUESTION_ACTIVE";
                     state.currentQuestionIndex = nextIndex;

                     prisma.quizLiveSession.update({
                         where: { roomCode },
                         data: { status: "QUESTION_ACTIVE", currentQuestionIndex: nextIndex }
                     }).catch(err => console.error("Error setting session QUESTION_ACTIVE:", err));

                     await sendNextQuestion(roomCode, session, nextIndex);
                 }
            }
        } catch (err) {
            console.error("Quiz Live WS Error:", err);
        }
    });

    ws.on("close", () => {
        unsubscribeRedis();
        const state = getRoomState(roomCode);
        state.sockets.delete(ws);
        state.answeredQuestions.delete(ws);
        if (ws === state.hostSocket) {
            state.hostSocket = null;
        }
        if (state.sockets.size === 0) {
            clearRoomTimers(state);
            roomStates.delete(roomCode);
        }
    });

    ws.on("error", () => {
        unsubscribeRedis();
        ws.terminate();
    });
});
