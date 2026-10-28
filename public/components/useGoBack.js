import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * For back arrows: returns to the previous WatCal page in this tab, or goes to `fallback` when there isn't one
 * (the page was opened directly, from a bookmark, in a new tab, or from another website). This way "back"
 * never takes people out of WatCal.
 */
export default function useGoBack(fallback = "/") {
  const navigate = useNavigate();
  const location = useLocation();
  // React Router gives the first page of a visit the key "default"; later pages get their own keys
  const hasPrevious = location.key !== "default";
  return useCallback(() => (hasPrevious ? navigate(-1) : navigate(fallback, { replace: true })), [hasPrevious, navigate, fallback]);
}
