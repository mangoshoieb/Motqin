type SkeletonProps = {
    className?: string;
  };
  
  export default function Skeleton({
    className = "",
  }: SkeletonProps) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-zinc-300 dark:bg-zinc-800 ${className}`}
      >
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
      </div>
    );
  }