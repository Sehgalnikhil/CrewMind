import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function extractErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = (error.response as { data?: { detail?: string } }).data;
    if (data?.detail) return data.detail;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
