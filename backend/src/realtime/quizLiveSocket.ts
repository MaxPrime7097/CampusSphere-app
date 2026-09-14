import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { prisma } from "../lib/prisma.js";
import { publishFrame } from "./hub.js";
import { quizRoomChannel } from "./hub.js";

export const quizLiveWss = new WebSocketServer({ noServer: true });

interface ParticipantInfo {
    userId?: number;
    displayName: string;
    score: number;
    id?: number;
}

const roomStates = new Map<string, {
    sockets: Map<WebSocket, ParticipantInfo>;
    hostSocket: WebSocket | null;
    timers: NodeJS.Timeout[];
}>();

function getRoomState(roomCode: string) {
    if (!roomStates.has(roomCode)) {
        roomStates.set(roomCode, { sockets: new Map(), hostSocket: null, timers: [] });
    }
    return roomStates.get(roomCode)!;
}

function broadcastToRoom(roomCode: string, message: any) {
    const state = getRoomState(roomCode);
    const frame = JSON.stringify(message);
    
    // Broadcast locally
    for (const client of state.sockets.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(frame);
        }
    }
    
    // Broadcast globally via Redis
    publishFrame(quizRoomChannel(roomCode), frame);
}

// Ensure the client sends a frame and not a raw object
function sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

async function sendNextQuestion(roomCode: string, session: any, questionIndex: number) {
    const questions = session.questions as any[];
    const q = questions[questionIndex];
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
    
    const state = getRoomState(roomCode);
    const timer = setTimeout(async () => {
        const leaderboard = await prisma.quizLiveParticipant.findMany({
            where: { sessionId: session.id },
            orderBy: { score: "desc" },
            select: { displayName: true, score: true }
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

quizLiveWss.on("connection", (ws: WebSocket, _request: IncomingMessage, roomCode: string) => {
    let participantId: number | undefined;

    ws.on("message", async (data: string) => {
        try {
            const parsed = JSON.parse(data.toString());
            const type = parsed.type;
            const payload = parsed.payload;

            const state = getRoomState(roomCode);

            if (type === "join") {
                const { displayName, userId } = payload;
                const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                
                if (!session) {
                    sendToClient(ws, { type: "error", payload: { message: "Room not found" } });
                    return;
                }

                if (session.hostId === userId) {
                    state.hostSocket = ws;
                    state.sockets.set(ws, {
                        userId: userId,
                        displayName: displayName || "Hôte",
                        score: 0
                    });
                    sendToClient(ws, { type: "connected", payload: { roomCode, sessionId: session.id } });
                    
                    const allParticipants = await prisma.quizLiveParticipant.findMany({
                        where: { sessionId: session.id },
                        select: { id: true, displayName: true, score: true }
                    });
                    sendToClient(ws, {
                        type: "participants_update",
                        payload: { participants: allParticipants }
                    });
                    return;
                }

                // If joining as participant
                let participant = await prisma.quizLiveParticipant.findFirst({
                    where: { sessionId: session.id, userId: userId || undefined, displayName: userId ? undefined : displayName }
                });

                if (!participant) {
                    participant = await prisma.quizLiveParticipant.create({
                        data: {
                            sessionId: session.id,
                            userId: userId || null,
                            displayName,
                        }
                    });
                }
                
                participantId = participant.id;
                state.sockets.set(ws, {
                    userId: userId,
                    displayName: participant.displayName,
                    score: participant.score,
                    id: participant.id
                });

                sendToClient(ws, { type: "connected", payload: { roomCode, sessionId: session.id } });

                // Broadcast updated participants
                const allParticipants = await prisma.quizLiveParticipant.findMany({
                    where: { sessionId: session.id },
                    select: { id: true, displayName: true, score: true }
                });

                broadcastToRoom(roomCode, {
                    type: "participants_update",
                    payload: { participants: allParticipants }
                });
            } else if (type === "start_countdown") {
                 if (ws !== state.hostSocket) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can start the countdown" } });
                     return;
                 }
                 broadcastToRoom(roomCode, {
                     type: "countdown_started",
                     payload: { duration: 3 }
                 });
            } else if (type === "start_quiz") {
                 if (ws !== state.hostSocket) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can start the quiz" } });
                     return;
                 }
                 await prisma.quizLiveSession.update({
                     where: { roomCode },
                     data: { status: "QUESTION_ACTIVE", currentQuestionIndex: 0 }
                 });
                 
                 const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                 if (session) {
                     await sendNextQuestion(roomCode, session, 0);
                 }

            } else if (type === "submit_answer") {
                const { questionIndex, selectedIndex, timeToAnswer } = payload;
                const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                if (!session || session.currentQuestionIndex !== questionIndex) return;

                const questions = session.questions as any[];
                const q = questions[questionIndex];
                const isCorrect = q.correctIndex === selectedIndex;
                
                let points = 0;
                if (isCorrect) {
                     const basePoints = typeof q.points === "number" && q.points > 0 ? q.points : 1000;
                     const qTimeLimit = typeof q.timeLimit === "number" && q.timeLimit > 0 ? q.timeLimit : 30;
                     const speedFactor = Math.max(0, 1 - (timeToAnswer / qTimeLimit));
                     points = Math.round(basePoints * (0.5 + 0.5 * speedFactor));
                }

                if (participantId) {
                    await prisma.quizLiveParticipant.update({
                        where: { id: participantId },
                        data: { score: { increment: points } }
                    });
                    
                    const participant = await prisma.quizLiveParticipant.findUnique({ where: { id: participantId } });
                    if (participant) {
                        state.sockets.set(ws, {
                            ...state.sockets.get(ws)!,
                            score: participant.score
                        });
                    }
                }

                sendToClient(ws, {
                    type: "answer_result",
                    payload: { correct: isCorrect, pointsEarned: points, correctIndex: q.correctIndex }
                });

            } else if (type === "next_question") {
                 if (ws !== state.hostSocket) {
                     sendToClient(ws, { type: "error", payload: { message: "Only the host can go to the next question" } });
                     return;
                 }
                 const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                 if (!session) return;
                 const questions = session.questions as any[];
                 const nextIndex = session.currentQuestionIndex + 1;
                 
                 if (nextIndex >= questions.length) {
                     await prisma.quizLiveSession.update({
                         where: { roomCode },
                         data: { status: "FINISHED" }
                     });
                     
                     const allParticipants = await prisma.quizLiveParticipant.findMany({
                        where: { sessionId: session.id },
                        orderBy: { score: "desc" },
                        select: { displayName: true, score: true }
                     });
                     
                     broadcastToRoom(roomCode, {
                         type: "quiz_finished",
                         payload: { leaderboard: allParticipants }
                     });
                 } else {
                     await prisma.quizLiveSession.update({
                         where: { roomCode },
                         data: { status: "QUESTION_ACTIVE", currentQuestionIndex: nextIndex }
                     });
                     await sendNextQuestion(roomCode, session, nextIndex);
                 }
            }
        } catch (err) {
            console.error("Quiz Live WS Error:", err);
        }
    });

    ws.on("close", () => {
        const state = getRoomState(roomCode);
        state.sockets.delete(ws);
        if (state.sockets.size === 0) {
            roomStates.delete(roomCode);
        }
    });
});
