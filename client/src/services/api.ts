import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
