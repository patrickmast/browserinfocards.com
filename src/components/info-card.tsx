import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Monitor, Cpu, Wifi, Globe, Laptop, ChevronsUpDown, Shield, Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type InfoCardProps = {
  title: string;
  items?: Record<string, string> | null;
  icon: 'browser' | 'os' | 'screen' | 'device' | 'network' | 'gpu' | 'privacy';
  className?: string;
  scrollable?: boolean;
  loading?: boolean;
};

const icons = {
  browser: Globe,
  os: Laptop,
  screen: Monitor,
  device: Cpu,
  network: Wifi,
  gpu: Fingerprint,
  privacy: Shield,
};

export function InfoCard({ title, items, icon, className = '', scrollable = false, loading = false }: InfoCardProps) {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);
  const Icon = icons[icon];
  const isLoading = loading || !items;

  const copyToClipboard = async () => {
    if (!items) return;
    const text = Object.entries(items)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      toast({
        title: "Copied!",
        description: "Information copied to clipboard",
      });
      setTimeout(() => setCopying(false), 1000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const renderValue = (key: string, value: string) => {
    if (title === "Network Information" && key === "Local IP") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate block text-sm text-foreground/90 ml-4 flex-1" style={{ maxWidth: '200px' }}>
                {value}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <span
        className={cn(
          "text-sm text-foreground/90 ml-4 flex-1",
          key === 'Version Status' && value.includes('✓') && "text-green-600 dark:text-green-400",
          key === 'Version Status' && !value.includes('✓') && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </span>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid gap-2.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 animate-pulse">
          <div className="h-4 w-24 bg-foreground/10 rounded" />
          <div className="h-4 w-32 bg-foreground/10 rounded ml-4" />
        </div>
      ))}
    </div>
  );

  const Content = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid gap-2.5"
    >
      {items && Object.entries(items).map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-left sm:text-right gap-1 sm:gap-0">
          <span className="text-sm font-medium text-foreground/70 min-w-[120px]">
            {key}
          </span>
          {renderValue(key, value)}
        </div>
      ))}
    </motion.div>
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-foreground">
          <Icon className="h-5 w-5 text-foreground" />
          {title}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-foreground/50" />
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8"
          disabled={isLoading}
        >
          <motion.div
            animate={{ scale: copying ? 0.8 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Copy className={cn("h-4 w-4", isLoading ? "text-foreground/30" : "text-foreground")} />
          </motion.div>
        </Button>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : scrollable ? (
          <div className="relative">
            <ScrollArea className="h-[230px] pr-4">
              <Content />
            </ScrollArea>
            <div className="absolute bottom-0 left-0 right-4 flex justify-center">
              <div className="bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80 shadow-sm border border-border">
                <ChevronsUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Scroll</span>
              </div>
            </div>
          </div>
        ) : (
          <Content />
        )}
      </CardContent>
    </Card>
  );
}
