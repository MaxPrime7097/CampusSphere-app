import { prisma } from "../../lib/prisma.js";

export interface AcademicContext {
  firstName: string;
  university: string | null;
  faculty: string | null;
  studyYear: string | null;
  language: string | null;
}

export async function getUserAcademicContext(userId: number): Promise<AcademicContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      university: true,
      faculty: true,
      studyYear: true,
      language: true,
    },
  });

  if (!user) return null;

  return {
    firstName: user.firstName,
    university: user.university || null,
    faculty: user.faculty || null,
    studyYear: user.studyYear || null,
    language: typeof user.language === "string" ? user.language : "fr",
  };
}

export function buildContextPrefix(context: AcademicContext | null): string {
  if (!context || (!context.university && !context.faculty)) {
    return "";
  }

  const parts: string[] = [];
  if (context.firstName) parts.push(`l'étudiant(e) s'appelle ${context.firstName}`);
  if (context.faculty) parts.push(`en ${context.faculty}`);
  if (context.studyYear) parts.push(`niveau ${context.studyYear}`);
  if (context.university) parts.push(`à ${context.university}`);

  return `Contexte : tu aides ${parts.join(", ")}. Adapte ton vocabulaire et tes exemples à ce niveau d'études.\n\n`;
}