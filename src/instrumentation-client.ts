import { reportClientError } from "./lib/client-monitoring";
if (process.env.NEXT_PUBLIC_ERROR_MONITORING_ENABLED === "true") {
  window.addEventListener("error", () => reportClientError("client_error"));
  window.addEventListener("unhandledrejection", () => reportClientError("client_rejection"));
}
