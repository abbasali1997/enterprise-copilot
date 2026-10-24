import { useId, useState } from "react";

function AIPreferences() {
  const modelId = useId();
  const styleId = useId();
  const languageId = useId();
  const [model, setModel] = useState("gpt-4o");
  const [responseStyle, setResponseStyle] = useState("balanced");
  const [language, setLanguage] = useState("en");
  const [appliedPreferences, setAppliedPreferences] = useState({
    model: "gpt-4o",
    responseStyle: "balanced",
    language: "en",
  });
  const hasChanges = model !== appliedPreferences.model ||
    responseStyle !== appliedPreferences.responseStyle ||
    language !== appliedPreferences.language;

  const resetToDefault = () => {
    setModel("gpt-4o");
    setResponseStyle("balanced");
    setLanguage("en");
  };

  const selectClassName = "w-full rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-950/60 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-cyan-400/15";

  return (
    <section aria-label="AI preferences">
      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">AI Preferences</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
        Choose the default model, response style, and language for your workspace.
      </p>
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); setAppliedPreferences({ model, responseStyle, language }); }}>
        <div>
          <label htmlFor={modelId} className="mb-2 block text-sm font-medium text-gray-900 dark:text-slate-100">
            Default AI Model
          </label>
          <select id={modelId} name="defaultModel" value={model} onChange={(event) => setModel(event.target.value)} className={selectClassName}>
            <option value="gpt-4o">GPT-4o</option>
          </select>
        </div>
        <div>
          <label htmlFor={styleId} className="mb-2 block text-sm font-medium text-gray-900 dark:text-slate-100">
            Default Response Style
          </label>
          <select id={styleId} name="responseStyle" value={responseStyle} onChange={(event) => setResponseStyle(event.target.value)} className={selectClassName}>
            <option value="balanced">Balanced</option>
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <div>
          <label htmlFor={languageId} className="mb-2 block text-sm font-medium text-gray-900 dark:text-slate-100">
            Language
          </label>
          <select id={languageId} name="language" value={language} onChange={(event) => setLanguage(event.target.value)} className={selectClassName}>
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetToDefault}
            className="rounded-lg border border-gray-300 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 transition hover:bg-gray-50 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-cyan-300"
          >
            Reset To Default
          </button>
          <button
            type="submit"
            disabled={!hasChanges}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </form>
    </section>
  );
}

export default AIPreferences;
