import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Plus, Star, StarOff } from "lucide-react";
import { getUserTemplates, createTemplateFromDocument } from "@/lib/documents";

interface Template {
  id: string;
  title: string;
  created_at: string;
  is_favorite: boolean;
  thumbnail_url?: string;
}

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
  currentDocumentId?: string;
}

const TemplateLibrary = ({
  open,
  onOpenChange,
  onSelectTemplate,
  currentDocumentId,
}: TemplateLibraryProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingAsTemplate, setSavingAsTemplate] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!open) return;

      try {
        setIsLoading(true);
        const templatesData = await getUserTemplates();
        setTemplates(templatesData);
        setFilteredTemplates(templatesData);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter((template) =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
    onOpenChange(false);
  };

  const handleToggleFavorite = async (
    templateId: string,
    isFavorite: boolean,
  ) => {
    // This would be implemented in your documents.ts library
    // For now, we'll just update the UI
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, is_favorite: !isFavorite }
          : template,
      ),
    );
  };

  const handleSaveAsTemplate = async () => {
    if (!currentDocumentId) return;

    try {
      setSavingAsTemplate(true);
      await createTemplateFromDocument(currentDocumentId);
      // Refresh templates
      const templatesData = await getUserTemplates();
      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
    } catch (error) {
      console.error("Error saving as template:", error);
    } finally {
      setSavingAsTemplate(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Document Templates
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {currentDocumentId && (
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={handleSaveAsTemplate}
              disabled={savingAsTemplate}
            >
              <Plus className="h-4 w-4 mr-2" />
              {savingAsTemplate
                ? "Saving..."
                : "Save Current Document as Template"}
            </Button>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No templates match your search"
                      : "No templates found"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-md overflow-hidden hover:border-primary cursor-pointer group"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <div className="relative h-24 bg-muted flex items-center justify-center">
                        {template.thumbnail_url ? (
                          <img
                            src={template.thumbnail_url}
                            alt={template.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                        <button
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(
                              template.id,
                              template.is_favorite,
                            );
                          }}
                        >
                          {template.is_favorite ? (
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">
                          {template.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(template.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateLibrary;
