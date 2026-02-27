import { Navigate } from "@revolt/routing";

/**
 * Flow for logging into an account — redirects to /login (FlowHome)
 */
export default function FlowLogin() {
  return <Navigate href="/login" />;
}
