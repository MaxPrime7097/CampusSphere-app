import { useLocation, useParams } from "react-router-dom";
import { ResourceDetailErrorBoundary } from "@/components/errors/ResourceDetailErrorBoundary";
import { ResourceDetail } from "@/pages/ResourceDetail";

export function ResourceDetailRoute() {
  const { id } = useParams();
  const location = useLocation();

  return (
    <ResourceDetailErrorBoundary
      snapshot={{
        routeId: id ?? null,
        pathname: location.pathname,
        search: location.search,
      }}
    >
      <ResourceDetail />
    </ResourceDetailErrorBoundary>
  );
}
