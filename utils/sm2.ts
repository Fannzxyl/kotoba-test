import { ReviewMeta, Grade } from '../types';

/**
 * Calculates the next review schedule based on the SM-2 algorithm.
 * 
 * @param currentMeta The current state of the card
 * @param grade The quality of the recall (0-5)
 * @returns The updated ReviewMeta
 */
export const calculateSM2 = (currentMeta: ReviewMeta, grade: Grade): ReviewMeta => {
  let { ef, repetitions, interval } = currentMeta;

  // If grade is >= 3, the card was recalled correctly
  if (grade >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    repetitions += 1;
  } else {
    // If grade < 3, the card was forgotten. Reset repetitions and interval.
    repetitions = 0;
    interval = 1;
  }

  // Update Easiness Factor (EF)
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // q = grade
  ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  // EF cannot go below 1.3
  if (ef < 1.3) {
    ef = 1.3;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  // Normalize to start of day to avoid hour drift issues, though technically not required for ISO sort
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    ef,
    repetitions,
    interval,
    nextReview: nextReviewDate.toISOString(),
  };
};

export const getInitialReviewMeta = (): ReviewMeta => ({
  ef: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: new Date().toISOString(), // Due immediately
});