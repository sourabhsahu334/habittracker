// Pre-filled subject lists per exam category (Feature 1). These are only
// starting suggestions — the user can add/remove freely. The app provides NO
// syllabus or study content beyond these subject *names*.

export const EXAM_CATEGORIES = [
  {
    id: 'jee_neet',
    label: 'JEE / NEET',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  },
  {
    id: 'upsc_psc',
    label: 'UPSC / PSC',
    subjects: ['History', 'Polity', 'Geography', 'Economy', 'Current Affairs'],
  },
  {
    id: 'boards',
    label: 'Board Exams',
    subjects: ['Physics', 'Chemistry', 'Maths', 'English', 'Biology'],
  },
  {
    id: 'college',
    label: 'College / University',
    subjects: ['Subject 1', 'Subject 2', 'Subject 3'],
  },
  {
    id: 'custom',
    label: 'Custom',
    subjects: [],
  },
];

export function presetSubjects(categoryId) {
  const c = EXAM_CATEGORIES.find(x => x.id === categoryId);
  return c ? [...c.subjects] : [];
}
