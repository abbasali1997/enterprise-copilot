import AIPreferences from "./workspaceSettings/AIPreferences.tsx";
import OrganizationProfile from "./workspaceSettings/OrganizationProfile.tsx";
import DeleteWorkspace from "./workspaceSettings/DeleteWorkspace.tsx";

type WorkspaceSettingsProps = {
  organizationName: string;
  logoUrl?: string | null;
};

function WorkspaceSettings({
  organizationName,
  logoUrl,
}: WorkspaceSettingsProps) {
  return (
    <section
      aria-label="Workspace settings"
      className="flex h-full min-h-0 min-w-0 flex-col gap-5 overflow-y-auto lg:grid lg:grid-cols-9 lg:grid-rows-12 lg:overflow-hidden"
    >
      <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-6 lg:row-span-8 lg:min-h-0 lg:overflow-y-auto">
        <OrganizationProfile
          organizationName={organizationName}
          logoUrl={logoUrl}
        />
      </div>
      <div className="min-h-40 shrink-0 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-3 lg:col-start-7 lg:row-span-12 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto">
        <AIPreferences />
      </div>
      <div className="shrink-0 rounded-xl bg-red-100 p-5 lg:col-span-6 lg:row-span-4 lg:row-start-9 lg:min-h-0 lg:overflow-y-auto">
        <DeleteWorkspace />
      </div>
    </section>
  );
}

export default WorkspaceSettings;
