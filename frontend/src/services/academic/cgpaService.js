import { flattenCourses } from "./courseUtils";
import { resolveCarryovers } from "./carryoverService";

/**
 * Calculates cumulative CGPA
 */
export function calculateCGPA(levels = []) {
  const courses = flattenCourses(levels);
  const resolved = resolveCarryovers(courses);

  let totalUnits = 0;
  let totalPoints = 0;

  resolved.forEach((course) => {
    const unit = Number(course.unit) || 0;
    const point = Number(course.point) || 0;

    totalUnits += unit;
    totalPoints += unit * point;
  });

  return {
    units: totalUnits,
    points: totalPoints,
    cgpa: totalUnits
      ? Number((totalPoints / totalUnits).toFixed(2))
      : 0,
  };
}

/**
 * Calculates GPA for every level
 * Carryovers apply only within the same level.
 */
export function calculateLevelStats(levels = []) {
  const stats = {};

  levels.forEach((level) => {
    // Flatten only this level's courses
    const courses = flattenCourses([level]);

    // Resolve carryovers only inside this level
    const resolved = resolveCarryovers(courses);

    let units = 0;
    let points = 0;

    resolved.forEach((course) => {
      const unit = Number(course.unit) || 0;
      const point = Number(course.point) || 0;

      units += unit;
      points += unit * point;
    });

    stats[level.id] = {
      units,
      points,
      gpa: units
        ? Number((points / units).toFixed(2))
        : 0,
    };
  });

  return stats;
}


/**
 * Calculates GPA for each semester
 * (No carryover logic)
 */
export function calculateSemesterStats(levels = []) {
  const stats = {};

  levels.forEach((level) => {
    level.semesters?.forEach((semester) => {
      let units = 0;
      let points = 0;

      semester.courses?.forEach((course) => {
        const unit = Number(course.unit) || 0;
        const point = Number(course.point) || 0;

        units += unit;
        points += unit * point;
      });

      stats[semester.id] = {
        units,
        points,
        gpa: units
          ? Number((points / units).toFixed(2))
          : 0,
      };
    });
  });

  return stats;
}

/**
 * Calculates everything needed by Profile.jsx
 */
export function calculateProfileStats(levels = []) {
  const { units, points, cgpa } =
    calculateCGPA(levels);

  let semesters = 0;

  levels.forEach((level) => {
    semesters += level.semesters?.length || 0;
  });

  return {
    levels: levels.length,
    semesters,
    units,
    points,
    cgpa,
  };
}