import { MacroSetting } from "@/components/macro-setting";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-lg font-semibold">
            J
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Delivering to</p>
            <button className="text-sm font-semibold" type="button">
              Helsinki, Finland ▾
            </button>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <MacroSetting />
        </div>
      </div>
    </header>
  );
}
