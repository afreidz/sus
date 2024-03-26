// Algorithm:
// answers range from 1 - 5
// for "positive" question ids subtract one from the user response
// for "negative" question ids subtract the user response from 5
// sum and multiply the final score by 2.5 to get a score out of 100
// average all the responses to get a final raw score

import { susType } from "@/stores/types";
import type { APIResponses } from "@/helpers/api";

type SurveyRespondents =
  | APIResponses["systemId"]["GET"]["revisions"][number]["respondents"]
  | APIResponses["revisionId"]["GET"]["respondents"];

export function calculateAverageSUSScore(respondents: SurveyRespondents) {
  const scores = calculateSUSScoreFromRespondents(respondents);
  return scores.reduce((a, b) => a + b, 0) / scores.length || 0;
}

export function calculateSUSScoreFromRespondents(
  respondents: SurveyRespondents
) {
  const scores = respondents.map(calculateSUSScoreFromRespondent);
  return scores;
}

export function calculateSUSScoreFromRespondent(
  respondent: SurveyRespondents[number]
) {
  const sus = susType.get();

  if (!sus) throw new Error("No SUS type found");

  const score = respondent.responses
    .filter(
      (r) => r.curratedResponse && r.curratedResponse.scoreTypeId === sus.id
    )
    .reduce((score, response) => {
      if (!response.curratedResponse?.numericalValue) return score;
      return (score += response.question.positive
        ? response.curratedResponse.numericalValue - 1
        : 5 - response.curratedResponse.numericalValue);
    }, 0);

  return score * 2.5;
}
