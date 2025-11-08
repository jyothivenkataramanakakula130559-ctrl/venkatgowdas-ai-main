import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Code2, Eye, Image, Video, File, X, Maximize } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HistorySection } from "./HistorySection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const BuilderSection = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [includeBackend, setIncludeBackend] = useState(false);
  const [backendInfo, setBackendInfo] = useState<{
    hasBackend: boolean;
    backendCode?: string;
    databaseSchema?: string;
    edgeFunctions?: Array<{ name: string; description: string }>;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFileUpload = (files: FileList | null, type: 'image' | 'video' | 'file') => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    if (type === 'image') {
      setUploadedImages(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} image(s) added`);
    } else if (type === 'video') {
      setUploadedVideos(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} video(s) added`);
    } else {
      setUploadedFiles(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} file(s) added`);
    }
  };

  const removeFile = (index: number, type: 'image' | 'video' | 'file') => {
    if (type === 'image') {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'video') {
      setUploadedVideos(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please sign in to generate websites");
      navigate("/auth");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please describe your website");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-website", {
        body: { 
          prompt,
          includeBackend,
          hasImages: uploadedImages.length > 0,
          hasVideos: uploadedVideos.length > 0,
          hasFiles: uploadedFiles.length > 0,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const code = data.code;
      setGeneratedCode(code);

      // Check for backend info
      if (data.hasBackend) {
        setBackendInfo({
          hasBackend: data.hasBackend,
          backendCode: data.backendCode,
          databaseSchema: data.databaseSchema,
          edgeFunctions: data.edgeFunctions
        });
      } else {
        setBackendInfo(null);
      }

      // Save to database
      const { error: dbError } = await supabase
        .from("website_generations")
        .insert({
          user_id: user.id,
          prompt,
          generated_code: code,
          has_backend: data.hasBackend || false,
          backend_code: data.backendCode || null,
          database_schema: data.databaseSchema || null,
          edge_functions: data.edgeFunctions || null,
        });

      if (dbError) {
        console.error("Error saving to database:", dbError);
      }

      toast.success("Website generated and saved to history!");
    } catch (error) {
      console.error("Error generating website:", error);
      toast.error("Failed to generate website. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="builder" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Website Builder
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your dream website and let AI bring it to life
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border shadow-card space-y-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Describe Your Website</h3>
              </div>
              
              <Textarea
                placeholder="Example: A landing page for a coffee shop with a hero section, menu showcase, and contact form. Use warm colors and modern design."
                className="min-h-[150px] bg-background border-border focus:border-primary resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background/50">
                <input
                  type="checkbox"
                  id="includeBackend"
                  checked={includeBackend}
                  onChange={(e) => setIncludeBackend(e.target.checked)}
                  className="h-4 w-4 rounded border-border cursor-pointer"
                />
                <label htmlFor="includeBackend" className="text-sm text-foreground cursor-pointer flex-1">
                  <span className="font-medium">Include Backend</span>
                  <span className="text-muted-foreground block text-xs mt-0.5">
                    Generate database schema, APIs, and edge functions
                  </span>
                </label>
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                {/* Images */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Image className="w-4 h-4" />
                    Photos
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'image')}
                    className="cursor-pointer"
                  />
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button onClick={() => removeFile(index, 'image')} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Video className="w-4 h-4" />
                    Videos
                  </label>
                  <Input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'video')}
                    className="cursor-pointer"
                  />
                  {uploadedVideos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedVideos.map((file, index) => (
                        <div key={index} className="flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-1 rounded text-xs">
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button onClick={() => removeFile(index, 'video')} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Files */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <File className="w-4 h-4" />
                    Files
                  </label>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'file')}
                    className="cursor-pointer"
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded text-xs">
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button onClick={() => removeFile(index, 'file')} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-xl shadow-glow"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate {includeBackend ? 'Full-Stack ' : ''}Website
                  </>
                )}
              </Button>
            </Card>

            {/* History Section */}
            <HistorySection onLoadGeneration={setGeneratedCode} />
          </div>

          {/* Output Section - Bigger Preview */}
          <div className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border shadow-card space-y-4">
              {generatedCode ? (
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-background/50">
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-2">
                      <Code2 className="w-4 h-4" />
                      Code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="space-y-4">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <iframe
                        srcDoc={generatedCode}
                        className="w-full h-[800px] bg-white"
                        title="Website Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                    
                     <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsFullscreen(true)}
                      >
                        <Maximize className="w-4 h-4 mr-2" />
                        Fullscreen
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          toast.success("Code copied to clipboard!");
                        }}
                      >
                        Copy Code
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const blob = new Blob([generatedCode], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "website.html";
                          a.click();
                          toast.success("Website downloaded!");
                        }}
                      >
                        Download HTML
                      </Button>
                    </div>

                    {/* Backend Code Display */}
                    {backendInfo?.hasBackend && (
                      <div className="mt-6 space-y-4 border-t border-border pt-4">
                        <h4 className="font-semibold text-primary flex items-center gap-2">
                          <Code2 className="w-4 h-4" />
                          Backend Components
                        </h4>

                        {backendInfo.databaseSchema && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Database Schema</p>
                            <div className="bg-background rounded-lg p-3 max-h-[200px] overflow-auto border border-border">
                              <pre className="text-xs text-foreground whitespace-pre-wrap">
                                <code>{backendInfo.databaseSchema}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {backendInfo.backendCode && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Edge Function</p>
                            <div className="bg-background rounded-lg p-3 max-h-[200px] overflow-auto border border-border">
                              <pre className="text-xs text-foreground whitespace-pre-wrap">
                                <code>{backendInfo.backendCode}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {backendInfo.edgeFunctions && backendInfo.edgeFunctions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Functions</p>
                            {backendInfo.edgeFunctions.map((func, idx) => (
                              <div key={idx} className="p-2 bg-background border border-border rounded">
                                <p className="font-medium text-xs text-foreground">{func.name}</p>
                                <p className="text-xs text-muted-foreground">{func.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="code" className="space-y-4">
                    <div className="bg-background rounded-lg p-4 max-h-[800px] overflow-auto border border-border">
                      <pre className="text-sm text-foreground whitespace-pre-wrap break-words">
                        <code>{generatedCode}</code>
                      </pre>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          toast.success("Code copied to clipboard!");
                        }}
                      >
                        Copy Code
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const blob = new Blob([generatedCode], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "website.html";
                          a.click();
                          toast.success("Website downloaded!");
                        }}
                      >
                        Download HTML
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-accent mb-4">
                    <Eye className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Preview & Code</h3>
                  </div>
                  <div className="min-h-[200px] flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                    <div className="text-center space-y-2">
                      <Eye className="w-12 h-12 mx-auto opacity-50" />
                      <p>Your generated website will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Website Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full overflow-hidden p-4 pt-0">
            <iframe
              srcDoc={generatedCode}
              className="w-full h-full bg-white rounded-lg border"
              title="Website Fullscreen Preview"
              sandbox="allow-scripts"
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
