"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { searchParams } from "../search";

export const useSearchTerm = () =>
  useQueryState("searchTerm", searchParams.searchTerm);

export const SearchBox = () => {
  const [searchTerm, setSearchTerm] = useSearchTerm();

  return (
    <div className="p-4 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm ?? ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};
