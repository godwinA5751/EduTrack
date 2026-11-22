
const COURSE_START_REGEX =
  /(?:^|\s)([A-Z]{3}\s?\d{3})\.?(?=\s|$)/gi;

const SEMESTER_REGEX =
  /(\d{3})\s*\/\s*(FIRST|SECOND)/i;

const COURSE_RESULT_REGEX =
  /(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+(?:\.\d{1,2})?)\s+([A-F])\s+APPROVED\b/i;

const GRADE_POINTS = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

function normalizeCourseCode(code) {
  return code.replace(/\s+/g, "").toUpperCase();
}

function getOriginalPdfText(pages) {
  return pages
    .map((page) =>
      page.items.map((item) => item.text).join(" ")
    )
    .join(" ");
}

function extractCourseBlocks(text) {
  const matches = [...text.matchAll(COURSE_START_REGEX)];

  return matches.map((match, index) => {
    const start = match.index + match[0].indexOf(match[1]);

    const nextMatch = matches[index + 1];

    const end = nextMatch
      ? nextMatch.index + nextMatch[0].indexOf(nextMatch[1])
      : text.length;

    return {
      code: normalizeCourseCode(match[1]),
      rawText: text.slice(start, end).trim(),
    };
  });
}

function parseCourseBlock(block) {
  const { code, rawText } = block;

  const semesterMatch = rawText.match(SEMESTER_REGEX);
  const resultMatch = rawText.match(COURSE_RESULT_REGEX);

  const issues = [];

  const level = semesterMatch
    ? Number(semesterMatch[1])
    : null;

  const semester = semesterMatch
    ? semesterMatch[2].toUpperCase() === "FIRST"
      ? 1
      : 2
    : null;

  const unit = resultMatch
    ? Number(resultMatch[4])
    : null;

  const grade = resultMatch
    ? resultMatch[6].toUpperCase()
    : null;

  if (!/^[A-Z]{3}\d{3}$/.test(code)) {
    issues.push("Invalid course code.");
  }

  if (!semesterMatch) {
    issues.push(
      "Could not identify the course level and semester from the PDF."
    );
  }

  if (!resultMatch) {
    issues.push(
      "Could not extract the complete course result. Please check the course details manually."
    );
  }

  if (!Number.isInteger(unit) || unit <= 0) {
    issues.push("Invalid or missing course unit.");
  }

  if (!Object.hasOwn(GRADE_POINTS, grade)) {
    issues.push("Invalid or missing grade.");
  }

  return {
    valid: issues.length === 0,
    code,
    level,
    semester,
    semesterLabel:
      semester === 1
        ? "First Semester"
        : semester === 2
          ? "Second Semester"
          : null,
    unit,
    grade,
    point: GRADE_POINTS[grade] ?? null,
    is_carryover: grade === "F",
    issues,
    rawText,
  };
}

export function parsePdfResult(extractedPdf) {
  if (!extractedPdf?.pages?.length) {
    throw new Error(
      "No readable PDF pages were found. Please upload another result PDF."
    );
  }

  const text = getOriginalPdfText(extractedPdf.pages).trim();

  if (!text) {
    throw new Error(
      "No readable text was found in this PDF. It may be a scanned or image-only document."
    );
  }

  const blocks = extractCourseBlocks(text);

  if (!blocks.length) {
    throw new Error(
      "EduTrack could read the PDF, but could not identify any course records. Please make sure you uploaded your institution's result statement in a supported format."
    );
  }

  const courses = blocks.map((block) =>
    parseCourseBlock(block)
  );

  // Detect duplicate course codes within the same level and semester.
  const seenCourses = new Map();

  courses.forEach((course, index) => {
    if (!course.code || !course.level || !course.semester) {
      return;
    }

    const key = `${course.level}-${course.semester}-${course.code}`;

    if (seenCourses.has(key)) {
      const previousIndex = seenCourses.get(key);

      const duplicateMessage =
        "Duplicate course code detected in this semester.";

      if (
        !courses[previousIndex].issues.includes(duplicateMessage)
      ) {
        courses[previousIndex].issues.push(duplicateMessage);
      }

      courses[previousIndex].valid = false;

      course.issues.push(duplicateMessage);
      course.valid = false;
    } else {
      seenCourses.set(key, index);
    }
  });

  // Group using the level and semester detected in the PDF.
  const groupMap = new Map();

  courses.forEach((course) => {
    if (!course.level || !course.semester) return;

    const key = `${course.level}-${course.semester}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        level: course.level,
        semester: course.semester,
        semesterLabel: course.semesterLabel,
        courses: [],
      });
    }

    groupMap.get(key).courses.push(course);
  });

  const groups = [...groupMap.values()].sort(
    (a, b) =>
      a.level - b.level ||
      a.semester - b.semester
  );

  const detectedLevels = [
    ...new Set(
      courses
        .map((course) => course.level)
        .filter(Boolean)
    ),
  ];

  const invalidCount = courses.filter(
    (course) => !course.valid
  ).length;

  return {
    courses,
    groups,
    detectedLevels,
    totalCourses: courses.length,

    totalUnits: courses.reduce(
      (sum, course) =>
        sum +
        (Number.isInteger(course.unit) && course.unit > 0
          ? course.unit
          : 0),
      0
    ),

    invalidCount,

    // The PDF's original level does not need to match
    // the destination level selected in EduTrack.
    hasLevelMismatch: false,

    canImport:
      courses.length > 0 &&
      invalidCount === 0,
  };
}
