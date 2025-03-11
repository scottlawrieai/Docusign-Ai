import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Pencil, UserPlus, Send } from "lucide-react";

interface DocumentEditorProps {
  documentName?: string;
  documentUrl?: string;
  onBack?: () => void;
  onSave?: () => void;
  onAddSignatory?: () => void;
  onSend?: () => void;
}

const DocumentEditor = ({
  documentName = "Contract Agreement.pdf",
  documentUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80", // Placeholder for document preview
  onBack,
  onSave,
  onAddSignatory,
  onSend,
}: DocumentEditorProps) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [signatureFields, setSignatureFields] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  const handleAddSignatureField = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab === "edit") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setSignatureFields([
        ...signatureFields,
        { id: `sig-${Date.now()}`, x, y },
      ]);
    }
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-medium ml-2">{documentName}</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onAddSignatory}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Signatory
          </Button>
          <Button size="sm" onClick={onSend}>
            <Send className="h-4 w-4 mr-2" />
            Send for Signature
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger value="edit">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="flex-1 p-4 overflow-auto">
          <div
            className="relative w-full h-full border rounded-lg overflow-auto bg-white flex items-center justify-center"
            onClick={handleAddSignatureField}
          >
            <img
              src={documentUrl}
              alt="Document Preview"
              className="max-w-full max-h-full object-contain"
            />

            {signatureFields.map((field) => (
              <div
                key={field.id}
                className="absolute border-2 border-primary bg-primary/10 rounded p-2 cursor-move"
                style={{
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="text-xs font-medium">Signature</span>
              </div>
            ))}

            {signatureFields.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <Pencil className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Click anywhere to add signature fields
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag to reposition after placing
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
          <div className="w-full h-full border rounded-lg overflow-auto bg-white flex items-center justify-center">
            <img
              src={documentUrl}
              alt="Document Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentEditor;
