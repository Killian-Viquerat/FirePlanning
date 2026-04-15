import { GRADE_OPTIONS } from '../constants/grades.js';

export const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

export const getGradeOption = (grade) => {
  const normalized = normalizeText(grade);
  if (!normalized) return null;
  return (
    GRADE_OPTIONS.find(
      (option) => normalizeText(option.value) === normalized || normalizeText(option.acronym) === normalized
    ) ?? null
  );
};

export const isKnownGrade = (grade) => Boolean(getGradeOption(grade));

export const normalizeGradeValue = (grade) => {
  const option = getGradeOption(grade);
  if (option) return option.value;
  return String(grade ?? '').trim();
};

export const getGradeAcronym = (grade) => {
  const option = getGradeOption(grade);
  if (option) return option.acronym;
  const fallback = String(grade ?? '').trim();
  return fallback || 'N/A';
};

export const getGradeBadgeTone = (grade) => getGradeOption(grade)?.tone ?? 'gray';
