import API from "./api";

/**
 * Finish today's schedule for the authenticated collector
 * Creates a history snapshot in the backend
 */
export async function finishTodaySchedule() {
  const { data } = await API.post("/api/history/finish-today");
  return data;
}

/**
 * List history for the authenticated collector
 */
export async function listMyHistory() {
  const { data } = await API.get("/api/history/my");
  return data;
}

export default { finishTodaySchedule, listMyHistory };
