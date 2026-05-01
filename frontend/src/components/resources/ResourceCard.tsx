import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, Download, Eye, Bookmark, 
  Video, FileCode, Archive, FileImage, 
  Loader2, Zap 
} from "lucide-react";
import { getTypeLabel, getSubjectLabel } from "@/lib/resourceMetadata";
import { formatFileSize, cn } from "@/lib/utils";

interface ResourceCardProps {
  resource: any;
  isDownloading?: boolean;
  isSaved?: boolean;
  onDownload?: (e: React.MouseEvent) => void;
  onSave?: (e: React.MouseEvent) => void;
  onPreview?: (e: React.MouseEvent) => void;
  className?: string;
}

export const ResourceCard = React.memo(({ 
  resource, isDownloading, isSaved, 
  onDownload, onSave, onPreview, className 
}: ResourceCardProps) => {
  const navigate = useNavigate();

  const getFileIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("video")) return <Video className="h-7 w-7" />;
    if (t.includes("image")) return <FileImage className="h-7 w-7" />;
    if (t.includes("code") || t.includes("project")) return <FileCode className="h-7 w-7" />;
    if (t.includes("archive") || t.includes("zip")) return <Archive className="h-7 w-7" />;
    return <FileText className="h-7 w-7" />;
  };

  const getIconColor = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("notes") || t.includes("resumes")) return "text-blue-500 bg-blue-50/50";
    if (t.includes("exercises") || t.includes("annales")) return "text-red-500 bg-red-50/50";
    if (t.includes("projects") || t.includes("presentations")) return "text-amber-500 bg-amber-50/50";
    return "text-primary bg-primary/5";
  };

  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 campus-card cursor-pointer border-none bg-card/50 backdrop-blur-sm active:scale-[0.98]",
        className
      )}
      onClick={() => navigate(`/resources/${resource.id}`)}
    >
      <CardContent className="p-0">
        {/* Icon Header */}
        <div className={cn("h-24 flex flex-col items-center justify-center transition-colors duration-300", getIconColor(resource.type))}>
          <div className="p-3 rounded-2xl bg-background/50 shadow-sm transition-transform duration-300 group-hover:scale-110">
            {getFileIcon(resource.type)}
          </div>
          <span className="text-[9px] mt-2 font-bold uppercase tracking-widest opacity-60">
            {getTypeLabel(resource.type)}
          </span>
        </div>

        <div className="p-4 space-y-3">
          <div className="min-h-[50px]">
            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {resource.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-[9px] py-0 h-4 px-1.5 font-semibold bg-primary/10 text-primary border-none">
                {getSubjectLabel(resource.subject)}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-medium">
                {formatFileSize(resource.fileSize)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-muted/50">
            <span className="truncate max-w-[80px]">Par {resource.authorName}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {resource.viewCount || 0}</span>
              <span className="flex items-center gap-0.5"><Download className="h-3 w-3" /> {resource.downloadCount || 0}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 hover:text-primary border-muted transition-all active:scale-90" 
              onClick={onPreview} 
              title="Aperçu"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className={cn("h-8 w-8 p-0 rounded-lg transition-all border-muted active:scale-90", isSaved ? "text-primary bg-primary/5 border-primary/20" : "")} 
              onClick={onSave}
              title="Sauvegarder"
            >
              <Bookmark className={cn("h-3.5 w-3.5", isSaved ? "fill-current" : "")} />
            </Button>
            <Button 
              size="sm" 
              className="h-8 flex-1 gap-1 campus-gradient text-white rounded-lg shadow-sm hover:opacity-90 transition-all active:scale-95" 
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" /> 
                  <span className="text-xs font-semibold">Télécharger</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ResourceCard.displayName = "ResourceCard";
