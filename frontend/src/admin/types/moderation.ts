export interface AdminMember {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ModerationResource {
  id: string;
  title: string;
  type: string;
  subject: string;
  uploader: AdminMember;
  uploadDate: string | null;
  size: string;
}

export interface ReportedContent {
  id: string;
  type: string;
  content: string;
  reason: string;
  reporter: AdminMember;
  date: string | null;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  status: "success" | "warning" | "error";
}
