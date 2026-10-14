import { useEffect, useId, useState, type ChangeEvent } from "react";

type OrganizationProfileProps = {
  organizationName: string;
  logoUrl?: string | null;
};

function OrganizationProfile({
  organizationName,
  logoUrl,
}: OrganizationProfileProps) {
  const nameId = useId();
  const logoId = useId();
  const logoHelpId = useId();
  const [name, setName] = useState(organizationName);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const previewUrl = logoPreview ?? logoUrl;

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const onLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError("Choose a PNG, JPG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setLogoError(null);
    setLogoPreview(URL.createObjectURL(file));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg text-black font-bold">Workspace Profile</p>
          <p className="text-gray-600">
            Update your workspace's basic information
          </p>
        </div>
        <button className="cursor-pointer bg-indigo-500 hover:bg-gray-900 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white transition hover:text-white hover:border-gray-900">
          Save Changes
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor={nameId}
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Workspace name
          </label>
          <input
            id={nameId}
            name="organizationName"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter organization name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label
            htmlFor={logoId}
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Logo
          </label>
          <div className="flex flex-wrap items-center gap-5">
            <div className="min-w-0 flex-1 basis-48">
              <input
                id={logoId}
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onLogoChange}
                aria-describedby={logoHelpId}
                aria-invalid={!!logoError}
                className="block w-full rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
              />
              <p id={logoHelpId} className="mt-2 text-xs text-gray-500">
                PNG, JPG, or WebP. Maximum 5 MB.
              </p>
              {logoError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {logoError}
                </p>
              )}
            </div>
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Organization logo preview"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="px-2 text-center text-xs text-gray-400">
                  Logo preview
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrganizationProfile;
