import { z } from "zod";

const MAX = {
  firstName: 60,
  lastName: 60,
  username: 30,
  university: 120,
  faculty: 120,
  studentId: 50,
  campus: 120,
  town: 80,
  language: 40,
  bio: 500,
  portfolioName: 80,
  educationDegree: 120,
  educationSchool: 140,
  educationYear: 20,
  experienceTitle: 120,
  experienceCompany: 120,
  experienceDuration: 60,
  experienceDescription: 800,
} as const;

const phoneRegex = /^(?:\+237\d{9}|\d{9})$/;
const studentIdRegex = /^[A-Z][A-Z0-9]*$/;

const previousEducationItemSchema = z.object({
  degree: z.string().trim().max(MAX.educationDegree, `Maximum ${MAX.educationDegree} caractères`).optional().default(""),
  school: z.string().trim().max(MAX.educationSchool, `Maximum ${MAX.educationSchool} caractères`).optional().default(""),
  year: z.string().trim().max(MAX.educationYear, `Maximum ${MAX.educationYear} caractères`).optional().default(""),
});

const experienceItemSchema = z.object({
  title: z.string().trim().max(MAX.experienceTitle, `Maximum ${MAX.experienceTitle} caractères`).optional().default(""),
  company: z.string().trim().max(MAX.experienceCompany, `Maximum ${MAX.experienceCompany} caractères`).optional().default(""),
  duration: z.string().trim().max(MAX.experienceDuration, `Maximum ${MAX.experienceDuration} caractères`).optional().default(""),
  description: z.string().trim().max(MAX.experienceDescription, `Maximum ${MAX.experienceDescription} caractères`).optional().default(""),
});

const portfolioLinkItemSchema = z.object({
  name: z.string().trim().max(MAX.portfolioName, `Maximum ${MAX.portfolioName} caractères`).optional().default(""),
  url: z.string().trim().url("URL invalide").max(300, "Maximum 300 caractères"),
});

export const completeSupabaseProfilePayloadSchema = z.object({
  username: z.string().trim().min(3, "Au moins 3 caractères").max(MAX.username, `Maximum ${MAX.username} caractères`),
  first_name: z.string().trim().max(MAX.firstName, `Maximum ${MAX.firstName} caractères`).optional(),
  last_name: z.string().trim().max(MAX.lastName, `Maximum ${MAX.lastName} caractères`).optional(),
  phone_number: z.string().trim().regex(phoneRegex, "Téléphone invalide (9 chiffres, avec ou sans +237)").optional(),
  date_of_birth: z.string().min(1, "Date de naissance requise").optional(),
  university: z.string().trim().max(MAX.university, `Maximum ${MAX.university} caractères`).optional(),
  faculty: z.string().trim().max(MAX.faculty, `Maximum ${MAX.faculty} caractères`).optional(),
  study_year: z.string().trim().max(60, "Maximum 60 caractères").optional(),
  student_id: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.string().max(MAX.studentId, `Maximum ${MAX.studentId} caractères`).optional()
  ).optional().or(z.literal("")),
  campus: z.string().trim().max(MAX.campus, `Maximum ${MAX.campus} caractères`).optional(),
  town: z.string().trim().max(MAX.town, `Maximum ${MAX.town} caractères`).optional(),
  language: z.array(z.string().trim().max(50, "Langue trop longue")).optional(),
  bio: z.string().trim().max(MAX.bio, `Maximum ${MAX.bio} caractères`).optional(),
  skills: z.array(z.string().trim().max(50, "Compétence trop longue")).optional(),
  interests: z.array(z.string().trim().max(50, "Centre d'intérêt trop long")).optional(),
  previous_education: z.array(previousEducationItemSchema).optional(),
  experiences: z.array(experienceItemSchema).optional(),
  portfolio_links: z.array(portfolioLinkItemSchema).optional(),
}).strict();

const fieldAliasMap: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  phone_number: "phoneNumber",
  date_of_birth: "dateOfBirth",
  study_year: "studyYear",
  student_id: "studentId",
  previous_education: "previousEducation",
  portfolio_links: "portfolioLinks",
};

function normalizeField(field: string): string {
  return fieldAliasMap[field] ?? field;
}

export function mapCompleteProfileErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const [root, second, third] = issue.path;
    const rootField = normalizeField(String(root ?? "form"));

    if (typeof second === "number" && typeof third === "string") {
      const itemField = normalizeField(String(third));
      fieldErrors[rootField] = `${rootField} #${second + 1} (${itemField}) : ${issue.message}`;
      return;
    }

    fieldErrors[rootField] = issue.message;
  });

  return fieldErrors;
}
