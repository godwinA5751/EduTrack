
const COURSE_CODE_REGEX = /^([A-Z]{3}\s?\d{3})\.?$/i;

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
  return code
    .replace(/\s+/g, "")
    .replace(/\.$/, "")
    .toUpperCase();
}

function getOriginalPdfText(pages) {
  return pages
    .map((page) =>
      page.items.map((item) => item.text).join(" ")
    )
    .join(" ");
}

function extractCourseBlocks(text) {
  const regex = /(?:^|\s)([A-Z]{3}\s?\d{3})\.?(?=\s|$)/gi;
  const matches = [...text.matchAll(regex)];

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

// Find column positions using the PDF table headers.
function getColumnPositions(items) {
  const findHeader = (name, fallback) => {
    const header = items.find(
      (item) =>
        item.text.trim().toUpperCase() === name
    );

    return header?.x ?? fallback;
  };

  return {
    semester: findHeader("SESSION", 268.778),
    unit: findHeader("UNIT", 437.272),
    grade: findHeader("GRADE", 475.32),
  };
}

// Find the closest matching item within a column and course row.
function findColumnValue(
  items,
  targetX,
  rowY,
  xTolerance,
  yTolerance,
  validator
) {
  const candidates = items
    .filter((item) => {
      const text = item.text.trim();

      return (
        Math.abs(item.x - targetX) <= xTolerance &&
        Math.abs(item.y - rowY) <= yTolerance &&
        validator(text)
      );
    })
    .sort((a, b) => {
      const distanceA =
        Math.abs(a.y - rowY) * 2 +
        Math.abs(a.x - targetX);

      const distanceB =
        Math.abs(b.y - rowY) * 2 +
        Math.abs(b.x - targetX);

      return distanceA - distanceB;
    });

  return candidates[0]?.text.trim() ?? null;
}

// Extract courses using their PDF coordinates.
function extractCoordinateCourseBlocks(pages) {
  const blocks = [];

  pages.forEach((page) => {
    const items = page.items.filter(
      (item) =>
        typeof item.x === "number" &&
        typeof item.y === "number" &&
        typeof item.text === "string" &&
        item.text.trim()
    );

    const columnPositions = getColumnPositions(items);

    const courseStarts = items
      .map((item) => {
        const match = item.text.trim().match(COURSE_CODE_REGEX);

        if (!match) return null;

        return {
          code: normalizeCourseCode(match[1]),
          y: item.y,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.y - a.y);

    courseStarts.forEach((course) => {
      // Collect the text belonging to this course row.
      // The tolerance also accommodates the semester line
      // and wrapped course titles.
      const rowItems = items.filter(
        (item) => Math.abs(item.y - course.y) <= 9.5
      );

      const semesterText = findColumnValue(
        rowItems,
        columnPositions.semester,
        course.y,
        35,
        9.5,
        (text) => SEMESTER_REGEX.test(text)
      );

      const unitText = findColumnValue(
        rowItems,
        columnPositions.unit,
        course.y,
        25,
        5,
        (text) => /^\d+$/.test(text)
      );

      const gradeText = findColumnValue(
        rowItems,
        columnPositions.grade,
        course.y,
        25,
        5,
        (text) => /^[A-F]$/i.test(text)
      );

      const rawText = rowItems
        .slice()
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((item) => item.text.trim())
        .join(" ");

      blocks.push({
        code: course.code,
        rawText,
        semesterText,
        unitText,
        gradeText,
      });
    });
  });

  return blocks;
}

function parseCourseBlock(block) {
  const {
    code,
    rawText,
    semesterText,
    unitText,
    gradeText,
  } = block;

  const semesterMatch = (
    semesterText ?? rawText
  ).match(SEMESTER_REGEX);

  // Coordinate-based extraction is preferred.
  // The original regex remains available as a fallback.
  const resultMatch = rawText.match(COURSE_RESULT_REGEX);

  const level = semesterMatch
    ? Number(semesterMatch[1])
    : null;

  const semester = semesterMatch
    ? semesterMatch[2].toUpperCase() === "FIRST"
      ? 1
      : 2
    : null;

  const unit = unitText !== undefined
    ? unitText !== null
      ? Number(unitText)
      : null
    : resultMatch
      ? Number(resultMatch[4])
      : null;

  const grade = gradeText !== undefined
    ? gradeText?.toUpperCase() ?? null
    : resultMatch
      ? resultMatch[6].toUpperCase()
      : null;

  const issues = [];

  if (!/^[A-Z]{3}\d{3}$/.test(code)) {
    issues.push("Invalid course code.");
  }

  if (!semesterMatch) {
    issues.push(
      "Could not identify the course level and semester from the PDF."
    );
  }

  if (
    (unitText === undefined && !resultMatch) ||
    (unitText !== undefined && unitText === null)
  ) {
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

  // Prefer coordinate-based parsing when available.
  const coordinateBlocks =
    extractCoordinateCourseBlocks(extractedPdf.pages);

  const blocks = coordinateBlocks.length
    ? coordinateBlocks
    : extractCourseBlocks(text);

  if (!blocks.length) {
    throw new Error(
      "EduTrack could read the PDF, but could not identify any course records. Please make sure you uploaded your institution's result statement in a supported format."
    );
  }

  const courses = blocks.map(parseCourseBlock);

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
    hasLevelMismatch: false,

    canImport:
      courses.length > 0 &&
      invalidCount === 0,
  };
}
