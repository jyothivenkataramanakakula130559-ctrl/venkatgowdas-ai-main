import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Clock, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Generation {
  id: string;
  prompt: string;
  generated_code: string;
  website_url: string | null;
  created_at: string;
}

interface HistorySectionProps {
  onLoadGeneration: (code: string) => void;
}

export const HistorySection = ({ onLoadGeneration }: HistorySectionProps) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("website_generations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGenerations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();

    // Listen for new generations
    const channel = supabase
      .channel("website_generations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "website_generations",
        },
        () => {
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("website_generations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Generation deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting generation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {generations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No generations yet</p>
          ) : (
            <div className="space-y-4">
              {generations.map((gen) => (
                <Card key={gen.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{gen.prompt}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(gen.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLoadGeneration(gen.generated_code)}
                        className="flex-1"
                      >
                        Load
                      </Button>
                      {gen.website_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(gen.website_url!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
