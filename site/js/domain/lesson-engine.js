/** Evaluate only explicit interaction and answer; opening a lesson never completes it. */
import {validateWater} from './recipe.js';
export function evaluateChallenge(lesson, interaction, answer) {
  const c=lesson.challenge;
  let acted=false;
  if(c.type==='parameter-and-choice')acted=validateWater(interaction[c.parameter])&&interaction[c.parameter]>=c.minimum;
  else if(c.type==='action-and-choice')acted=interaction.completed===true;
  else if(c.type==='observe-and-choice')acted=Array.isArray(c.requiredActionIds)&&c.requiredActionIds.length>0&&Array.isArray(interaction.observedActionIds)&&c.requiredActionIds.every(id=>interaction.observedActionIds.includes(id));
  if (!acted) return {passed:false, reasonCode:'interaction-required'};
  if (!c.correctOptionIds.includes(answer)) return {passed:false, reasonCode:'incorrect'};
  return {passed:true,reasonCode:'passed'};
}
