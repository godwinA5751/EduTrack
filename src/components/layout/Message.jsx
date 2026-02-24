import { useState, useEffect } from "react";

const messages = [
  "Start tracking your academic progress from 100 Level. Keeping records from the beginning helps you monitor your GPA growth, identify weak areas early, and maintain a clear and accurate CGPA history throughout your university journey.",
  "Your academic journey starts from 100 Level — don’t miss it! Tracking your results from the beginning gives you a complete picture of your progress and helps you stay on top of your CGPA goals.",
  "Early tracking = Better academic control.",
  "Many students start tracking their results late and lose accurate records. Start from 100 Level to maintain a complete academic history and make smarter academic decisions.",
  "Let’s build your academic record the right way 📘 📈",
  "Start tracking from 100 Level to keep your CGPA history complete and reliable throughout your university journey.",
  "A clean CGPA record starts from your first level. Begin tracking from 100 Level to ensure accurate academic insights and long-term performance monitoring.",
];

export default function Message() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        (prev + 1) % messages.length
      );
    }, 5000); // ⏱ Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[160px] lg:w-xl lg:mt-20">
      <div className="max-w-full lg:max-w-xl mx-auto p-3 bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-xl text-white/80 shadow-lg font-semibold transition-all duration-500">
        {messages[messageIndex]}
      </div>
    </div>
  );
}
