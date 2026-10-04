import { Suspense, lazy, useState } from "react";
import { PencilSimple, ArrowSquareOut as ExternalLink } from "@phosphor-icons/react";
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
    <section className="mt-6">
      <div className="rounded-2xl border border-border/40 bg-card divide-y divide-border/30 overflow-hidden shadow-xs">
        {/* 1. Informations académiques */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Informations académiques</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditAcademicOpen(true)}
                  title="Modifier les informations académiques"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-xs text-muted-foreground">Université</p>
              <p className="font-medium text-sm mt-0.5" title={formatSlugToLabel(user.university)}>
                {truncate(formatSlugToLabel(user.university), 35) || <EmptyField />}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Filière</p>
              <p className="font-medium text-sm mt-0.5">
                {formatSlugToLabel(user.faculty) || <EmptyField />}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Niveau</p>
              <p className="font-medium text-sm mt-0.5">{displayStudyYear || <EmptyField />}</p>
            </div>
            {isOwnProfile && (
              <div>
                <p className="text-xs text-muted-foreground">Matricule</p>
                <p className="font-medium text-sm mt-0.5">{user.studentId || <EmptyField />}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Campus</p>
              <p className="font-medium text-sm mt-0.5">{user.campus || <EmptyField />}</p>
            </div>
          </div>
        </div>

        {/* 2. Informations personnelles */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Informations personnelles</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditPersonalOpen(true)}
                  title="Modifier les informations personnelles"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {isOwnProfile && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm mt-0.5">{user.email || <EmptyField />}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium text-sm mt-0.5">{user.phoneNumber || <EmptyField />}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date de naissance</p>
                  <p className="font-medium text-sm mt-0.5">
                    {user.dateOfBirth ? formatFrenchDate(user.dateOfBirth) : <EmptyField />}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Ville</p>
              <p className="font-medium text-sm mt-0.5">
                {formatSlugToLabel(user.town) || <EmptyField />}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Langues</p>
              <p className="font-medium text-sm mt-0.5">
                {Array.isArray(user.language) && user.language.length > 0
                  ? user.language.map(formatSlugToLabel).join(", ")
                  : <EmptyField />}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Formations précédentes */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Formations précédentes</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditEducationOpen(true)}
                  title="Modifier les formations"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          {user.previousEducation && user.previousEducation.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {user.previousEducation.map((edu: any, index: number) => (
                <div
                  key={`${edu?.degree || "degree"}-${index}`}
                  className="rounded-xl border border-border/30 bg-muted/20 p-3 space-y-0.5"
                >
                  <p className="font-semibold text-sm text-foreground">
                    {formatSlugToLabel(edu?.degree) || <EmptyField />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {edu?.school || <EmptyField />}
                  </p>
                  {edu?.year && (
                    <p className="text-[11px] text-muted-foreground/80 font-medium">
                      {edu.year}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-1">
              <EmptyField />
            </p>
          )}
        </div>

        {/* 4. Expériences */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Expériences</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditExperiencesOpen(true)}
                  title="Modifier les expériences"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          {user.experiences && user.experiences.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {user.experiences.map((exp: any, index: number) => (
                <div
                  key={`${exp?.title || "experience"}-${index}`}
                  className="rounded-xl border border-border/30 bg-muted/20 p-3 space-y-1"
                >
                  <p className="font-semibold text-sm text-foreground">{exp?.title || <EmptyField />}</p>
                  <p className="text-xs text-muted-foreground">
                    {[exp?.company, exp?.duration].filter(Boolean).join(" • ") || (
                      <EmptyField />
                    )}
                  </p>
                  {exp?.description && (
                    <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-1">
              <EmptyField />
            </p>
          )}
        </div>

        {/* 5. Compétences */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Compétences</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditSkillsOpen(true)}
                  title="Modifier les compétences"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {user.skills.map((skill: any, index: number) => (
                <Badge key={`${skill}-${index}`} variant="secondary" className="text-xs font-normal">
                  {typeof skill === "string"
                    ? formatSlugToLabel(skill)
                    : formatSlugToLabel(skill?.name) || <EmptyField />}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-1">
              <EmptyField />
            </p>
          )}
        </div>

        {/* 6. Centres d'intérêt */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Centres d'intérêt</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditInterestsOpen(true)}
                  title="Modifier les centres d'intérêt"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          {user.interests && user.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {user.interests.map((interest: any, index: number) => (
                <Badge key={`${interest}-${index}`} variant="secondary" className="text-xs font-normal">
                  {typeof interest === "string"
                    ? formatSlugToLabel(interest)
                    : formatSlugToLabel(interest?.name) || <EmptyField />}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-1">
              <EmptyField />
            </p>
          )}
        </div>

        {/* 7. Portfolio */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Portfolio</h3>
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full"
                  onClick={() => setIsEditPortfolioOpen(true)}
                  title="Modifier le portfolio"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
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
          </div>
          {user.portfolioLinks && user.portfolioLinks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
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
                    className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-3.5 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-xs font-medium truncate pr-2 text-foreground">{label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </a>
                ) : (
                  <p key={`invalid-link-${index}`} className="text-xs text-muted-foreground">
                    <EmptyField />
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-1">
              <EmptyField />
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
