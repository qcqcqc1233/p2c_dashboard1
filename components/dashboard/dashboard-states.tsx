import { AlertTriangle, Route } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-in fade-in">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function NoMatch() {
  return (
    <div className="glass-card rounded-xl p-10 text-center">
      <p className="text-foreground font-medium">No conversions matched.</p>
      <p className="text-sm text-muted-foreground mt-1">
        The file parsed correctly but no path passed the filter. Try clearing the campaign filter.
      </p>
    </div>
  );
}

export function NeedsData({
  title = "Ready to map your conversion paths",
  message = "Upload a CM360 Path to Conversion CSV above (or load the sample) to populate this view.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 flex items-center justify-center mb-4">
        <Route className="w-7 h-7 text-neon-cyan" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl h-[120px] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="glass-card rounded-xl h-[360px] xl:col-span-2 animate-pulse" />
        <div className="glass-card rounded-xl h-[360px] xl:col-span-3 animate-pulse" />
      </div>
    </div>
  );
}
