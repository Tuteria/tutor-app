let QUIZES_SHEET_API =
  "https://docs.google.com/spreadsheets/d/132vGcZPoZZxG3lbEx_YNoveOyucp6vWVc7Tw4-s4DwQ/edit?usp=sharing";
let SUBJECTS_API =
  "https://docs.google.com/spreadsheets/d/1BBI6HUCpHkHk_AgxBEGACpL90dV_D4mySG3-c0ewGVY/edit?usp=sharing";

let SHEET_API = "https://sheet.tuteria.com";
let PRICING_SHEET_API =
  "https://docs.google.com/spreadsheets/d/1BBI6HUCpHkHk_AgxBEGACpL90dV_D4mySG3-c0ewGVY/edit?usp=sharing";
let TUTERIA_SHEET_DATA_API = "https://docs.google.com/spreadsheets/d/1JGOyiJawAegbdKQ1d1FrSzK0wh56kb0CFjG-_LjDTT4/edit?usp=sharing"

async function getInfoArrayFromSheet(sheet, segments) {
  const body = {
    link: PRICING_SHEET_API,
    sheet,
    segments,
  };
  let response = await fetch(`${SHEET_API}/fetch-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (response.status < 400) {
    try {
      let result = await response.json();
      return result.data;
    } catch (error) {
      throw error;
    }
  }
  debugger;
  throw "Error fetching results";
}

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

async function getDataFromTuteriaSheet(){
  // let response = await 
}

type TuteriaTestType = {
  shortName: string;
  skill: string;
  url: string;
  slug: string;
  pass_mark?: number;
  tuteria_name?: string;
  test_name?: string;
  category?: string;
  subcategory?: string;
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
export async function getTuteriaSubjectData() {
  let subjects: Array<TuteriaTestType> = await getTestableSubjects();
  let tuteriaSubjects = [...new Set(subjects.map((o) => o.tuteria_name))];
  let formattedTuteriaSubjects = tuteriaSubjects.map((subject) => {
    const { category, subcategory, slug, pass_mark } = subjects.find(
      ({ tuteria_name }) => tuteria_name === subject
    );
    return {
      name: subject,
      category,
      subcategory: subcategory.trim().split(","),
      slug,
      pass_mark,
    };
  });
  let result = formattedTuteriaSubjects.map((item, i) => {
    let foundSubjects = subjects
      .filter((o) => o.tuteria_name === item.name)
      .map((x) => ({ ...x }));
    return { ...item, subjects: foundSubjects };
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
type QuizType = {
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
};
export async function getSheetTestData(
  shortName: string
): Promise<Array<QuizType>> {
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

export async function getQuizzesFromSubjects(
  testsName: string[]
): Promise<QuizType> {
  let results: any = await Promise.all(
    testsName.map((testName) =>
      getSheetAPI({
        link: QUIZES_SHEET_API,
        sheet: testName,
      })
    )
  );
  return results;
}
export async function getLocationInfoFromSheet() {
  let result = await getInfoArrayFromSheet("Location", [
    { cell_range: "A2:B1121", heading: ["state", "vicinity"] },
    {
      cell_range: "J2:M38",
      heading: ["state", "radius", "distanceThreshold", "farePerKM"],
    },
  ]);
  return {
    regions: result[0],
    state_with_radius: result[1].map((o) => ({
      ...o,
      radius: parseFloat(o.radius),
      distanceThreshold: parseFloat(o.distanceThreshold),
      farePerKM: parseFloat(o.farePerKM),
    })),
  };
}
