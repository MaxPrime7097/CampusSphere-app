import { describe, it, expect } from "vitest";
import {
  buildRevisionSchedule,
  computeSubjectPriority,
  extractSessionChapters,
  type SchedulerSubjectInput,
} from "../../src/services/planner/revisionScheduler.js";

describe("Sphera Revision Scheduler (V1.5)", () => {
  it("prioritizes an upcoming exam over an undated subject of equal or higher weight", () => {
    const datedExam = { examDate: "2026-12-05", weight: 3 };
    const undated = { examDate: null, weight: 5 };

    const datedScore = computeSubjectPriority(datedExam, "2026-12-01", 3, 0);
    const undatedScore = computeSubjectPriority(undated, "2026-12-01", 3, 0);

    expect(datedScore).toBeGreaterThan(undatedScore);
  });

  it("returns 0 urgency for passed exams or exam day itself", () => {
    expect(computeSubjectPriority({ examDate: "2026-11-30", weight: 5 }, "2026-12-01", 3, 0)).toBe(0);
    expect(computeSubjectPriority({ examDate: "2026-12-01", weight: 5 }, "2026-12-01", 3, 0)).toBe(0);
  });

  it("rotates fairly across 5 subjects instead of repeating the same 3 forever", () => {
    const subjects: SchedulerSubjectInput[] = [1, 2, 3, 4, 5].map((id) => ({
      id,
      name: `Matière ${id}`,
      examDate: "2026-12-15",
      weight: 3,
      sessions: [{ id: id * 10, title: `Cours ${id}`, toolTypes: ["fiche"], chapters: [] }],
    }));

    const { tasks } = buildRevisionSchedule(subjects, {
      startDate: "2026-12-01",
      dailyLoad: 2,
    });

    const scheduledSubjectIds = new Set(tasks.map((t) => t.subjectId));
    expect(scheduledSubjectIds.size).toBe(5);
  });

  it("follows cognitive 3-phase progression (fiche -> flashcards -> quiz) and splits chapters", () => {
    const subjects: SchedulerSubjectInput[] = [
      {
        id: 1,
        name: "Algorithmique",
        examDate: "2026-12-10",
        weight: 4,
        sessions: [
          {
            id: 42,
            title: "Structures de données",
            toolTypes: ["fiche"],
            chapters: [
              "Chap. 1 — Listes chaînées",
              "Chap. 2 — Piles et files",
              "Chap. 3 — Arbres binaires",
              "Chap. 4 — Graphes",
            ],
          },
        ],
      },
    ];

    const { tasks } = buildRevisionSchedule(subjects, {
      startDate: "2026-12-01",
      dailyLoad: 1,
    });

    expect(tasks.length).toBeGreaterThanOrEqual(4);
    // First tasks cover chapter chunks in discovery phase
    expect(tasks[0].phase).toBe("decouverte");
    expect(tasks[0].actionType).toBe("fiche");
    expect(tasks[0].chapterTitle).toContain("Chap. 1");
    expect(tasks[1].phase).toBe("decouverte");
    expect(tasks[1].chapterTitle).toContain("Chap. 3");
    // Followed by flashcards anchoring, then quiz validation
    expect(tasks[2].phase).toBe("ancrage");
    expect(tasks[2].actionType).toBe("flashcards");
    expect(tasks[3].phase).toBe("validation");
    expect(tasks[3].actionType).toBe("quiz");
  });

  it("honors rest days except on exam eve (J-1)", () => {
    // 2026-12-06 is a Sunday (weekday 0)
    const subjects: SchedulerSubjectInput[] = [
      {
        id: 1,
        name: "Physique",
        examDate: "2026-12-12",
        weight: 3,
        sessions: [],
      },
    ];

    const { tasks } = buildRevisionSchedule(subjects, {
      startDate: "2026-12-05",
      dailyLoad: 1,
      restDays: [0], // Sunday off
    });

    expect(tasks.some((t) => t.scheduledDate === "2026-12-06")).toBe(false);

    // If exam is Monday 2026-12-07, Sunday 2026-12-06 IS exam eve -> should schedule!
    const urgentSchedule = buildRevisionSchedule(
      [{ ...subjects[0], examDate: "2026-12-07" }],
      { startDate: "2026-12-05", dailyLoad: 1, restDays: [0] },
    );
    expect(urgentSchedule.tasks.some((t) => t.scheduledDate === "2026-12-06")).toBe(true);
  });

  it("extracts chapters cleanly from ficheContent", () => {
    const chapters = extractSessionChapters(
      {
        chapitres: [
          { numero: 1, titre: "Introduction" },
          { numero: 2, titre: "Théorème central" },
        ],
      },
      {},
    );
    expect(chapters).toEqual(["Chap. 1 — Introduction", "Chap. 2 — Théorème central"]);
  });
});
