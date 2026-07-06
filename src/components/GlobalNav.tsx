import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

const linkBase =
  "relative px-2 py-1 text-xs font-medium transition-colors";

export function GlobalNav() {
  return (
    <nav className="flex h-11 shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <div className="rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-1">
          <Activity className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-100">
          AI Cost Canvas
        </span>
      </Link>
      <div className="mx-1 h-5 w-px bg-zinc-800" />
      <div className="flex items-center gap-1">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className={`${linkBase} text-zinc-500 hover:text-zinc-200`}
          activeProps={{
            className: `${linkBase} text-zinc-100 after:absolute after:inset-x-2 after:-bottom-[13px] after:h-[2px] after:bg-indigo-400`,
          }}
        >
          Sandbox
        </Link>
        <Link
          to="/ledger"
          className={`${linkBase} text-zinc-500 hover:text-zinc-200`}
          activeProps={{
            className: `${linkBase} text-zinc-100 after:absolute after:inset-x-2 after:-bottom-[13px] after:h-[2px] after:bg-indigo-400`,
          }}
        >
          Ledger
        </Link>
      </div>
    </nav>
  );
}
