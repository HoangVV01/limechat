import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilePreviewProps {
  selectedFile: File | null;
  onRemove: () => void;
}

export function FilePreview({ selectedFile, onRemove }: FilePreviewProps) {
  if (!selectedFile) return null;

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return "🖼️";
    } else if (["pdf"].includes(extension || "")) {
      return "📄";
    } else if (["doc", "docx"].includes(extension || "")) {
      return "📝";
    } else if (["xls", "xlsx"].includes(extension || "")) {
      return "📊";
    } else if (["txt"].includes(extension || "")) {
      return "📃";
    } else if (["mp4", "avi", "mov", "wmv"].includes(extension || "")) {
      return "🎥";
    } else if (["mp3", "wav", "flac", "aac"].includes(extension || "")) {
      return "🎵";
    }
    return "📎";
  };

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon(selectedFile.name)}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
