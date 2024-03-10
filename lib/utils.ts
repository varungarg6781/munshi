import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToAscii(inputString: string) {
  // remove non ascii characters
  console.log("Inout string fed to convertToAscii method - ", inputString);
  // const asciiString = inputString.replace(/[^\x00-\x7F]+/g, "");
  const sanitizedString = inputString
    .replace(/[^\x20-\x7E]+/g, "") // Remove non-ASCII
    .replace(/\//g, "_") // Replace slashes
    .replace(/[\s.-]/g, "");
  console.log("result from convertToAscii method - ", sanitizedString);
  return sanitizedString;
}
