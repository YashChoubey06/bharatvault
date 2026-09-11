import apiClient from "./client";

export async function askAssistant({parcelId, question}) {
  const response = await apiClient.post(
    "/assistant/query",
    {
      parcelId,
      question,
    }
  );

  return response.data;
}
