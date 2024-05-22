// Algorithm:
// answers range from 1 - 5
// for "positive" question ids subtract one from the user response
// for "negative" question ids subtract the user response from 5
// sum and multiply the final score by 2.5 to get a score out of 100
// average all the responses to get a final raw score
import type { APIResponses } from "@/helpers/api";

type SurveyRespondents =
  | APIResponses["nonCurrentSUSRespondents"]["GET"]
  | APIResponses["revisionId"]["GET"]["respondents"]
  | APIResponses["systemId"]["GET"]["revisions"][number]["respondents"];

export function calculateAverageSUSScore(
  respondents: SurveyRespondents,
  surveyId?: string
) {
  if (!surveyId) throw new Error("survey id required");
  const scores = calculateSUSScoreFromRespondents(respondents, surveyId);
  return scores.reduce((a, b) => a + b, 0) / scores.length || 0;
}

export function calculateSUSScoreFromRespondents(
  respondents: SurveyRespondents,
  surveyId?: string
) {
  if (!surveyId) throw new Error("survey id required");
  console.log("RESPONDENTS", respondents);
  const scores = respondents.map((r) =>
    calculateSUSScoreFromRespondent(r, surveyId)
  );
  console.log("SCORES", scores);
  return scores;
}

export function calculateSUSScoreFromRespondent(
  respondent: SurveyRespondents[number],
  surveyId?: string
) {
  if (!surveyId) throw new Error("survey id required");
  const responses = respondent.responses.filter((r) => r.surveyId === surveyId);
  console.log("RESPONSES", responses);
  const score = responses.reduce((score, response) => {
    if (!response.curratedResponse?.numericalValue) return score;
    return (score += response.question.positive
      ? response.curratedResponse.numericalValue - 1
      : 5 - response.curratedResponse.numericalValue);
  }, 0);

  return score * 2.5;
}
