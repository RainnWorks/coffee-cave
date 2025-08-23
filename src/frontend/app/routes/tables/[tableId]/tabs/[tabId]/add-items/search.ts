import {
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const urlKeys = {
  categoryId: "cid",
  searchTerm: "q",
};

export const searchParams = {
  categoryId: parseAsString,
  searchTerm: parseAsString,
};