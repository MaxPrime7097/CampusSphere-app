import { Globe, Moon, Sun } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation('settings');

  return (
    <div className="py-5 border-b border-border/40 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground flex-shrink-0">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{t('appearance.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('appearance.darkThemeDesc')}</p>
        </div>
      </div>
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <Label className="text-sm font-medium">{t('appearance.darkTheme')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('appearance.darkThemeDesc')}
            </p>
          </div>
          <Button variant="outline" onClick={onToggleTheme} size="sm" className="w-full sm:w-auto h-8 px-3 text-xs">
            {darkMode ? (
              <>
                <Sun className="h-3.5 w-3.5 mr-2" />
                {t('appearance.light')}
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 mr-2" />
                {t('appearance.dark')}
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div>
            <Label className="text-sm font-medium">{t('appearance.language')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('appearance.language')}
            </p>
          </div>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-full sm:w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
