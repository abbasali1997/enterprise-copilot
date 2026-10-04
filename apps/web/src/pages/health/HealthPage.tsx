import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

function HealthPage() {
  const trpc = useTRPC();
  const {
    data: health,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    ...trpc.health.check.queryOptions(),
    enabled: true,
  });

  return (
    <main>
      <h1>Server health</h1>
      <div aria-live="polite">
        {isPending ? (
          <p>Checking server health...</p>
        ) : isError ? (
          <p role="alert">Health check failed: {error.message}</p>
        ) : (
          <p>
            Status:{" "}
            <span style={{ color: "green", fontWeight: "bold", fontSize: 30 }}>
              {health.status}
            </span>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
      >
        {isFetching ? "Checking..." : "Check again"}
      </button>
    </main>
  );
}

export default HealthPage;
