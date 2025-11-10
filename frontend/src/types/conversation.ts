export interface Participant {
    id: string;
    name: string;
    avatar?: string;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    participants: Participant[];
    lastMessage?: string;
    lastMessageAt: string;
    name: string;
    avatar?: string;
    unreadCount: number;
    isOnline: boolean;
}

export interface ConversationResponse {
    conversations: Conversation[];
    total: number;
    page: number;
    per_page: number;
}