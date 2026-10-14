import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card role="alert" className="flex flex-col items-start gap-3 border-red-200 bg-red-50 p-5">
      <div>
        <p className="font-semibold text-red-800">Something went wrong</p>
        <p className="text-sm text-red-800">{message}</p>
      </div>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-slate-300 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
