"use client";

import { ChevronDown, MapPin } from "lucide-react";
import Link from "next/link";

import { MacroSetting } from "@/components/macro-setting";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight">Zaglot</span>
          </div>
        </Link>

        {/* Delivery Location */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Helsinki, Finland
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuItem className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Helsinki, Finland
              </span>
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem>Tampere, Finland</DropdownMenuItem>
            <DropdownMenuItem>Espoo, Finland</DropdownMenuItem>
            <DropdownMenuItem>Turku, Finland</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MacroSetting />
        </div>
      </div>
    </header>
  );
}
