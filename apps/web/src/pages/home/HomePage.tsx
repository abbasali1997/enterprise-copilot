import ChatNavbar from "@/components/chat/ChatNavbar.tsx";
import ChatArea from "@/components/chat/Chat.tsx";
import AppSidebar from "@/components/sidebar/Sidebar.tsx";
import "./HomePage.css";
import { useParams } from "react-router-dom";

function HomePage() {
  const conversationId = useParams().conversationId;

  return (
    <div className="w-full h-screen grid grid-cols-10 overflow-hidden bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <div className="col-span-2 min-h-0 min-w-0">
        <AppSidebar />
      </div>
      <main id="bg-area" className="col-span-8 min-h-0 min-w-0 w-full h-full overflow-hidden">
        <div
          id="bg-container"
          className="w-full h-full flex min-h-0 min-w-0 flex-col"
        >
          <ChatNavbar />
          <div className="min-h-0 flex-1">
            <ChatArea conversationId={conversationId} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
