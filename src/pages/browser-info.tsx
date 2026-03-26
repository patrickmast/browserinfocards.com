import { useState, useEffect } from 'react';
import { InfoCard } from '@/components/info-card';
import {
  getBrowserInfo,
  getOSInfo,
  getScreenInfo,
  getDeviceInfo,
  getNetworkInfo,
  getPublicIP,
  getFeatureSupport,
  getGPUInfo,
  getPrivacyInfo,
} from '@/lib/browser-detection';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RefreshCw, Copy, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BrowserInfo() {
  // Individual state for each section - enables progressive loading
  const [publicIP, setPublicIP] = useState<string | null>(null);
  const [browser, setBrowser] = useState<Record<string, string> | null>(null);
  const [os, setOs] = useState<Record<string, string> | null>(null);
  const [screen, setScreen] = useState<Record<string, string> | null>(null);
  const [device, setDevice] = useState<Record<string, string> | null>(null);
  const [network, setNetwork] = useState<Record<string, string> | null>(null);
  const [gpu, setGpu] = useState<Record<string, string> | null>(null);
  const [privacy, setPrivacy] = useState<Record<string, string> | null>(null);
  const [features, setFeatures] = useState<Record<string, string> | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshInfo = async () => {
    setIsRefreshing(true);

    // Reset all states
    setPublicIP(null);
    setBrowser(null);
    setOs(null);
    setScreen(null);
    setDevice(null);
    setNetwork(null);
    setGpu(null);
    setPrivacy(null);
    setFeatures(null);

    // Fetch synchronous data immediately (these are instant)
    setBrowser(getBrowserInfo());
    setOs(getOSInfo());
    setScreen(getScreenInfo());
    setGpu(getGPUInfo());
    setPrivacy(getPrivacyInfo());
    setFeatures(getFeatureSupport());

    // Fetch async data progressively
    getPublicIP().then(setPublicIP);
    getDeviceInfo().then(setDevice);
    getNetworkInfo().then((networkData) => {
      setNetwork(networkData);
      setIsRefreshing(false);
    });
  };

  const copyAllInfo = async () => {
    const formatSection = (title: string, items: Record<string, string> | null) => {
      if (!items) return null;
      return `${title}:\n${Object.entries(items)
        .map(([key, value]) => `  ${key}: ${value}`)
        .join('\n')}`;
    };

    const sections = [
      formatSection('Network Information', network),
      formatSection('Browser Information', browser),
      formatSection('Operating System', os),
      formatSection('Screen & Display', screen),
      formatSection('Device Information', device),
      formatSection('GPU & Graphics', gpu),
      formatSection('Privacy & Fingerprint', privacy),
      formatSection('Feature Compatibility', features),
    ].filter(Boolean);

    if (sections.length === 0) return;

    const text = sections.join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      toast({
        title: "Copied All Information!",
        description: "All system information has been copied to clipboard",
      });
      setTimeout(() => setCopying(false), 1000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy information to clipboard",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshInfo();

    if (autoRefresh) {
      const interval = setInterval(refreshInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const ipLoading = publicIP === null;

  return (
    <div className="relative p-4 sm:p-6">
      <div className="max-w-[900px] mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground max-w-[200px] sm:max-w-none">
            Browser Information
          </h1>
          <p className="text-sm sm:text-base text-foreground/80 max-w-2xl">
            Detailed technical specifications about your browser and system environment. All information is collected locally using browser APIs.
          </p>
        </div>

        <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-sm sm:text-base text-foreground">Auto-refresh every 5 seconds</Label>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                id="copy-all-button"
                variant="ghost"
                size="sm"
                onClick={copyAllInfo}
                disabled={isRefreshing}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 border border-border"
              >
                <Copy className={`h-4 w-4 ${copying ? 'text-green-500' : 'text-foreground'}`} />
                <span className="text-foreground">Copy All</span>
              </Button>
              <Button
                id="refresh-now-button"
                variant="ghost"
                size="sm"
                onClick={refreshInfo}
                disabled={isRefreshing}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 border border-border"
              >
                <RefreshCw className={`h-4 w-4 text-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-foreground">Refresh Now</span>
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* IP Address Card - Full Width */}
          <Card className="md:col-span-2 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-foreground" />
                <div>
                  <p className="text-sm text-foreground/70 flex items-center gap-2">
                    Your IP Address
                    {ipLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  </p>
                  {ipLoading ? (
                    <div className="h-8 sm:h-9 w-48 bg-foreground/10 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                      {publicIP}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={ipLoading || publicIP === 'Unavailable'}
                onClick={async () => {
                  if (publicIP && publicIP !== 'Unavailable') {
                    await navigator.clipboard.writeText(publicIP);
                    toast({ title: "Copied!", description: "IP address copied to clipboard" });
                  }
                }}
                className="h-8 w-8"
              >
                <Copy className={`h-4 w-4 ${ipLoading ? 'text-foreground/30' : 'text-foreground'}`} />
              </Button>
            </div>
          </Card>

          <InfoCard
            title="Network Information"
            items={network}
            icon="network"
          />
          <InfoCard
            title="Browser Information"
            items={browser}
            icon="browser"
          />
          <InfoCard
            title="Operating System"
            items={os}
            icon="os"
          />
          <InfoCard
            title="Screen & Display"
            items={screen}
            icon="screen"
          />
          <InfoCard
            title="Device Information"
            items={device}
            icon="device"
          />
          <InfoCard
            title="GPU & Graphics"
            items={gpu}
            icon="gpu"
          />
          <InfoCard
            title="Privacy & Fingerprint"
            items={privacy}
            icon="privacy"
          />
          <InfoCard
            title="Feature Compatibility"
            items={features}
            icon="browser"
            scrollable
          />
        </div>
      </div>
    </div>
  );
}
