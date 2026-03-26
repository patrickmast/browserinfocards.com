declare const __BUILD_VERSION__: number;
declare const __BUILD_DATE__: string;

export function BuildVersion() {
  return (
    <div
      title={__BUILD_DATE__ ? `Deployed: ${__BUILD_DATE__}` : undefined}
      style={{
        position: "fixed",
        bottom: "8px",
        right: "16px",
        fontSize: "10px",
        color: "rgba(156, 163, 175, 0.6)",
        fontFamily: "monospace",
        cursor: "default",
        zIndex: 50,
      }}
    >
      v{__BUILD_VERSION__}
    </div>
  );
}
