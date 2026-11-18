import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Check, Copy, Network, QrCode, X } from "lucide-react";

interface LocalIpResponse {
  primaryIp: string;
  port: number;
}

export const LanAccessBanner: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<LocalIpResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  const fetchLocalIp = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/network/local-ip");
      if (!res.ok) throw new Error("Failed to fetch local IP");
      const data = (await res.json()) as LocalIpResponse;
      setNetworkInfo({
        primaryIp: data.primaryIp,
        port: data.port,
      });
    } catch {
      const fallbackHost =
        typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
      const fallbackPort =
        typeof window !== "undefined" && window.location.port
          ? Number(window.location.port)
          : 3000;
      setNetworkInfo({
        primaryIp: fallbackHost,
        port: fallbackPort,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocalIp();
  }, [fetchLocalIp]);

  const activeIp = networkInfo?.primaryIp || "127.0.0.1";
  const activePort = networkInfo?.port || 3000;
  const accessUrl = useMemo(
    () => `http://${activeIp}:${activePort}`,
    [activeIp, activePort]
  );

  useEffect(() => {
    if (!qrModalOpen) return;
    let cancelled = false;
    QRCode.toDataURL(accessUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [accessUrl, qrModalOpen]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(accessUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <>
      <div className="inline-flex flex-wrap items-center justify-center sm:flex-nowrap gap-x-2 gap-y-1.5 rounded-lg border border-[#DCE4F0] bg-[#F8FAFC] px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[12px] max-w-full">
        <span className="inline-flex items-center gap-1.5 text-[#475569] shrink-0">
          <Network className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>本地 IP</span>
        </span>

        <button
          type="button"
          onClick={handleCopyUrl}
          title={`点击复制访问地址 ${accessUrl}`}
          className="inline-flex items-center gap-1 rounded border border-[#DBEAFE] bg-[#EFF6FF] hover:bg-[#DBEAFE]/70 px-2 py-0.5 font-mono text-[11.5px] sm:text-[12px] font-semibold tabular-nums text-[#1D4ED8] transition-colors cursor-pointer max-w-full min-w-0"
        >
          <span className="truncate">{loading ? "检测中..." : accessUrl}</span>
          {copied ? (
            <Check className="w-3 h-3 shrink-0 text-[#16A34A]" />
          ) : (
            <Copy className="w-3 h-3 shrink-0 text-[#3B82F6]" />
          )}
        </button>

        <span className="hidden 2xl:inline text-[#64748B] shrink-0">
          同局域网其他浏览器可访问
        </span>

        <span className="hidden sm:inline-block h-3.5 w-px bg-[#CBD5E1] shrink-0" />

        <button
          type="button"
          onClick={() => setQrModalOpen(true)}
          className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:text-[#2563EB] px-2 py-0.5 text-[11.5px] sm:text-[12px] font-medium text-[#334155] transition-colors cursor-pointer shrink-0"
        >
          <QrCode className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>扫码访问</span>
        </button>
      </div>

      {/* QR Code Modal (shown only on click) */}
      {qrModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
            onClick={() => setQrModalOpen(false)}
          >
            <div
              className="w-full max-w-xs rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A]">
                  <QrCode className="w-4 h-4 text-[#2563EB]" />
                  <span>同局域网扫码访问</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-auto w-52 h-52 rounded-xl border border-[#E2E8F0] bg-white p-2 flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`扫码访问 ${accessUrl}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-16 h-16 text-[#94A3B8]" />
                )}
              </div>

              <div className="mt-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2">
                <div className="text-[11px] text-[#64748B]">当前终端访问地址</div>
                <div className="mt-0.5 text-[13px] font-mono font-semibold text-[#1D4ED8] break-all">
                  {accessUrl}
                </div>
              </div>

              <p className="mt-2.5 text-[12px] text-[#64748B] leading-relaxed">
                请确保手机或其他设备与当前终端处于同一局域网下，使用浏览器或相机扫码即可访问。
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
