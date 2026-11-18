import { Check, Copy, Wrench, X } from "lucide-react";
import { useMemo, useState } from "react";

interface ToolsModalProps {
  open: boolean;
  onClose: () => void;
}

function computeModbusCrc16(hexStr: string): {
  valid: boolean;
  bytes: string[];
  crcLowHigh: string;
  fullFrame: string;
} {
  const cleaned = hexStr.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length === 0 || cleaned.length % 2 !== 0) {
    return { valid: false, bytes: [], crcLowHigh: "-- --", fullFrame: "" };
  }

  const bytesNum: number[] = [];
  const bytesHex: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const pair = cleaned.slice(i, i + 2).toUpperCase();
    bytesNum.push(parseInt(pair, 16));
    bytesHex.push(pair);
  }

  let crc = 0xffff;
  for (const byte of bytesNum) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }

  const lowByte = (crc & 0xff).toString(16).padStart(2, "0").toUpperCase();
  const highByte = ((crc >> 8) & 0xff).toString(16).padStart(2, "0").toUpperCase();

  return {
    valid: true,
    bytes: bytesHex,
    crcLowHigh: `${lowByte} ${highByte}`,
    fullFrame: `${bytesHex.join(" ")} ${lowByte} ${highByte}`,
  };
}

function asciiToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function hexToAscii(hex: string): string {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length === 0 || cleaned.length % 2 !== 0) return "";
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function ToolsModal({ open, onClose }: ToolsModalProps) {
  const [modbusInput, setModbusInput] = useState("01 03 00 00 00 02");
  const [asciiInput, setAsciiInput] = useState("AT+CSQ\\r\\n");
  const [hexInput, setHexInput] = useState("41 54 2B 43 53 51");
  const [copied, setCopied] = useState(false);

  const crcResult = useMemo(() => computeModbusCrc16(modbusInput), [modbusInput]);
  const convertedHex = useMemo(
    () => asciiToHex(asciiInput.replace(/\\r/g, "\r").replace(/\\n/g, "\n")),
    [asciiInput]
  );
  const convertedAscii = useMemo(() => hexToAscii(hexInput), [hexInput]);

  if (!open) return null;

  const copyFrame = () => {
    if (!crcResult.fullFrame) return;
    navigator.clipboard.writeText(crcResult.fullFrame).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tools-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#3D68F5] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 id="tools-modal-title" className="text-[15px] font-bold text-[#0F172A]">
                通讯协议调试工具箱
              </h2>
              <p className="text-[12px] text-[#64748B]">
                Modbus RTU CRC-16 校验计算与串口 HEX/ASCII 报文转换
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭调试工具箱"
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Modbus CRC-16 Calculator */}
          <section className="space-y-2.5">
            <h3 className="text-[13px] font-semibold text-[#1E293B]">
              1. Modbus RTU CRC-16 校验码计算 (低字节在前)
            </h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={modbusInput}
                onChange={(e) => setModbusInput(e.target.value)}
                placeholder="输入十六进制报文，如: 01 03 00 00 00 02"
                className="flex-1 rounded-lg border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-tabular text-[#0F172A] focus:border-[#3D68F5] focus:outline-none"
              />
              <button
                type="button"
                onClick={copyFrame}
                disabled={!crcResult.valid}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] disabled:bg-[#CBD5E1] px-4 py-2 text-[12.5px] font-medium text-white cursor-pointer whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "已复制完整帧" : "复制完整帧"}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[12.5px]">
              <div>
                <span className="text-[#64748B]">CRC16 校验值 (Low High):</span>
                <div className="mt-0.5 font-mono-tabular font-semibold text-[#3D68F5]">
                  {crcResult.valid ? crcResult.crcLowHigh : "请输入偶数位 HEX"}
                </div>
              </div>
              <div>
                <span className="text-[#64748B]">完整 Modbus RTU 报文:</span>
                <div className="mt-0.5 font-mono-tabular font-medium text-[#0F172A] break-all">
                  {crcResult.valid ? crcResult.fullFrame : "--"}
                </div>
              </div>
            </div>
          </section>

          {/* ASCII <-> HEX converter */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EEF2F6]">
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#1E293B]">
                2. ASCII 转 HEX (支持 \r\n)
              </label>
              <input
                type="text"
                value={asciiInput}
                onChange={(e) => setAsciiInput(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[12.5px] font-mono-tabular focus:border-[#3D68F5] focus:outline-none"
              />
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[12px] font-mono-tabular text-[#334155] min-h-[38px] break-all">
                {convertedHex || "--"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#1E293B]">
                3. HEX 转 ASCII
              </label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[12.5px] font-mono-tabular focus:border-[#3D68F5] focus:outline-none"
              />
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[12px] font-mono-tabular text-[#334155] min-h-[38px] break-all">
                {convertedAscii || "--"}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
