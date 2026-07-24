
import Header from "../components/layout/Header";

export default function Admin() {
  
  return (
  <div className="min-h-screen p-8 
    bg-linear-to-br 
    from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
    dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">

    <Header title="Admin" subtitle="Manage EduTrack users" />

    <div className="pt-36 px-3 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide">
       Admin
    </div>
  </div>
  );
}

