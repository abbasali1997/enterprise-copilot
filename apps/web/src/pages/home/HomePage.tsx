import ChatArea from "@/components/chat/chat.tsx";
import AppSidebar from "@/components/sidebar/sidebar.tsx";

function HomePage() {
  return (
    <div className="w-full h-full grid grid-flow-col grid-col-4">
      <div className="col-span-1">
        <AppSidebar />
      </div>
      <div className="col-span-3">
        <ChatArea />
      </div>
    </div>
  );
}

export default HomePage;
