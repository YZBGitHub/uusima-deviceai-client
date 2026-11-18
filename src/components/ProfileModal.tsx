import { User, X } from "lucide-react";
import { useState } from "react";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userPhone: string;
  orgName: string;
  onSaveProfile: (name: string, phone: string) => void;
}

export function ProfileModal({
  open,
  onClose,
  userName,
  userPhone,
  orgName,
  onSaveProfile,
}: ProfileModalProps) {
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || userName;
    const trimmedPhone = phone.trim() || userPhone;
    onSaveProfile(trimmedName, trimmedPhone);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-[15px] font-bold text-[#0F172A]">
                个人设置
              </h2>
              <p className="text-[12px] text-[#64748B]">
                查看并维护当前账号基本资料
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭个人设置"
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3.5 rounded-xl bg-[#F8FAFF] border border-[#E2E8F0] p-3.5">
            <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white text-[17px] font-semibold flex items-center justify-center shrink-0">
              {name.slice(0, 1) || "杨"}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#0F172A] truncate">
                {name || userName}
              </div>
              <div className="text-[12px] text-[#64748B] truncate">
                所属组织：{orgName}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#1E293B]">
              用户姓名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[13px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#1E293B]">
              绑定手机号
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-tabular text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#CBD5E1] px-4 py-1.5 text-[12.5px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
