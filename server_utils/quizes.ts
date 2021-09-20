import { getTestQuestions } from "./hostService";

let QUIZES_SHEET_API =
  "https://docs.google.com/spreadsheets/d/132vGcZPoZZxG3lbEx_YNoveOyucp6vWVc7Tw4-s4DwQ/edit?usp=sharing";
let SUBJECTS_API =
  "https://docs.google.com/spreadsheets/d/1BBI6HUCpHkHk_AgxBEGACpL90dV_D4mySG3-c0ewGVY/edit?usp=sharing";

let SHEET_API = "https://sheet.tuteria.com";

async function getSheetAPI(
  params: any,
  path = "read-single"
): Promise<Array<{ shortName: string; test_name: string }>> {
  let response = await fetch(`${SHEET_API}/${path}`, {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "Content-Type": "application/json",
    },
  });
  let result = await response.json();
  return result.data;
}

export async function getTestableSubjects(shortName?: string) {
  let subjects = await getSheetAPI({
    link: SUBJECTS_API,
    sheet: "Academic Testable Subjects",
  });
  if (shortName) {
    return subjects.filter((subject) => subject.shortName === shortName);
  }
  return subjects;
}

function transfromData(data, showAnswer) {
  return {
    quiz: {
      questions: data.map((item) => ({
        id: item.id,
        content: item.content,
        figure: item.image,
        is_latex: item.is_latex || false,
        comprehension: {
          passage: item.comprehension,
        },
        options_display: item.options_layout || "vertical",
        answers: item.answer_set.map((option) => {
          const optionData = {
            content: option.content,
            is_latex: item.is_latex || false,
            figure: null,
            answer_type: "TEXT",
          };
          return showAnswer
            ? { ...optionData, correct: showAnswer ? option.correct : null }
            : optionData;
        }),
      })),
    },
  };
}

export async function getTestForSubject(shortName: string) {
  let subjects = await getTestableSubjects(shortName);
  let results = await Promise.all(
    subjects.map((s) =>
      getSheetAPI({
        link: QUIZES_SHEET_API,
        sheet: s.test_name,
      })
    )
  );
  const flattenedResult = results.flat();
  return flattenedResult;
}

export async function getTestQuestionsForSubject(
  shortName,
  showAnswer = false
) {
  const questions = await getTestQuestions(shortName);
  return transfromData(questions, showAnswer);
}
