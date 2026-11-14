/** Return a new progress object; each lesson, card and chapter is awarded once. */
export function completeLesson(progress, lesson, chapters) {
  const first=!progress.completedLessonIds.includes(lesson.id);
  const completedLessonIds=[...new Set([...progress.completedLessonIds,lesson.id])];
  const collectedDrinkIds=[...new Set([...progress.collectedDrinkIds,...(lesson.rewardDrinkIds||[])])];
  const awardedAchievementIds=[...progress.awardedAchievementIds];
  const chapter=chapters[lesson.chapterId];
  const award=`chapter-${lesson.chapterId}`;
  if (chapter?.every(id=>completedLessonIds.includes(id)) && !awardedAchievementIds.includes(award)) awardedAchievementIds.push(award);
  return {progress:{...progress,completedLessonIds,collectedDrinkIds,awardedAchievementIds},first};
}
export function totalPoints(progress) { return new Set(progress.completedLessonIds).size*10+new Set(progress.awardedAchievementIds).size*20+(progress.completedLessonIds.includes('final-01')?30:0); }
