
export default function SemesterCard({ name, gpa, onClick, className }) {

  return (
    <div
      onClick={onClick}
      className={className}
    >
      <h2 className="text-xl font-bold text-white mb-2">
        {name}
      </h2>

      <p className="text-white/80 text-sm mb-4">
        Semester GPA
      </p>

      <div className="text-3xl font-extrabold text-white">
        {gpa}
      </div>
    </div>
  );
}
