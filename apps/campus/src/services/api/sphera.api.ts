/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ToolType } from "@cs/types";

export {
  generateStudyTools,
  generateStudyToolsFromUpload,
  generateFromUpload,
  generateMindmap,
  generateAudioSummary,
  getStudySessions,
  getStudySession,
  deleteStudySession,
  addToolToSession,
  shareStudySession,
  unshareStudySession,
  getSphereStudySessions,
  askStudyQuestion,
  generateAnnale,
  getAnnaleSessions,
  getAnnaleSession,
  deleteAnnaleSession,
  shareAnnaleSession,
  unshareAnnaleSession,
  getSphereAnnaleSessions,
  getGenerationQuota,
} from "@cs/api-client";

export type ApiStudyToolType = ToolType;
