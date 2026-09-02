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
    timers: NodeJS.Timeout[];
}>();

function getRoomState(roomCode: string) {
    if (!roomStates.has(roomCode)) {
        roomStates.set(roomCode, { sockets: new Map(), timers: [] });
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
            } else if (type === "start_quiz") {
                 // Assume verified by checking if host
                 await prisma.quizLiveSession.update({
                     where: { roomCode },
                     data: { status: "QUESTION_ACTIVE", currentQuestionIndex: 0 }
                 });
                 
                 const session = await prisma.quizLiveSession.findUnique({ where: { roomCode } });
                 if (session) {
                     const questions = session.questions as any[];
                     const q = questions[0];
                     broadcastToRoom(roomCode, {
                         type: "new_question",
                         payload: {
                             questionIndex: 0,
                             question: q.question,
                             options: q.options,
                             timeLimit: q.timeLimit || 30,
                             totalQuestions: questions.length
                         }
                     });
                     
                     // Handle timer logic (omitted for brevity, could set a setTimeout)
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
                     points = 1000 + Math.max(0, 500 - Math.floor(timeToAnswer / 30));
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
                    payload: { isCorrect, points, correctIndex: q.correctIndex }
                });

            } else if (type === "next_question") {
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
                     const q = questions[nextIndex];
                     broadcastToRoom(roomCode, {
                         type: "new_question",
                         payload: {
                             questionIndex: nextIndex,
                             question: q.question,
                             options: q.options,
                             timeLimit: q.timeLimit || 30,
                             totalQuestions: questions.length
                         }
                     });
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
