import ChatArea from "@/components/chat/Chat.tsx";
import AppSidebar from "@/components/sidebar/Sidebar.tsx";

function HomePage() {
  return (
    <div className="w-full h-screen grid grid-flow-col grid-col-6">
      <div className="col-span-1">
        <AppSidebar />
      </div>
      <div className="col-span-5">
        <ChatArea />
      </div>
    </div>
  );
}

export default HomePage;
