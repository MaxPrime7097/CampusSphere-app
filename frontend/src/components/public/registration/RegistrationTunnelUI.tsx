import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistrationTunnelLayoutProps {
  subtitle: string;
  progress: number;
  progressLabels: [string, string, string];
  onBrandClick: () => void;
  children: ReactNode;
  footer?: ReactNode;
  sideVisual?: ReactNode;
}

export function RegistrationTunnelLayout({
  subtitle,
  progress,
  progressLabels,
  onBrandClick,
  children,
  footer,
  sideVisual,
}: RegistrationTunnelLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-4 mx-auto grid lg:grid-cols-2 gap-12 items-center">
      <div className="px-0 sm:px-20">
        <div className="text-center mb-8 cursor-pointer" onClick={onBrandClick}>
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{progressLabels[0]}</span>
            <span>{progressLabels[1]}</span>
            <span>{progressLabels[2]}</span>
          </div>
        </div>

        <div className="space-y-6 bg-card rounded-xl border shadow-sm p-6">{children}</div>
        {footer}
      </div>

      {sideVisual ? <div className="hidden lg:block">{sideVisual}</div> : <div className="hidden lg:block" />}
    </div>
  );
}

export function RegistrationPrimaryButton({ className = "", ...props }: ButtonProps) {
  return <Button className={`campus-gradient text-white hover:opacity-90 ${className}`.trim()} {...props} />;
}

interface RegistrationErrorAlertProps {
  show: boolean;
  message?: string;
}

export function RegistrationErrorAlert({
  show,
  message = "Veuillez corriger les erreurs ci-dessous",
}: RegistrationErrorAlertProps) {
  if (!show) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
