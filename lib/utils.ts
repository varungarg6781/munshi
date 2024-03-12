import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToAscii(inputString: string) {
  // remove non ascii characters
  const sanitizedString = inputString
    .replace(/[^\x20-\x7E]+/g, "") // Remove non-ASCII
    .replace(/\//g, "_") // Replace slashes
    .replace(/[\s.-]/g, "");
  return sanitizedString;
}
