type SidebarItemProps = {
  children: React.ReactNode;
  active?: boolean;
};

const SidebarItem = ({ children, active = false }: SidebarItemProps) => {
  return (
    <button
      className={`
        flex w-full items-center rounded-md px-3 py-2 text-left text-sm
        transition-colors
        ${
          active
            ? "bg-gray-100 font-medium text-gray-950"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
        }
      `}
    >
      {children}
    </button>
  );
};

const AppSidebar = () => {
  return (
    <aside className="w-full h-full flex shrink-0 flex-col border-r bg-white">
      <div className="p-4">
        <button className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
          + New Chat
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <SidebarItem active>Conversations</SidebarItem>

        <SidebarItem>Knowledge</SidebarItem>
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-gray-400">CompanyGPT</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
