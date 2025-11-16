"use client";

import { PieChart } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "macro-setting";

export function MacroSetting() {
  const [macro] = useState<string>("Filters");
  const [checks, setChecks] = useState<Record<string, boolean>>({
    onlyProtein: false,
    onlyVegan: false,
    nonVeganOnly: false,
    peanutAllergy: false,
    ketoDiet: false,
    lactoseFree: false,
  });

  useEffect(() => {
    try {
      const rawChecks = localStorage.getItem(`${STORAGE_KEY}-checks`);
      if (rawChecks) {
        const parsed = JSON.parse(rawChecks);
        if (parsed && typeof parsed === "object")
          setChecks(parsed);
      }
    }
    catch {}
  }, []);

  // no-op: macro label is static 'Filters'

  function toggleCheck(key: string) {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`${STORAGE_KEY}-checks`, JSON.stringify(next));
      }
      catch {}
      return next;
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer" aria-label={`Macro: ${macro}`} title={macro}>
          <PieChart className="h-4 w-4" />
          <span className="sr-only">
            Macro setting:
            {macro}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {[
          { key: "onlyProtein", label: "Only protein-rich food" },
          { key: "onlyVegan", label: "Only vegan dishes" },
          { key: "nonVeganOnly", label: "Only non-vegan dishes" },
          { key: "peanutAllergy", label: "Peanut allergy" },
          { key: "ketoDiet", label: "Keto diet" },
          { key: "lactoseFree", label: "Lactose-free" },
        ].map(opt => (
          <DropdownMenuItem
            key={opt.key}
            className="cursor-pointer flex items-center justify-between gap-2"
            onClick={(e) => {
              // clicking the row toggles the checkbox
              e.stopPropagation();
              toggleCheck(opt.key);
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!checks[opt.key]}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleCheck(opt.key);
                }}
                onClick={e => e.stopPropagation()}
                className="h-4 w-4"
                aria-label={`Enable ${opt.label}`}
              />
              <span className="text-sm">{opt.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
