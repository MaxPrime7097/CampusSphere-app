import { Suspense, lazy, useState } from "react";
import {
  GraduationCap,
  User,
  BookOpen,
  Briefcase,
  Zap,
  Smile,
  BriefcaseBusiness,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { formatSlugToLabel, truncate } from "@/lib/utils";
import { formatFrenchDate } from "@/lib/date";

const EditAcademicModal = lazy(() =>
  import("@/components/modals/EditAcademicModal").then((module) => ({
    default: module.EditAcademicModal,
  }))
);
const EditPersonalModal = lazy(() =>
  import("@/components/modals/EditPersonalModal").then((module) => ({
    default: module.EditPersonalModal,
  }))
);
const EditEducationModal = lazy(() =>
  import("@/components/modals/EditEducationModal").then((module) => ({
    default: module.EditEducationModal,
  }))
);
const EditExperiencesModal = lazy(() =>
  import("@/components/modals/EditExperiencesModal").then((module) => ({
    default: module.EditExperiencesModal,
  }))
);
const EditSkillsModal = lazy(() =>
  import("@/components/modals/EditSkillsModal").then((module) => ({
    default: module.EditSkillsModal,
  }))
);
const EditInterestsModal = lazy(() =>
  import("@/components/modals/EditInterestsModal").then((module) => ({
    default: module.EditInterestsModal,
  }))
);
const EditPortfolioModal = lazy(() =>
  import("@/components/modals/EditPortfolioModal").then((module) => ({
    default: module.EditPortfolioModal,
  }))
);

const EmptyField = () => (
  <span className="italic text-muted-foreground text-xs font-normal">
    Aucun pour l'instant
  </span>
);

export interface ProfileAboutUser {
  university?: string;
  faculty?: string;
  studyYear?: string;
  studentId?: string;
  campus?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  town?: string;
  language?: string | string[];
  previousEducation?: any[];
  experiences?: any[];
  skills?: any[];
  interests?: any[];
  portfolioLinks?: any[];
}

interface ProfileAboutTabProps {
  user: ProfileAboutUser;
  isOwnProfile: boolean;
  displayStudyYear: string;
}

export function ProfileAboutTab({
  user,
  isOwnProfile,
  displayStudyYear,
}: ProfileAboutTabProps) {
  const [isEditAcademicOpen, setIsEditAcademicOpen] = useState(false);
  const [isEditPersonalOpen, setIsEditPersonalOpen] = useState(false);
  const [isEditEducationOpen, setIsEditEducationOpen] = useState(false);
  const [isEditExperiencesOpen, setIsEditExperiencesOpen] = useState(false);
  const [isEditSkillsOpen, setIsEditSkillsOpen] = useState(false);
  const [isEditInterestsOpen, setIsEditInterestsOpen] = useState(false);
  const [isEditPortfolioOpen, setIsEditPortfolioOpen] = useState(false);

  const handleModalSuccess = () => {
    window.location.reload();
  };

  return (
    <section className="mt-6 space-y-4">
      {/* 1. Informations académiques */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Informations académiques
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditAcademicOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditAcademicOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditAcademicModal
                    open={isEditAcademicOpen}
                    onOpenChange={setIsEditAcademicOpen}
                    initialData={{
                      university: user.university || "",
                      faculty: user.faculty || "",
                      studyYear: user.studyYear || "",
                      studentId: user.studentId || "",
                      campus: user.campus || "",
                    }}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Université</p>
            <p className="font-medium" title={formatSlugToLabel(user.university)}>
              {truncate(formatSlugToLabel(user.university), 35) || <EmptyField />}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Filière</p>
            <p className="font-medium">
              {formatSlugToLabel(user.faculty) || <EmptyField />}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Niveau</p>
            <p className="font-medium">{displayStudyYear || <EmptyField />}</p>
          </div>
          {isOwnProfile && (
            <div>
              <p className="text-sm text-muted-foreground">Matricule</p>
              <p className="font-medium">{user.studentId || <EmptyField />}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Campus</p>
            <p className="font-medium">{user.campus || <EmptyField />}</p>
          </div>
        </div>
      </div>

      {/* 2. Informations personnelles */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informations Personnelles
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditPersonalOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditPersonalOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditPersonalModal
                    open={isEditPersonalOpen}
                    onOpenChange={setIsEditPersonalOpen}
                    initialData={{
                      email: user.email || "",
                      phoneNumber: user.phoneNumber || "",
                      dateOfBirth: user.dateOfBirth || "",
                      town: user.town || "",
                      languages: Array.isArray(user.language) ? user.language : [],
                    }}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {isOwnProfile && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || <EmptyField />}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{user.phoneNumber || <EmptyField />}</p>
                </div>
              </>
            )}
            {isOwnProfile && (
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">
                  {user.dateOfBirth ? formatFrenchDate(user.dateOfBirth) : <EmptyField />}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Ville</p>
              <p className="font-medium">
                {formatSlugToLabel(user.town) || <EmptyField />}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Langues</p>
              <p className="font-medium">
                {Array.isArray(user.language) && user.language.length > 0
                  ? user.language.map(formatSlugToLabel).join(", ")
                  : <EmptyField />}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Formations précédentes */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Formations précédentes
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditEducationOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditEducationOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditEducationModal
                    open={isEditEducationOpen}
                    onOpenChange={setIsEditEducationOpen}
                    initialEducation={user.previousEducation || []}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        {user.previousEducation && user.previousEducation.length > 0 ? (
          <div className="space-y-3">
            {user.previousEducation.map((edu: any, index: number) => (
              <div
                key={`${edu?.degree || "degree"}-${index}`}
                className="border rounded-lg p-3"
              >
                <p className="font-medium">
                  {formatSlugToLabel(edu?.degree) || <EmptyField />}
                </p>
                <p className="text-sm text-muted-foreground">
                  {edu?.school || <EmptyField />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {edu?.year || <EmptyField />}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <EmptyField />
          </p>
        )}
      </div>

      {/* 4. Expériences */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Expériences
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditExperiencesOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditExperiencesOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditExperiencesModal
                    open={isEditExperiencesOpen}
                    onOpenChange={setIsEditExperiencesOpen}
                    initialExperiences={user.experiences || []}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        {user.experiences && user.experiences.length > 0 ? (
          <div className="space-y-3">
            {user.experiences.map((exp: any, index: number) => (
              <div
                key={`${exp?.title || "experience"}-${index}`}
                className="border rounded-lg p-3"
              >
                <p className="font-medium">{exp?.title || <EmptyField />}</p>
                <p className="text-sm text-muted-foreground">
                  {[exp?.company, exp?.duration].filter(Boolean).join(" • ") || (
                    <EmptyField />
                  )}
                </p>
                <p className="text-sm mt-1">{exp?.description || <EmptyField />}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <EmptyField />
          </p>
        )}
      </div>

      {/* 5. Compétences */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Compétences
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditSkillsOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditSkillsOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditSkillsModal
                    open={isEditSkillsOpen}
                    onOpenChange={setIsEditSkillsOpen}
                    initialSkills={user.skills || []}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        {user.skills && user.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill: any, index: number) => (
              <Badge key={`${skill}-${index}`} variant="secondary">
                {typeof skill === "string"
                  ? formatSlugToLabel(skill)
                  : formatSlugToLabel(skill?.name) || <EmptyField />}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <EmptyField />
          </p>
        )}
      </div>

      {/* 6. Centres d'intérêt */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            Centres d'intérêt
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditInterestsOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditInterestsOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditInterestsModal
                    open={isEditInterestsOpen}
                    onOpenChange={setIsEditInterestsOpen}
                    initialInterests={user.interests || []}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        {user.interests && user.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest: any, index: number) => (
              <Badge key={`${interest}-${index}`} variant="outline">
                {typeof interest === "string"
                  ? formatSlugToLabel(interest)
                  : formatSlugToLabel(interest?.name) || <EmptyField />}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <EmptyField />
          </p>
        )}
      </div>

      {/* 7. Portfolio */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            Portfolio
          </div>
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setIsEditPortfolioOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isEditPortfolioOpen && (
                <Suspense fallback={<ModalLoadingFallback />}>
                  <EditPortfolioModal
                    open={isEditPortfolioOpen}
                    onOpenChange={setIsEditPortfolioOpen}
                    initialLinks={user.portfolioLinks || []}
                    onSuccess={handleModalSuccess}
                  />
                </Suspense>
              )}
            </>
          )}
        </h3>
        {user.portfolioLinks && user.portfolioLinks.length > 0 ? (
          <div className="space-y-2">
            {user.portfolioLinks.map((entry: any, index: number) => {
              const rawUrl = typeof entry === "string" ? entry : entry?.url;
              const href = rawUrl?.startsWith("http")
                ? rawUrl
                : rawUrl
                ? `https://${rawUrl}`
                : "";
              const label =
                (typeof entry === "object" && entry?.name) ||
                rawUrl ||
                `Lien ${index + 1}`;

              return href ? (
                <a
                  key={`${href}-${index}`}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium truncate pr-2">{label}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              ) : (
                <p key={`invalid-link-${index}`} className="text-sm text-muted-foreground">
                  <EmptyField />
                </p>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <EmptyField />
          </p>
        )}
      </div>
    </section>
  );
}
