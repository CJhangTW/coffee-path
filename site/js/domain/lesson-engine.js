/** Evaluate only explicit interaction and answer; opening a lesson never completes it. */
import {validateWater} from './recipe.js';
export function evaluateChallenge(lesson, interaction, answer) {
  const c=lesson.challenge;
  const acted=c.type==='parameter-and-choice' ? validateWater(interaction[c.parameter]) && interaction[c.parameter]>=c.minimum : interaction.completed===true;
  if (!acted) return {passed:false, reasonCode:'interaction-required'};
  if (!c.correctOptionIds.includes(answer)) return {passed:false, reasonCode:'incorrect'};
  return {passed:true,reasonCode:'passed'};
}
