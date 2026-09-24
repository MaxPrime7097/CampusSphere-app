import { Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingsAppearanceCardProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  language: string;
  onLanguageChange: (value: string) => void;
}

export function SettingsAppearanceCard({
  darkMode,
  onToggleTheme,
  language,
  onLanguageChange,
}: SettingsAppearanceCardProps) {
  return (
    <Card className="campus-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Globe className="h-4 w-4 md:h-5 md:w-5" />
          Apparence et langue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <Label className="text-sm md:text-base">Thème sombre</Label>
            <p className="text-xs md:text-sm text-muted-foreground">
              Basculer entre le thème clair et sombre
            </p>
          </div>
          <Button variant="outline" onClick={onToggleTheme} size="sm" className="w-full sm:w-auto">
            {darkMode ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Clair
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Sombre
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm md:text-base">Langue de l'interface</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English (Coming soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
