// components/cgpa/CGPAProgress.jsx
import { useEffect, useRef } from "react";

export default function CGPAProgress({ cgpa = 0 }) {
  const progressRef = useRef(null);

  useEffect(() => {
    if (!progressRef.current) return;

    const maxCGPA = 5;
    const safeCGPA = Math.min(Math.max(cgpa, 0), maxCGPA);

    const radius = 72;
    const circumference = Math.PI * radius;
    const progress = safeCGPA / maxCGPA;
    const dashOffset = circumference * (1 - progress);

    const arc = progressRef.current;
    arc.style.strokeDasharray = `${circumference}`;
    arc.style.strokeDashoffset = `${circumference}`;

    setTimeout(() => {
      arc.style.strokeDashoffset = `${dashOffset}`;
    }, 50);
  }, [cgpa]);

  return (
    <div className="relative w-72 h-40">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        <defs>
          {/* 🌈 Gradient */}
          <linearGradient id="cgpaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c35050d2" />
            <stop offset="50%" stopColor="#dbb953e0" />
            <stop offset="100%" stopColor="#72c14e" />
          </linearGradient>
        </defs>

        {/* Background Arc */}
        <path
          d="M 28 100 A 72 72 0 0 1 172 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Progress Arc with Gradient + Glow */}
        <path
          ref={progressRef}
          d="M 28 100 A 72 72 0 0 1 172 100"
          fill="none"
          stroke="url(#cgpaGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          className="transition-all duration-1000 ease"
        />
      </svg>

      {/* CGPA Value */}
      <div className="  absolute top-1/2 right-0 bottom-0 left-0 inset-0 flex flex-col items-center justify-center pb-2">
        <span className="font-bold text-3xl text-white">
          {cgpa.toFixed(2)}
        </span>
        <span className="text-1sm ml-1 text-gray-500 text-white/90">Cumulative GPA</span>
      </div>
    </div>
  );
}
