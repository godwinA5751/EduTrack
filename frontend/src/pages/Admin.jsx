
import Header from "../components/layout/Header";
import StatCard from "../components/admin/StatCard";
import { FaUsers } from "react-icons/fa"
export default function Admin() {
  
  return (
  <div className="min-h-screen p-8 
    bg-linear-to-br 
    from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
    dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">

    <Header title="Admin" subtitle="Manage EduTrack users" />

    <div className="pt-36 px-3 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide">
       Admin
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <StatCard
    title="Total Users"
    value={0}
    icon={<FaUsers />}
    active={false}
    onClick={() => {}}
  />
</div>
    </div>
  </div>
  );
}

