import { createResource } from "solid-js";

import { useApi } from "@revolt/client";

type RootConfig = {
  features?: {
    email?: boolean;
  };
};

/**
 * Whether this server actually sends mail.
 * While the request is in flight, email is treated as off so a reset link
 * does not flash and then lead into a letter that will never arrive.
 */
export function useEmailEnabled() {
  const api = useApi();
  const [config] = createResource(
    () => api.get("/") as Promise<RootConfig>,
  );

  return {
    loading: () => config.loading,
    email: () => config()?.features?.email === true,
  };
}
