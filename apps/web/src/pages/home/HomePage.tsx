import ChatNavbar from "@/components/chat/ChatNavbar.tsx";
import ChatArea from "@/components/chat/Chat.tsx";
import AppSidebar from "@/components/sidebar/Sidebar.tsx";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="w-full h-screen grid grid-cols-9 overflow-hidden">
      <div className="col-span-2 min-h-0 min-w-0">
        <AppSidebar />
      </div>
      <main id="bg-area" className="col-span-7 w-full h-full">
        <div
          id="bg-container"
          className="w-full h-full flex min-h-0 min-w-0 flex-col"
        >
          <ChatNavbar />
          <div className="min-h-0 flex-1">
            <ChatArea />
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
