
import test from "node:test";
import assert from "node:assert/strict";

import { parsePdfResult } from "../../src/services/academic/pdfParser.js";

const sampleLines = [
  "UNIVERSITY OF MAIDUGURI",
  "Undergraduate Student Academic Record",
  "CURRENT LEVEL 300",
  "Course results",

  "CSC201 COMPUTER PROGRAMMING",
  "2024/2025",
  "200 / FIRST 17 66 83 2 10.00 A Approved",

  "CSC203 FOUNDATIONS OF SEQUENTIAL PROGRAMMING 2024/2025",
  "200 / FIRST 25 46 71 2 15.00 A Approved",

  "GST211 COMMUNICATION IN ENGLISH II 2024/2025",
  "200 / FIRST 22 34 56 2 6.00 C Approved",

  "GST221 HISTORY AND PHILOSOPHY OF SCIENCE 2024/2025",
  "200 / FIRST 16 42 58 2 6.00 C Approved",

  "GST231 INTRODUCTION TO ENTREPRENEURIAL SKILLS 2024/2025",
  "200 / FIRST 18 40 58 2 6.00 C Approved",

  "MTH201 REAL ANALYSIS I 2024/2025",
  "200 / FIRST 26 58 84 3 15.00 A Approved",

  "MTH201 MATHEMATICAL METHODS I 2024/2025",
  "200 / FIRST 16 35 51 3 9.00 C Approved",

  "MTH203 SETS LOGICS AND ALGEBRA I 2024/2025",
  "200 / FIRST 19 56 75 3 15.00 A Approved",

  "MTH207 REAL ANALYSIS I 2024/2025",
  "200 / FIRST 26 58 84 3 15.00 A Approved",

  "MTH211 MATHEMATICAL METHODS I 2024/2025",
  "200 / FIRST 16 35 51 3 9.00 C Approved",

  "CSC202 COMPUTER PROGRAMMING 2024/2025",
  "200 / SECOND 27 63 90 3 15.00 A Approved",

  "CSC204 FUNDAMENTALS OF DATA STRUCTURES 2024/2025",
  "200 / SECOND 18 40 58 3 9.00 C Approved",

  "CSC206 OPERATING SYSTEMS",
  "2024/2025",
  "200 / SECOND 18 29 47 3 6.00 D Approved",

  "CSC208 COMPUTER HARDWARE 2024/2025",
  "200 / SECOND 27 60 87 3 15.00 A Approved",

  "GST212 PHILOSOPHY AND HUMAN EXISTENCE 2024/2025",
  "200 / SECOND 10 38 48 2 4.00 D Approved",

  "GST224 PEACE STUDIES AND CONFLICT RESOLUTION 2024/2025",
  "200 / SECOND 22 34 56 2 6.00 C Approved",

  "MTH202 ELEMENTARY DIFFERENTIAL EQUATIONS 2024/2025",
  "200 / SECOND 27 58 85 3 15.00 A Approved",

  "MTH204 LINEAR ALGEBRA I I 2024/2025",
  "200 / SECOND 24 47 71 2 10.00 A Approved",

  "STA202 STATISTICS FOR PHYSICAL SCIENCE AND ENGINEERING",
  "2024/2025",
  "200 / SECOND 24 33 57 4 12.00 C Approved",
];

const extractedPdf = {
  pageCount: 1,
  pages: [
    {
      pageNumber: 1,
      items: sampleLines.map((text, index) => ({
        text,
        x: 0,
        y: 1000 - index * 20,
        width: text.length * 5,
        height: 10,
      })),
    },
  ],
};

test("parses all 19 courses into the correct semesters", () => {
  const result = parsePdfResult(extractedPdf, 200);

  assert.equal(result.totalCourses, 19);

  assert.equal(
    result.groups.find((group) => group.semester === 1).courses.length,
    10
  );

  assert.equal(
    result.groups.find((group) => group.semester === 2).courses.length,
    9
  );
});

test("calculates the total units of valid courses", () => {
  const result = parsePdfResult(extractedPdf, 200);

  assert.equal(result.totalUnits, 50);
});

test("flags both duplicate MTH201 records", () => {
  const result = parsePdfResult(extractedPdf, 200);

  const duplicates = result.courses.filter(
    (course) => course.code === "MTH201"
  );

  assert.equal(duplicates.length, 2);
  assert.equal(duplicates.every((course) => !course.valid), true);
  assert.equal(result.invalidCount, 2);
  assert.equal(result.canImport, false);
});

test("detects a level mismatch", () => {
  const result = parsePdfResult(extractedPdf, 300);

  assert.equal(result.hasLevelMismatch, true);
  assert.equal(result.canImport, false);
});
