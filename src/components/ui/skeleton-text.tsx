import { cn } from "@/lib/utils";

interface SkeletonTextProps {
  className?: string;
}

export function SkeletonText({ className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {/* First paragraph */}
      <div className="space-y-2">
        <div className="h-4 bg-gradient-to-r from-accent-emerald/20 via-accent-yellow/20 to-accent-orange/20 rounded bg-[length:200%_100%] animate-gradient-x" />
        <div className="h-4 bg-gradient-to-r from-accent-yellow/20 via-accent-orange/20 to-accent-coral/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:0.2s]" />
        <div className="h-4 w-4/5 bg-gradient-to-r from-accent-orange/20 via-accent-coral/20 to-accent-purple/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:0.4s]" />
      </div>

      {/* Second paragraph */}
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-gradient-to-r from-accent-coral/20 via-accent-purple/20 to-accent-blue/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:0.6s]" />
        <div className="h-4 bg-gradient-to-r from-accent-purple/20 via-accent-blue/20 to-accent-emerald/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:0.8s]" />
        <div className="h-4 w-5/6 bg-gradient-to-r from-accent-blue/20 via-accent-emerald/20 to-accent-yellow/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:1s]" />
      </div>

      {/* Third paragraph */}
      <div className="space-y-2">
        <div className="h-4 bg-gradient-to-r from-accent-emerald/20 via-accent-orange/20 to-accent-purple/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:1.2s]" />
        <div className="h-4 w-2/3 bg-gradient-to-r from-accent-yellow/20 via-accent-coral/20 to-accent-blue/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:1.4s]" />
      </div>

      {/* Fourth paragraph */}
      <div className="space-y-2">
        <div className="h-4 w-4/5 bg-gradient-to-r from-accent-orange/20 via-accent-purple/20 to-accent-emerald/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:1.6s]" />
        <div className="h-4 bg-gradient-to-r from-accent-coral/20 via-accent-blue/20 to-accent-yellow/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:1.8s]" />
        <div className="h-4 w-3/4 bg-gradient-to-r from-accent-purple/20 via-accent-emerald/20 to-accent-orange/20 rounded bg-[length:200%_100%] animate-gradient-x [animation-delay:2s]" />
      </div>
    </div>
  );
}
