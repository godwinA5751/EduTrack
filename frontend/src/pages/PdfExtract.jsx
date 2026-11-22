
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FaArrowLeft } from "react-icons/fa";
import {
  extractPdfText,
  parsePdfResult,
} from "../services/academic";
import { getExistingAcademicRecords } from "../queries/importQueries";
import { importPdfCourses } from "../services/academic/pdfImportService";
import { refreshAcademicData } from "../services/academic/refreshAcademicData";
import Header from "../components/layout/Header";

const GRADE_POINTS = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

const LEVELS = [100, 200, 300, 400, 500, 600];

const inputClass =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white/90 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-[#199FB1] focus:ring-2 focus:ring-[#199FB1]/20 dark:border-white/10 dark:bg-[#0B2732]/70 dark:text-gray-100 dark:placeholder:text-gray-500";

const panelClass =
  "rounded-3xl border border-white/50 bg-white/75 p-5 shadow-xl shadow-[#0D5C75]/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B2732]/75 sm:p-7";

// const primaryText =
//   "text-gray-800 dark:text-gray-100";

// const secondaryText =
//   "text-gray-600 dark:text-gray-300";

const mutedText =
  "text-gray-500 dark:text-gray-400";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300";

function createCourseId() {
  return crypto.randomUUID();
}

function validateCourses(
  courses,
  existingRecords = { levels: [], semesters: [] }
) {
  const seen = new Set();
  const existingCourseKeys = new Set();

  const levelById = new Map(
    existingRecords.levels.map((item) => [item.id, item.level])
  );

  existingRecords.semesters.forEach((semester) => {
    const level = levelById.get(semester.level_id);

    semester.courses?.forEach((course) => {
      existingCourseKeys.add(
        `${level}-${semester.semester}-${String(course.code)
          .trim()
          .toUpperCase()}`
      );
    });
  });

  return courses.map((course) => {
    const issues = [];
    const code = String(course.code || "").trim().toUpperCase();
    const unit = Number(course.unit);
    const grade = String(course.grade || "").toUpperCase();
    const level = Number(course.level);
    const semester = Number(course.semester);

    if (!/^[A-Z]{3}\d{3}$/.test(code)) {
      issues.push("Enter a valid course code, e.g. CSC201.");
    }

    if (!Number.isInteger(unit) || unit <= 0) {
      issues.push("Unit must be a positive whole number.");
    }

    if (!Object.hasOwn(GRADE_POINTS, grade)) {
      issues.push("Select a valid grade.");
    }

    if (!LEVELS.includes(level)) {
      issues.push("Select a valid level.");
    }

    if (![1, 2].includes(semester)) {
      issues.push("Select a valid semester.");
    }

    const duplicateKey = `${level}-${semester}-${code}`;

    if (code && seen.has(duplicateKey)) {
      issues.push("Duplicate course code in this uploaded result.");
    } else if (code) {
      seen.add(duplicateKey);
    }

    const alreadyExists = existingCourseKeys.has(duplicateKey);

    if (alreadyExists) {
      issues.push(
        "This course already exists in EduTrack for this level and semester. Remove it from this import or change its details."
      );
    }

    return {
      ...course,
      code,
      unit,
      grade,
      level,
      semester,
      point: GRADE_POINTS[grade] ?? null,
      is_carryover: grade === "F",
      alreadyExists,
      valid: issues.length === 0,
      issues,
    };
  });
}

function PdfExtract() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const requestedLevel = new URLSearchParams(location.search).get("level");

  const initialLevel = LEVELS.includes(Number(requestedLevel))
    ? String(Number(requestedLevel))
    : "200";

  const [file, setFile] = useState(null);
  const level = initialLevel;
  const [result, setResult] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newCourse, setNewCourse] = useState({
    code: "",
    unit: "",
    grade: "",
    level: "200",
    semester: "1",
  });

  const [existingRecords, setExistingRecords] = useState({
    levels: [],
    semesters: [],
  });

  const [importing, setImporting] = useState(false);
  const [showImportConfirmation, setShowImportConfirmation] =
    useState(false);
  const [imported, setImported] = useState(false);
  const [success, setSuccess] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [debugPdfText, setDebugPdfText] = useState("");

  const reviewedCourses = useMemo(
    () => validateCourses(courses, existingRecords),
    [courses, existingRecords]
  );

  const groups = useMemo(() => {
    const groupMap = new Map();

    const existingLevelIds = new Map(
      existingRecords.levels.map((item) => [item.id, item.level])
    );

    const existingSemesterKeys = new Set(
      existingRecords.semesters.map((semester) => {
        const existingLevel = existingLevelIds.get(semester.level_id);
        return `${existingLevel}-${semester.semester}`;
      })
    );

    reviewedCourses.forEach((course) => {
      const key = `${course.level}-${course.semester}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          level: course.level,
          semester: course.semester,
          semesterLabel:
            course.semester === 1
              ? "First Semester"
              : "Second Semester",
          semesterExists: existingSemesterKeys.has(key),
          courses: [],
        });
      }

      groupMap.get(key).courses.push(course);
    });

    return [...groupMap.values()].sort(
      (a, b) => a.level - b.level || a.semester - b.semester
    );
  }, [reviewedCourses, existingRecords]);

  const totalUnits = reviewedCourses.reduce(
    (sum, course) =>
      sum +
      (Number.isInteger(course.unit) && course.unit > 0
        ? course.unit
        : 0),
    0
  );

  const invalidCount = reviewedCourses.filter(
    (course) => !course.valid
  ).length;

  const validCount = reviewedCourses.length - invalidCount;

  const destinationLevelExists = existingRecords.levels.some(
    (item) => Number(item.level) === Number(level)
  );

  const canImport =
    reviewedCourses.length > 0 &&
    invalidCount === 0 &&
    destinationLevelExists &&
    !imported;

  const handleTest = async (selectedFile) => {
    if (!selectedFile) return;

    if (!navigator.onLine) {
      setError(
        "PDF importing requires an internet connection. Please reconnect and try again."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      setCourses([]);
      setExistingRecords({ levels: [], semesters: [] });
      setImported(false);
      setSuccess("");
      setRefreshWarning("");
      setShowImportConfirmation(false);

      const pdfData = await extractPdfText(selectedFile);

      setDebugPdfText(
        pdfData.pages
          .map((page) =>
            page.items
              .map((item) => `${item.text} [x:${item.x}, y:${item.y}]`)
              .join("\n")
          )
          .join("\n\n")
      );
      const parsedData = parsePdfResult(pdfData);

      const records = await getExistingAcademicRecords(LEVELS);

      setExistingRecords(records);
      setResult(parsedData);

      setCourses(
        parsedData.courses.map((course) => ({
          ...course,
          id: createCourseId(),
          originalLevel: Number(course.level),
          level: Number(level),
        }))
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to process the PDF or check your existing academic records."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = (id, field, value) => {
    setCourses((current) =>
      current.map((course) =>
        course.id === id
          ? { ...course, [field]: value }
          : course
      )
    );
  };

  const deleteCourse = (id) => {
    setCourses((current) =>
      current.filter((course) => course.id !== id)
    );
  };

  const handleAddCourse = (e) => {
    e.preventDefault();

    const course = {
      id: createCourseId(),
      code: newCourse.code.trim().toUpperCase(),
      unit: newCourse.unit,
      grade: newCourse.grade,
      level: Number(level),
      originalLevel: null,
      semester: Number(newCourse.semester),
      semesterLabel:
        Number(newCourse.semester) === 1
          ? "First Semester"
          : "Second Semester",
      rawText: "",
    };

    const validated = validateCourses(
      [...courses, course],
      existingRecords
    );

    const addedCourse = validated[validated.length - 1];

    if (!addedCourse.valid) {
      setError(addedCourse.issues.join(" "));
      return;
    }

    setCourses((current) => [...current, course]);

    setNewCourse((current) => ({
      ...current,
      code: "",
      unit: "",
      grade: "",
    }));

    setError("");
    setSuccess("");
  };

  const handleImport = async () => {
    if (!canImport || importing || imported) return;

    if (!navigator.onLine) {
      setError("PDF importing requires an internet connection.");
      setShowImportConfirmation(false);
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");
      setRefreshWarning("");
      setShowImportConfirmation(false);

      const response = await importPdfCourses(
        Number(level),
        reviewedCourses
      );

      setImported(true);

      setSuccess(
        `Successfully imported ${response.insertedCourses} course(s) into Level ${level}. ${response.createdSemesters} new semester(s) created.`
      );

      try {
        await refreshAcademicData({
          queryClient,
          level: Number(level),
        });
      } catch (refreshError) {
        console.error(
          "Academic data refresh failed after successful import:",
          refreshError
        );

        setRefreshWarning(
          "Your courses were imported successfully, but academic statistics could not be refreshed. Please reload the page to update them."
        );
      }
    } catch (err) {
      console.error("PDF import failed:", err);

      setError(
        err.message || "Failed to import courses. Please try again."
      );
    } finally {
      setImporting(false);
      navigate(`/semester?level=${level}`, { replace: true });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    setFile(selectedFile);
    setResult(null);
    setCourses([]);
    setExistingRecords({ levels: [], semesters: [] });
    setImported(false);
    setSuccess("");
    setRefreshWarning("");
    setShowImportConfirmation(false);
    setError("");

    if (selectedFile) {
      if (
        selectedFile.type !== "application/pdf" &&
        !selectedFile.name.toLowerCase().endsWith(".pdf")
      ) {
        setError("Please select a valid PDF file.");
        setFile(null);
        e.target.value = "";
        return;
      }

      handleTest(selectedFile);
    }
  };

  return (
    <div
      className="min-h-screen p-8 text-gray-900
      bg-linear-to-br
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden"
    >
      {/* Header */}
      <div className="fixed top-8 left-6 right-6 z-50 rounded-3xl border border-white/30 bg-white/20 p-5 text-white shadow-xl backdrop-blur-xl sm:p-8">
        <button
          type="button"
          onClick={() => navigate(`/semester?level=${level}`)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25 cursor-pointer"
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/20 text-3xl">
            📄
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Academic Records
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Upload Result
            </h1>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/85">
          Upload your institution's result PDF, review the
          extracted courses, correct any mistakes, and import
          your academic records into EduTrack.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 mt-8 h-[calc(100vh-75px)] overflow-y-auto scrollbar-hide pt-60">

        {/* PDF selection */}
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-100">
              Select result PDF
            </label>

            <div className="rounded-2xl border-2 border-dashed border-white/50 bg-white/20 p-5 transition hover:border-white/80 dark:border-[#64D5E0]/30 dark:bg-white/5 backdrop-blur-xl cursor-pointer">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={loading || importing || imported}
                className="block w-full cursor-pointer text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0D5C75] file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-[#08485D] disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300"
              />

              {file && (
                <p className="mt-3 break-all text-xs font-medium  text-white">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 dark:border-white/10 dark:bg-white/5 shadow-lg">
            <p className="text-xs font-medium text-gray-100">
              IMPORT DESTINATION
            </p>

            <p className="mt-1 text-xl font-bold text-[#07b6c6]">
              Level {level}
            </p>

            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Your extracted courses will be saved under this academic level.
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-[#199FB1]/20 bg-[#199FB1]/5 p-4 dark:border-white/10 dark:bg-white/5">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#199FB1]/30 border-t-[#0D5C75] dark:border-[#64D5E0]/30 dark:border-t-[#64D5E0]" />

              <div>
                <p className="text-sm font-semibold text-[#0D5C75] dark:text-[#64D5E0]">
                  Extracting your result...
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Please wait while EduTrack reads and analyses your PDF.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {result && !loading && (
            <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
              ✓ PDF successfully extracted. Review your courses below.
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-white/10 p-3 text-xs leading-5 text-gray-700 dark:bg-white/5 dark:text-gray-300 shadow-lg">
            <span>ℹ️</span>
            <p>
              PDF importing requires an internet connection.
              Your existing offline course entry remains available.
            </p>
          </div>
        </div>

        {result && (
          <>
            {/* Review summary */}
            <section className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Review Summary
                  </h2>

                  <p className={`mt-1 ${mutedText}`}>
                    Check your extracted academic records.
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    canImport
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {canImport ? "✓ Ready to import" : "Needs attention"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Total courses",
                    value: reviewedCourses.length,
                    color: "text-[#0D5C75] dark:text-[#64D5E0]",
                  },
                  {
                    label: "Total units",
                    value: totalUnits,
                    color: "text-gray-800 dark:text-white",
                  },
                  {
                    label: "Valid courses",
                    value: validCount,
                    color: "text-green-600 dark:text-green-400",
                  },
                  {
                    label: "Needs review",
                    value: invalidCount,
                    color: "text-red-600 dark:text-red-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#199FB1]/15 bg-[#199FB1]/5 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>

                    <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-[#199FB1]/10 p-4 dark:bg-white/5">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Detected levels:</span>{" "}
                  {result.detectedLevels.join(", ") || "None"}
                </p>
              </div>
            </section>

            {/* Extracted courses */}
            <section className="space-y-5">
              <div className="px-1">
                <h2 className="text-xl font-bold text-white">
                  Extracted Courses
                </h2>

                <p className="mt-1 text-sm text-white/80">
                  Review each course carefully. All approved courses
                  will be imported into Level {level}, grouped by
                  their detected semesters.
                </p>
              </div>

              {groups.map((group) => {
                const groupUnits = group.courses.reduce(
                  (sum, course) =>
                    sum +
                    (Number.isInteger(course.unit) && course.unit > 0
                      ? course.unit
                      : 0),
                  0
                );

                return (
                  <div
                    key={`${group.level}-${group.semester}`}
                    className={panelClass}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-white/10">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">
                          {group.semesterLabel}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {group.semesterExists
                            ? "This semester already exists in EduTrack."
                            : "This semester will be created on import."}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#199FB1]/10 px-3 py-2 text-right dark:bg-white/5">
                        <p className="text-sm font-bold text-[#0D5C75] dark:text-[#64D5E0]">
                          {group.courses.length} courses
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {groupUnits} units
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {group.courses.map((course, index) => (
                        <div
                          key={course.id}
                          className="rounded-2xl border border-gray-200 bg-white/60 p-4 dark:border-white/10 dark:bg-[#061E28]/50"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#199FB1]/10 text-xs font-bold text-[#0D5C75] dark:bg-white/10 dark:text-[#64D5E0]">
                                {index + 1}
                              </span>

                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Course details
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteCourse(course.id)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className={labelClass}>
                                Course code
                              </label>

                              <input
                                value={course.code}
                                onChange={(e) =>
                                  updateCourse(
                                    course.id,
                                    "code",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                className={inputClass}
                                placeholder="CSC201"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Unit
                              </label>

                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={course.unit ?? ""}
                                onChange={(e) =>
                                  updateCourse(
                                    course.id,
                                    "unit",
                                    e.target.value
                                  )
                                }
                                className={inputClass}
                                placeholder="3"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Grade
                              </label>

                              <select
                                value={course.grade || ""}
                                onChange={(e) =>
                                  updateCourse(
                                    course.id,
                                    "grade",
                                    e.target.value
                                  )
                                }
                                className={inputClass}
                              >
                                <option value="">Select grade</option>

                                {Object.keys(GRADE_POINTS).map((grade) => (
                                  <option key={grade} value={grade}>
                                    {grade}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Semester
                              </label>

                              <select
                                value={course.semester}
                                onChange={(e) =>
                                  updateCourse(
                                    course.id,
                                    "semester",
                                    Number(e.target.value)
                                  )
                                }
                                className={inputClass}
                              >
                                <option value={1}>First Semester</option>
                                <option value={2}>Second Semester</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Import destination
                              </label>

                              <div className="rounded-xl border border-[#199FB1]/20 bg-[#199FB1]/10 px-3 py-2.5 text-sm font-bold text-[#0D5C75] dark:border-white/10 dark:bg-white/5 dark:text-[#64D5E0]">
                                Level {level}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Original PDF level
                              </label>

                              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                {course.originalLevel ?? "Unknown"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-white/10">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Grade point:{" "}
                              <span className="font-bold text-gray-800 dark:text-white">
                                {course.point ?? "—"}
                              </span>
                            </p>

                            {course.grade === "F" && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                Carryover
                              </span>
                            )}
                          </div>

                          {course.issues.length > 0 && (
                            <div className="mt-4 space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                              {course.issues.map((issue) => (
                                <p key={issue}>• {issue}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {groups.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/50 bg-white/20 p-8 text-center text-sm text-white backdrop-blur-md">
                  No courses remain. Add a course below to continue.
                </div>
              )}
            </section>

            {/* Add missing course */}
            <form
              onSubmit={handleAddCourse}
              className={`${panelClass} text-gray-800 dark:text-gray-100`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#199FB1]/10 text-xl">
                    ➕
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Add Missing Course
                    </h2>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Manually add a course not found in the PDF.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Course code
                  </label>

                  <input
                    required
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse((current) => ({
                        ...current,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    className={inputClass}
                    placeholder="CSC201"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Unit
                  </label>

                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={newCourse.unit}
                    onChange={(e) =>
                      setNewCourse((current) => ({
                        ...current,
                        unit: e.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Grade
                  </label>

                  <select
                    required
                    value={newCourse.grade}
                    onChange={(e) =>
                      setNewCourse((current) => ({
                        ...current,
                        grade: e.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select grade</option>

                    {Object.keys(GRADE_POINTS).map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Import destination
                  </label>

                  <div className="rounded-xl border border-[#199FB1]/20 bg-[#199FB1]/10 px-3 py-2.5 text-sm font-bold text-[#0D5C75] dark:border-white/10 dark:bg-white/5 dark:text-[#64D5E0]">
                    Level {level}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Semester
                  </label>

                  <select
                    value={newCourse.semester}
                    onChange={(e) =>
                      setNewCourse((current) => ({
                        ...current,
                        semester: e.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="1">First Semester</option>
                    <option value="2">Second Semester</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-5 w-full rounded-xl border border-[#0D5C75] px-5 py-3 text-sm font-semibold text-[#0D5C75] transition hover:bg-[#0D5C75] hover:text-white dark:border-[#64D5E0] dark:text-[#64D5E0] dark:hover:bg-[#64D5E0] dark:hover:text-[#021A22] sm:w-auto cursor-pointer"
              >
                + Add Course
              </button>
            </form>

            {/* Import confirmation */}
            <section className={panelClass}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#199FB1]/10 text-xl">
                  📥
                </div>

                <div>
                  <h2 className="font-bold text-gray-800 dark:text-gray-100">
                    Ready to import?
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Final review before saving your result.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#199FB1]/5 p-4 dark:bg-white/5">
                <div className="flex justify-between gap-3 py-2 text-sm">
                  <span className={mutedText}>Destination level</span>
                  <span className="font-bold text-[#199FB1]">Level {level}</span>
                </div>

                <div className="flex justify-between gap-3 border-t border-gray-200 py-2 text-sm dark:border-white/10">
                  <span className={mutedText}>Courses</span>
                  <span className="font-bold text-[#199FB1]">
                    {reviewedCourses.length}
                  </span>
                </div>

                <div className="flex justify-between gap-3 border-t border-gray-200 py-2 text-sm dark:border-white/10">
                  <span className={mutedText}>Total units</span>
                  <span className="font-bold text-[#199FB1]">{totalUnits}</span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                {!destinationLevelExists
                  ? `Please create Level ${level} before importing your result.`
                  : imported
                    ? "Your result has been successfully imported."
                    : canImport
                      ? `You are about to import ${reviewedCourses.length} course(s) into Level ${level}. Existing records will not be overwritten.`
                      : `Resolve the ${invalidCount} invalid course record(s) before importing.`}
              </p>

              {success && (
                <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
                  ✓ {success}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}

              {refreshWarning && (
                <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
                  {refreshWarning}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowImportConfirmation(true)}
                disabled={!canImport || importing || imported}
                className="mt-5 w-full rounded-xl bg-[#0D5C75] px-5 py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#08485D] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {importing
                  ? "Importing..."
                  : imported
                    ? "✓ Import Completed"
                    : "Review and Import Courses"}
              </button>

              {showImportConfirmation && (
                <div className="mt-5 rounded-2xl border border-[#199FB1]/30 bg-[#199FB1]/5 p-5 dark:border-[#64D5E0]/20 dark:bg-white/5">
                  <h3 className="font-bold text-gray-100">
                    Confirm Result Import
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    You are importing {reviewedCourses.length} courses
                    ({totalUnits} units) into Level {level}. This will
                    create missing semesters and update your academic
                    statistics.
                  </p>

                  <p className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-400">
                    Please make sure you have reviewed all course codes,
                    units, grades and semesters. This operation cannot
                    be undone from this screen.
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={importing}
                      className="rounded-xl bg-[#0D5C75] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#08485D] disabled:opacity-50 cursor-pointer"
                    >
                      {importing ? "Importing..." : "Confirm Import"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowImportConfirmation(false)}
                      disabled={importing}
                      className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
        {debugPdfText && (
          <div className="mt-6 rounded-xl bg-white p-4 text-gray-900">
            <h3 className="mb-3 font-bold">
              PDF Extraction Debug
            </h3>

            <textarea
              readOnly
              value={debugPdfText}
              className="h-80 w-full rounded-lg border p-3 text-xs"
            />

            <button
              onClick={() =>
                navigator.clipboard.writeText(debugPdfText)
              }
              className="mt-3 rounded-lg bg-cyan-700 px-4 py-2 text-white"
            >
              Copy Extracted Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfExtract;
