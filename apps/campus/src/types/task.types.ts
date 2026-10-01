import type { UserProfile } from "./user.types";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string | number;
  title: string;
  description?: string;
  sphere_id?: number | string;
  sphere?: number | string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: number | string;
  assigned_to_info?: UserProfile | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
