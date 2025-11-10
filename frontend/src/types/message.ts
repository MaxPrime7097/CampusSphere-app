export interface Message {
    id: string;
    content: string;
    sender: {
        id: string;
        username: string;
        avatar?: string;
    };
    conversation_id: string;
    created_at: string;
    updated_at: string;
}

export interface MessageResponse {
    messages: Message[];
    total: number;
    page: number;
    per_page: number;
}