let QUIZES_SHEET_API =
  "https://docs.google.com/spreadsheets/d/132vGcZPoZZxG3lbEx_YNoveOyucp6vWVc7Tw4-s4DwQ/edit?usp=sharing";
let SUBJECTS_API =
  "https://docs.google.com/spreadsheets/d/1BBI6HUCpHkHk_AgxBEGACpL90dV_D4mySG3-c0ewGVY/edit?usp=sharing";

let SHEET_API = "https://sheet.tuteria.com";

function string_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to = "aaaaaeeeeiiiioooouuuunc------";

  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  return str;
}

async function getSheetAPI(params: any, path = "read-single") {
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
type TuteriaTestType = {
  shortName: string;
  skill: string;
  url: string;
  pass_mark?: number;
  tuteria_name?: string;
  test_name?: string;
};
export async function getTuteriaSubjectList() {
  let subjects: Array<TuteriaTestType> = await getTestableSubjects();
  let tuteriaSubjects = [...new Set(subjects.map((o) => o.tuteria_name))];
  let result = tuteriaSubjects.map((t, i) => {
    let foundSubjects = subjects
      .filter((o) => o.tuteria_name === t)
      .map((x) => ({ ...x }));
    return { name: t, subjects: foundSubjects };
  });
  return result;
}
export async function getTestableSubjects(
  shortName?: string
): Promise<Array<TuteriaTestType>> {
  let subjects: any = await getSheetAPI({
    link: SUBJECTS_API,
    sheet: "Academic Testable Subjects",
  });
  if (shortName) {
    return subjects
      .filter((subject) => subject.shortName === shortName)
      .map((data) => {
        return {
          ...data,
          skill: data.shortName,
          url: string_to_slug(data.shortName) + "-quiz",
        };
      });
  }
  return subjects
    .filter((o) => o.test_name)
    .map((data) => {
      return {
        ...data,
        skill: data.shortName,
        url: string_to_slug(data.shortName.toLowerCase()) + "-quiz",
      };
    });
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

export async function getSheetTestData(shortName: string): Promise<
  Array<{
    pretext?: string;
    question?: string;
    image?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    answer?: string;
    shared_text?: string;
    shared_question?: string;
    shared_images?: string;
    options_layout?: string;
    image_layout?: string;
    is_latex?: string;
  }>
> {
  let subjects = await getTestableSubjects(shortName);
  let results: any[] = await Promise.all(
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
