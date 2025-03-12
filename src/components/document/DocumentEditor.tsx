import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Pencil,
  UserPlus,
  Send,
  Trash2,
  Download,
  FileText,
  Plus,
  Type,
  CalendarIcon,
  AtSign,
  MapPin,
  Phone,
  Building2,
  User,
  FileSignature,
  Loader2,
} from "lucide-react";
import SignaturePad from "@/components/ui/signature-pad";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldType =
  | "signature"
  | "initials"
  | "name"
  | "email"
  | "date"
  | "address"
  | "title"
  | "company"
  | "phone";

interface Field {
  id: string;
  x: number;
  y: number;
  type: FieldType;
  value?: string;
  width?: number;
  height?: number;
}

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
  const [fields, setFields] = useState<Field[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState("");
  const [zoom, setZoom] = useState(1);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [fieldTypeToAdd, setFieldTypeToAdd] = useState<FieldType>("signature");
  const [textInputDialogOpen, setTextInputDialogOpen] = useState(false);
  const [currentTextValue, setCurrentTextValue] = useState("");

  useEffect(() => {
    // Set up document loading state
    setIsDocumentLoading(true);

    // Create an image element to check when the document is loaded
    const img = new Image();
    img.onload = () => {
      setIsDocumentLoading(false);
      console.log("Document image loaded successfully");
    };
    img.onerror = (e) => {
      console.error("Error loading document image:", e);
      setIsDocumentLoading(false);
    };

    // Add crossOrigin attribute to handle CORS issues
    img.crossOrigin = "anonymous";
    img.src = documentUrl;

    console.log("Attempting to load document from URL:", documentUrl);

    return () => {
      // Clean up
      img.onload = null;
      img.onerror = null;
    };
  }, [documentUrl]);

  // Track resizing of fields
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const fieldId = element.getAttribute("data-field-id");
        if (fieldId) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;

          setFields((prev) =>
            prev.map((field) =>
              field.id === fieldId ? { ...field, width, height } : field,
            ),
          );
        }
      }
    });

    // Observe all field elements
    document.querySelectorAll("[data-field-id]").forEach((el) => {
      resizeObserver.observe(el);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [fields.length]);

  const handleAddField = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("handleAddField called", e.target);
    if (activeTab === "edit") {
      // Prevent adding fields when clicking on existing fields
      if ((e.target as HTMLElement).closest('[draggable="true"]')) {
        console.log("Clicked on existing field, ignoring");
        return;
      }

      // Get coordinates relative to the clicked element
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      console.log(`Adding field at position: ${x}%, ${y}%`);

      const newField: Field = {
        id: `field-${Date.now()}`,
        x,
        y,
        type: fieldTypeToAdd,
        width: 120,
        height: 60,
      };

      setFields((prevFields) => [...prevFields, newField]);
      console.log("Field added", newField);

      // For fields that need immediate text input, open the dialog
      if (
        fieldTypeToAdd !== "signature" &&
        fieldTypeToAdd !== "initials" &&
        fieldTypeToAdd !== "date"
      ) {
        setSelectedField(newField.id);
        setCurrentTextValue("");
        setTextInputDialogOpen(true);
      } else if (
        fieldTypeToAdd === "signature" ||
        fieldTypeToAdd === "initials"
      ) {
        // For signature fields, open the signature dialog immediately
        setSelectedField(newField.id);
        setCurrentSignature("");
        setSignatureDialogOpen(true);
      } else if (fieldTypeToAdd === "date") {
        // For date fields, set current date
        setSelectedField(newField.id);
        setCurrentTextValue(new Date().toISOString().split("T")[0]);
        setTextInputDialogOpen(true);
      }
    }
  };

  const handleSaveClick = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Allow dragging fields
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData("fieldId", fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldId = e.dataTransfer.getData("fieldId");
    if (!fieldId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, x, y } : field)),
    );
  };

  const handleFieldClick = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent adding new field
    setSelectedField(fieldId);

    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    if (field.type === "signature" || field.type === "initials") {
      // For signature/initials fields
      if (field.value) {
        setCurrentSignature(field.value);
      } else {
        setCurrentSignature("");
      }
      setSignatureDialogOpen(true);
    } else if (field.type === "date") {
      // For date fields, set current date if empty
      const currentDate = field.value || new Date().toISOString().split("T")[0];
      setCurrentTextValue(currentDate);
      setTextInputDialogOpen(true);
    } else {
      // For text-based fields
      setCurrentTextValue(field.value || "");
      setTextInputDialogOpen(true);
    }
  };

  const handleSignatureChange = (dataUrl: string) => {
    setCurrentSignature(dataUrl);
  };

  const handleSignatureSave = () => {
    if (selectedField) {
      setFields((prev) =>
        prev.map((field) =>
          field.id === selectedField
            ? { ...field, value: currentSignature }
            : field,
        ),
      );
      setSignatureDialogOpen(false);
      setSelectedField(null);
    }
  };

  const handleTextInputSave = () => {
    if (selectedField) {
      setFields((prev) =>
        prev.map((field) =>
          field.id === selectedField
            ? { ...field, value: currentTextValue }
            : field,
        ),
      );
      setTextInputDialogOpen(false);
      setSelectedField(null);
    }
  };

  const handleDeleteField = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFields((prev) => prev.filter((field) => field.id !== fieldId));
  };

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case "signature":
        return <FileSignature className="h-4 w-4" />;
      case "initials":
        return <Type className="h-4 w-4" />;
      case "name":
        return <User className="h-4 w-4" />;
      case "email":
        return <AtSign className="h-4 w-4" />;
      case "date":
        return <CalendarIcon className="h-4 w-4" />;
      case "address":
        return <MapPin className="h-4 w-4" />;
      case "title":
        return <Pencil className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      default:
        return <Pencil className="h-4 w-4" />;
    }
  };

  const getFieldLabel = (type: FieldType) => {
    switch (type) {
      case "signature":
        return "Signature";
      case "initials":
        return "Initials";
      case "name":
        return "Full Name";
      case "email":
        return "Email Address";
      case "date":
        return "Date";
      case "address":
        return "Address";
      case "title":
        return "Title";
      case "company":
        return "Company Name";
      case "phone":
        return "Phone Number";
      default:
        return "Field";
    }
  };

  const getFieldPlaceholder = (type: FieldType) => {
    switch (type) {
      case "signature":
        return "Signature";
      case "initials":
        return "AB";
      case "name":
        return "John Doe";
      case "email":
        return "email@example.com";
      case "date":
        return "YYYY-MM-DD";
      case "address":
        return "123 Main St, City, State";
      case "title":
        return "Job Title";
      case "company":
        return "Company Name";
      case "phone":
        return "(123) 456-7890";
      default:
        return "";
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
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
        <div className="border-b px-4 flex justify-between items-center">
          <div className="flex items-center">
            <TabsList className="mt-2 mr-4">
              <TabsTrigger value="edit">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {activeTab === "edit" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    {getFieldIcon(fieldTypeToAdd)}
                    <span className="ml-2">
                      {getFieldLabel(fieldTypeToAdd)}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Click to change)
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => setFieldTypeToAdd("signature")}
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    Signature
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFieldTypeToAdd("initials")}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Initials
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFieldTypeToAdd("name")}>
                    <User className="h-4 w-4 mr-2" />
                    Full Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFieldTypeToAdd("email")}>
                    <AtSign className="h-4 w-4 mr-2" />
                    Email Address
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFieldTypeToAdd("date")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Date
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFieldTypeToAdd("address")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFieldTypeToAdd("title")}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFieldTypeToAdd("company")}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Company Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFieldTypeToAdd("phone")}>
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              -
            </Button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              +
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomReset}>
              Reset
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="flex-1 p-4 overflow-auto">
          <div
            ref={documentContainerRef}
            className="relative w-full h-full border rounded-lg overflow-auto bg-white flex items-center justify-center p-0"
            style={{ height: "calc(100vh - 200px)" }}
            onClick={(e) => {
              console.log("Container clicked");
              handleAddField(e);
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isDocumentLoading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  Loading document preview...
                </p>
              </div>
            ) : (
              <div
                className="relative"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s",
                  minWidth: "850px",
                  minHeight: "1100px",
                  width: "100%",
                  height: "100%",
                  cursor: activeTab === "edit" ? "crosshair" : "default",
                  pointerEvents: "none", // Make this div transparent to clicks
                }}
              >
                {documentUrl.toLowerCase().endsWith(".pdf") ? (
                  <object
                    data={documentUrl}
                    type="application/pdf"
                    className="w-full h-full min-h-[1100px] min-w-[850px]"
                    style={{ height: "calc(100vh - 200px)" }}
                    onLoad={() => setIsDocumentLoading(false)}
                    onError={(e) => {
                      console.error("Error loading PDF document:", e);
                      setIsDocumentLoading(false);
                    }}
                  >
                    <div className="p-4 text-center">
                      <p>
                        Unable to display PDF.{" "}
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Download
                        </a>{" "}
                        instead.
                      </p>
                    </div>
                  </object>
                ) : (
                  <img
                    src={documentUrl}
                    alt="Document Preview"
                    className="w-auto h-auto object-contain"
                    style={{
                      minWidth: "850px",
                      minHeight: "1100px",
                      maxHeight: "calc(100vh - 200px)",
                      pointerEvents: "none", // Make image transparent to clicks
                    }}
                    crossOrigin="anonymous"
                    onLoad={() => setIsDocumentLoading(false)}
                    onError={(e) => {
                      console.error("Error loading document image:", e);
                      setIsDocumentLoading(false);
                    }}
                  />
                )}

                {!isDocumentLoading &&
                  fields.map((field) => (
                    <div
                      key={field.id}
                      data-field-id={field.id}
                      className={`absolute border-2 ${field.value ? "border-green-500 bg-green-50" : "border-primary bg-primary/10"} rounded p-2 cursor-move z-10`}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        transform: "translate(-50%, -50%)",
                        minWidth: "100px",
                        minHeight: "40px",
                        pointerEvents: "auto", // Make fields clickable
                        width: field.width ? `${field.width}px` : "auto",
                        height: field.height ? `${field.height}px` : "auto",
                        position: "absolute",
                        resize: "both",
                        overflow: "auto",
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field.id)}
                      onClick={(e) => handleFieldClick(field.id, e)}
                    >
                      {field.value ? (
                        <div className="flex flex-col items-center w-full h-full">
                          {field.type === "signature" ||
                          field.type === "initials" ? (
                            <img
                              src={field.value}
                              alt={field.type}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <div className="text-sm font-medium px-2 py-1 w-full h-full overflow-hidden text-ellipsis">
                              {field.value}
                            </div>
                          )}
                          <div className="flex mt-1 space-x-1">
                            <button
                              className="text-xs text-blue-500 hover:text-blue-700"
                              onClick={(e) => handleFieldClick(field.id, e)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs text-red-500 hover:text-red-700"
                              onClick={(e) => handleDeleteField(field.id, e)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center w-full h-full">
                          <div className="flex items-center space-x-1">
                            {getFieldIcon(field.type)}
                            <span className="text-xs font-medium">
                              {getFieldLabel(field.type)}
                            </span>
                          </div>
                          <div className="flex mt-1 space-x-1">
                            <button
                              className="text-xs text-blue-500 hover:text-blue-700"
                              onClick={(e) => handleFieldClick(field.id, e)}
                            >
                              {field.type === "signature" ||
                              field.type === "initials"
                                ? "Sign"
                                : "Fill"}
                            </button>
                            <button
                              className="text-xs text-red-500 hover:text-red-700"
                              onClick={(e) => handleDeleteField(field.id, e)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {!isDocumentLoading && fields.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-muted/80 p-6 rounded-lg text-center shadow-lg">
                  <Pencil className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">
                    Click anywhere on the document to add{" "}
                    {getFieldLabel(fieldTypeToAdd).toLowerCase()} fields
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use the dropdown above to change field type
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag to reposition after placing
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag the corner or edges to resize
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
          <div
            className="w-full h-full border rounded-lg overflow-auto bg-white flex items-center justify-center p-0"
            style={{ height: "calc(100vh - 200px)" }}
          >
            {isDocumentLoading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  Loading document preview...
                </p>
              </div>
            ) : (
              <div
                className="relative"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s",
                  minWidth: "850px",
                  minHeight: "1100px",
                  width: "100%",
                  height: "100%",
                }}
              >
                {documentUrl.toLowerCase().endsWith(".pdf") ? (
                  <object
                    data={documentUrl}
                    type="application/pdf"
                    className="w-full h-full min-h-[1100px] min-w-[850px]"
                    style={{ height: "calc(100vh - 200px)" }}
                    onLoad={() => setIsDocumentLoading(false)}
                    onError={(e) => {
                      console.error(
                        "Error loading PDF document in preview:",
                        e,
                      );
                      setIsDocumentLoading(false);
                    }}
                  >
                    <div className="p-4 text-center">
                      <p>
                        Unable to display PDF.{" "}
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Download
                        </a>{" "}
                        instead.
                      </p>
                    </div>
                  </object>
                ) : (
                  <img
                    src={documentUrl}
                    alt="Document Preview"
                    className="w-auto h-auto object-contain"
                    style={{
                      minWidth: "850px",
                      minHeight: "1100px",
                      maxHeight: "calc(100vh - 200px)",
                    }}
                    crossOrigin="anonymous"
                    onLoad={() => setIsDocumentLoading(false)}
                    onError={(e) => {
                      console.error(
                        "Error loading document image in preview:",
                        e,
                      );
                      setIsDocumentLoading(false);
                    }}
                  />
                )}

                {/* Show fields in preview mode too */}
                {fields.map((field) => (
                  <div
                    key={field.id}
                    data-field-id={field.id}
                    className={`absolute border-2 ${field.value ? "border-green-500 bg-green-50" : "border-primary bg-primary/10"} rounded p-2 z-10`}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: "translate(-50%, -50%)",
                      minWidth: "100px",
                      minHeight: "40px",
                      width: field.width ? `${field.width}px` : "auto",
                      height: field.height ? `${field.height}px` : "auto",
                      position: "absolute",
                    }}
                  >
                    {field.value ? (
                      field.type === "signature" ||
                      field.type === "initials" ? (
                        <img
                          src={field.value}
                          alt={field.type}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="text-sm font-medium px-2 py-1 w-full h-full overflow-hidden text-ellipsis">
                          {field.value}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center space-x-1 w-full h-full justify-center">
                        {getFieldIcon(field.type)}
                        <span className="text-xs font-medium">
                          Awaiting {getFieldLabel(field.type)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedField &&
              fields.find((f) => f.id === selectedField)?.type === "initials"
                ? "Add Your Initials"
                : "Add Your Signature"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <SignaturePad
              onChange={handleSignatureChange}
              defaultValue={currentSignature}
              width={350}
              height={200}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignatureDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSignatureSave}>
              {selectedField &&
              fields.find((f) => f.id === selectedField)?.type === "initials"
                ? "Apply Initials"
                : "Apply Signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Text Input Dialog */}
      <Dialog open={textInputDialogOpen} onOpenChange={setTextInputDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedField &&
                `Enter ${getFieldLabel(fields.find((f) => f.id === selectedField)?.type || "name")}`}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {selectedField && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldValue">
                    {getFieldLabel(
                      fields.find((f) => f.id === selectedField)?.type ||
                        "name",
                    )}
                  </Label>
                  <Input
                    id="fieldValue"
                    type={
                      fields.find((f) => f.id === selectedField)?.type ===
                      "email"
                        ? "email"
                        : fields.find((f) => f.id === selectedField)?.type ===
                            "date"
                          ? "date"
                          : fields.find((f) => f.id === selectedField)?.type ===
                              "phone"
                            ? "tel"
                            : "text"
                    }
                    placeholder={getFieldPlaceholder(
                      fields.find((f) => f.id === selectedField)?.type ||
                        "name",
                    )}
                    value={currentTextValue}
                    onChange={(e) => setCurrentTextValue(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTextInputDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleTextInputSave}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentEditor;
