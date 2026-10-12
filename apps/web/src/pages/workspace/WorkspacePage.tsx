import AppSidebar from "@/components/sidebar/Sidebar.tsx";

function WorkspacePage() {
  return (
    <div className="w-full h-screen grid grid-cols-9 overflow-hidden">
      <div className="col-span-2 min-h-0 min-w-0">
        <AppSidebar />
      </div>
      <main id="chat-area" className="col-span-7 w-full h-full">
        <div
          id="chat-container"
          className="w-full h-full flex min-h-0 min-w-0 flex-col"
        >
          Organization Manage
        </div>
      </main>
    </div>
  );
}

export default WorkspacePage;
