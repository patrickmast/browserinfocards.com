export type SystemInfo = {
  browser: Record<string, string>;
  os: Record<string, string>;
  screen: Record<string, string>;
  device: Record<string, string>;
  network: Record<string, string>;
  features: Record<string, string>;
  gpu: Record<string, string>;
  privacy: Record<string, string>;
};

export function getBrowserInfo(): Record<string, string> {
    const ua = navigator.userAgent;
    const browserInfo = {} as Record<string, string>;

    // Parse Chrome version first to maintain order
    const chromeMatch = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    if (chromeMatch) {
      browserInfo['Browser'] = 'Google Chrome';
      browserInfo['Version'] = chromeMatch[1];
    }

    // Add browser language next
    browserInfo['Browser Language'] = navigator.language;

    // Architecture Detection
    const platformMatch = ua.match(/\((.*?)\)/);
    if (platformMatch) {
      const platformInfo = platformMatch[1].split(';').map(s => s.trim());

      if (platformInfo.some(p => p.toLowerCase().includes('arm64'))) {
        browserInfo['Architecture'] = 'ARM64';
      } else if (platformInfo.some(p => p.includes('Intel'))) {
        browserInfo['Architecture'] = 'Intel x86_64';
      }
    }

    // Parse WebKit version
    const webkitMatch = ua.match(/AppleWebKit\/(\d+\.\d+)/);
    if (webkitMatch) {
      browserInfo['Engine'] = `WebKit ${webkitMatch[1]}`;
    }

    // Add remaining info in specified order
    browserInfo['Cookies Enabled'] = navigator.cookieEnabled ? 'Yes' : 'No';
    browserInfo['JavaScript Enabled'] = 'Yes';

    return browserInfo;
}

export function getOSInfo(): Record<string, string> {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const osInfo: Record<string, string> = {
    'Platform': platform,
  };

  const platformMatch = ua.match(/\((.*?)\)/);
  if (platformMatch) {
    const platformInfo = platformMatch[1].split(';').map(s => s.trim());
    if (platformInfo.some(p => p.includes('Mac OS X'))) {
      const osVersionMatch = platformInfo.find(p => p.includes('Mac OS X'))?.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
      if (osVersionMatch) {
        osInfo['Operating System'] = 'macOS';
        osInfo['Version'] = osVersionMatch[1].replace(/_/g, '.');
      }
    }
  }

  if (ua.includes('Windows')) {
    osInfo['Operating System'] = 'Windows';
    if (ua.includes('Windows NT 10.0')) osInfo['Version'] = '10/11';
    else if (ua.includes('Windows NT 6.3')) osInfo['Version'] = '8.1';
    else if (ua.includes('Windows NT 6.2')) osInfo['Version'] = '8';
    else if (ua.includes('Windows NT 6.1')) osInfo['Version'] = '7';
  } else if (ua.includes('Mac OS X')) {
    osInfo['Operating System'] = 'macOS';
    const version = ua.match(/Mac OS X ([0-9._]+)/);
    if (version) osInfo['Version'] = version[1].replace(/_/g, '.');
  } else if (ua.includes('Linux')) {
    osInfo['Operating System'] = 'Linux';
  }

  return osInfo;
}

export function getScreenInfo(): Record<string, string> {
  return {
    'Screen Resolution': `${window.screen.width}x${window.screen.height}`,
    'Window Size': `${window.innerWidth}x${window.innerHeight}`,
    'Pixel Ratio': window.devicePixelRatio.toString(),
    'Color Depth': `${window.screen.colorDepth} bits`,
  };
}

export async function getDeviceInfo(): Promise<Record<string, string>> {
  const deviceInfo: Record<string, string> = {
    'Browser Memory': (navigator as any).deviceMemory ? `~${(navigator as any).deviceMemory} GB (Browser allocated)` : 'Not available',
    'Logical Processors': navigator.hardwareConcurrency?.toString() || 'Unknown',
    'Touch Points': navigator.maxTouchPoints?.toString() || '0',
    'Device Type': /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
  };

  try {
    const battery = await (navigator as any).getBattery();
    if (battery) {
      deviceInfo['Battery Status'] = `${Math.round(battery.level * 100)}% ${battery.charging ? '(Charging)' : ''}`;
    }
  } catch {
    deviceInfo['Battery Status'] = 'Not available';
  }

  return deviceInfo;
}

function getLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ 
        iceServers: [] 
      });

      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {});

      pc.onicecandidate = (ice) => {
        if (!ice.candidate) return;

        const localIP = ice.candidate.candidate.split(' ')[4];
        if (localIP && localIP.includes('.')) {
          pc.close();
          resolve(localIP);
        }
      };

      // Timeout after 2 seconds
      setTimeout(() => {
        pc.close();
        resolve('Unavailable');
      }, 2000);
    } catch {
      resolve('Unavailable');
    }
  });
}

async function getIPLocation(ip: string): Promise<{ location: string, isp: string }> {
  // Try ipwho.is as primary service (more reliable and no rate limits)
  try {
    const response = await Promise.race([
      fetch(`https://ipwho.is/${ip}`, {
        mode: 'cors',
        cache: 'no-cache'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]) as Response;

    if (!response.ok) throw new Error('Primary service failed');

    const data = await response.json();
    if (!data.success) throw new Error('Primary service error response');

    const location = [
      data.city,
      data.region,
      data.country
    ].filter(Boolean).join(', ');

    return {
      location: location || 'Unavailable',
      isp: data.connection?.isp || 'Unavailable'
    };
  } catch (error) {
    console.log('Primary service failed:', error);

    // Fallback to ip-api.com (different service, better reliability)
    try {
      const response = await Promise.race([
        fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp`, {
          mode: 'cors',
          cache: 'no-cache'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as Response;

      if (!response.ok) throw new Error('Backup service failed');

      const data = await response.json();
      if (data.status !== 'success') throw new Error('Backup service error response');

      const location = [
        data.city,
        data.regionName,
        data.country
      ].filter(Boolean).join(', ');

      return {
        location: location || 'Unavailable',
        isp: data.isp || 'Unavailable'
      };
    } catch (backupError) {
      console.error('All IP location services failed:', backupError);
      return { location: 'Unavailable', isp: 'Unavailable' };
    }
  }
}

export async function getPublicIP(): Promise<string> {
  // Try multiple IP services for reliability
  const services = [
    'https://api.ipify.org?format=json',
    'https://api.my-ip.io/v2/ip.json',
    'https://ipapi.co/json/'
  ];

  for (const service of services) {
    try {
      const response = await fetch(service, {
        cache: 'no-cache'
      });
      if (!response.ok) continue;

      const data = await response.json();
      const ip = data.ip || data.ipAddress;
      if (ip) return ip;
    } catch {
      continue;
    }
  }

  return 'Unavailable';
}

export async function getNetworkInfo(): Promise<Record<string, string>> {
  const connection = (navigator as any).connection;
  const networkInfo: Record<string, string> = {
    'Online Status': navigator.onLine ? 'Online' : 'Offline',
  };

  // Get Public IP
  const publicIP = await getPublicIP();
  networkInfo['Public IP'] = publicIP;

  // Try to get location and ISP info with improved error handling
  if (publicIP !== 'Unavailable') {
    const { location, isp } = await getIPLocation(publicIP);
    networkInfo['Location'] = location;
    networkInfo['Internet Provider'] = isp;
  } else {
    networkInfo['Location'] = 'Unavailable';
    networkInfo['Internet Provider'] = 'Unavailable';
  }

  // Add Local IP after location and ISP
  networkInfo['Local IP'] = await getLocalIP();

  // Add connection information at the end
  if (connection) {
    if (connection.effectiveType) networkInfo['Connection Type'] = connection.effectiveType;
    if (connection.downlink) networkInfo['Downlink Speed'] = `${connection.downlink} Mbps`;
    if (connection.rtt) networkInfo['Round Trip Time'] = `${connection.rtt} ms`;
  }

  return networkInfo;
}

export function getFeatureSupport(): Record<string, string> {
  const features: Record<string, string> = {
    'WebGL': (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
          ? 'Supported' : 'Not Supported';
      } catch {
        return 'Not Supported';
      }
    })(),
    'WebAssembly': typeof WebAssembly === 'object' ? 'Supported' : 'Not Supported',
    'WebRTC': (window.RTCPeerConnection !== undefined) ? 'Supported' : 'Not Supported',
    'WebWorkers': typeof Worker === 'function' ? 'Supported' : 'Not Supported',
    'LocalStorage': (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return 'Supported';
      } catch {
        return 'Not Supported';
      }
    })(),
    'IndexedDB': window.indexedDB ? 'Supported' : 'Not Supported',
    'WebSocket': typeof WebSocket === 'function' ? 'Supported' : 'Not Supported',
    'Geolocation': 'geolocation' in navigator ? 'Supported' : 'Not Supported',
    'WebAudio': typeof AudioContext !== 'undefined' ? 'Supported' : 'Not Supported',
    'Canvas': (() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d')) ? 'Supported' : 'Not Supported';
    })(),
    'SVG': (() => {
      return !!document.createElementNS &&
        !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
        ? 'Supported' : 'Not Supported';
    })(),
    'WebCrypto': 'crypto' in window && 'subtle' in window.crypto ? 'Supported' : 'Not Supported',
    'Fetch API': 'fetch' in window ? 'Supported' : 'Not Supported',
  };

  return features;
}

export function getGPUInfo(): Record<string, string> {
  const gpuInfo: Record<string, string> = {};

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return { 'Status': 'WebGL not supported' };
    }

    const glContext = gl as WebGLRenderingContext;

    // WebGL Version
    gpuInfo['WebGL Version'] = canvas.getContext('webgl2') ? '2.0' : '1.0';

    // GPU Info via debug extension
    const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = glContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      gpuInfo['GPU Vendor'] = vendor || 'Unknown';
      gpuInfo['GPU Renderer'] = renderer || 'Unknown';
    } else {
      gpuInfo['GPU Vendor'] = glContext.getParameter(glContext.VENDOR) || 'Hidden';
      gpuInfo['GPU Renderer'] = glContext.getParameter(glContext.RENDERER) || 'Hidden';
    }

    // Max Texture Size
    const maxTextureSize = glContext.getParameter(glContext.MAX_TEXTURE_SIZE);
    gpuInfo['Max Texture Size'] = `${maxTextureSize}x${maxTextureSize}`;

    // Max Viewport
    const maxViewport = glContext.getParameter(glContext.MAX_VIEWPORT_DIMS);
    if (maxViewport) {
      gpuInfo['Max Viewport'] = `${maxViewport[0]}x${maxViewport[1]}`;
    }

    // Antialiasing
    const contextAttributes = glContext.getContextAttributes();
    gpuInfo['Antialiasing'] = contextAttributes?.antialias ? 'Enabled' : 'Disabled';

    // Extensions count
    const extensions = glContext.getSupportedExtensions();
    gpuInfo['Extensions'] = extensions ? `${extensions.length} supported` : '0';

  } catch {
    return { 'Status': 'Unable to detect GPU' };
  }

  return gpuInfo;
}

// Simple hash function for fingerprinting
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function getPrivacyInfo(): Record<string, string> {
  const privacyInfo: Record<string, string> = {};
  let privacyScore = 0;

  // Canvas Fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('BrowserInfo', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas FP', 4, 30);
      const dataUrl = canvas.toDataURL();
      privacyInfo['Canvas Fingerprint'] = simpleHash(dataUrl).toUpperCase();
    }
  } catch {
    privacyInfo['Canvas Fingerprint'] = 'Blocked';
    privacyScore++;
  }

  // Do Not Track
  const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    privacyInfo['Do Not Track'] = 'Enabled';
    privacyScore++;
  } else {
    privacyInfo['Do Not Track'] = 'Disabled';
  }

  // Global Privacy Control
  const gpc = (navigator as any).globalPrivacyControl;
  if (gpc) {
    privacyInfo['Global Privacy Control'] = 'Enabled';
    privacyScore++;
  } else {
    privacyInfo['Global Privacy Control'] = 'Not Set';
  }

  // Cookies
  privacyInfo['Cookies'] = navigator.cookieEnabled ? 'Enabled' : 'Blocked';
  if (!navigator.cookieEnabled) privacyScore++;

  // Ad Blocker Detection (simple check using textContent)
  const adBlockDetected = (() => {
    const testAd = document.createElement('div');
    testAd.textContent = ' ';
    testAd.className = 'adsbox ad-banner ad-placeholder';
    testAd.style.cssText = 'position:absolute;left:-9999px;';
    document.body.appendChild(testAd);
    const blocked = testAd.offsetHeight === 0 || testAd.clientHeight === 0;
    document.body.removeChild(testAd);
    return blocked;
  })();
  privacyInfo['Ad Blocker'] = adBlockDetected ? 'Detected' : 'Not Detected';
  if (adBlockDetected) privacyScore++;

  // WebRTC IP Leak Protection (if no local IP can be detected)
  privacyInfo['WebRTC Leak Protection'] = window.RTCPeerConnection ? 'Exposed' : 'Protected';
  if (!window.RTCPeerConnection) privacyScore++;

  // Third-party cookies (approximate check)
  const storageAvailable = (() => {
    try {
      localStorage.setItem('_test', '1');
      localStorage.removeItem('_test');
      return true;
    } catch {
      return false;
    }
  })();
  privacyInfo['Local Storage'] = storageAvailable ? 'Accessible' : 'Blocked';
  if (!storageAvailable) privacyScore++;

  // Privacy Score
  let scoreLabel: string;
  if (privacyScore >= 5) {
    scoreLabel = 'High';
  } else if (privacyScore >= 3) {
    scoreLabel = 'Medium';
  } else {
    scoreLabel = 'Low';
  }
  privacyInfo['Privacy Score'] = `${scoreLabel} (${privacyScore}/7 protections)`;

  return privacyInfo;
}
