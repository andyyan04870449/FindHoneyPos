import { useState } from 'react';
import { Dialog, DialogContent } from "./ui/dialog";
import { Users, Check } from "lucide-react";

const GENDER_TAGS = ['男', '女'] as const;
const AGE_TAGS = ['成人', '學生'] as const;

interface CustomerTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (customerTag?: string) => void;
}

export function CustomerTagDialog({
  open,
  onOpenChange,
  onConfirm,
}: CustomerTagDialogProps) {
  const [genderTag, setGenderTag] = useState('');
  const [ageTag, setAgeTag] = useState('');

  const handleConfirm = () => {
    const tag = [genderTag, ageTag].filter(Boolean).join(',') || undefined;
    onConfirm(tag);
    setGenderTag('');
    setAgeTag('');
  };

  const handleSkip = () => {
    onConfirm(undefined);
    setGenderTag('');
    setAgeTag('');
  };

  const tagButton = (tag: string, selected: boolean, onClick: () => void) => (
    <button
      key={tag}
      onClick={onClick}
      className={`flex-1 h-20 rounded-2xl border-3 text-2xl font-bold transition-all active:scale-95 ${
        selected
          ? 'border-brand-orange bg-brand-orange text-white shadow-lg shadow-orange-200'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {tag}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] landscape:!max-w-[700px] !p-0 overflow-hidden !rounded-3xl border-0 shadow-2xl [&>button]:hidden">
        <div className="flex flex-col landscape:flex-row landscape:min-h-[320px]">
          {/* 左側/上方：客群選項 */}
          <div className="flex-1 p-8 landscape:p-8">
            {/* 標題 */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">客群分析</h3>
                <p className="text-sm text-gray-400">可選填，協助營運分析</p>
              </div>
            </div>

            {/* 標籤選擇 */}
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">性別</p>
                <div className="flex gap-4">
                  {GENDER_TAGS.map((tag) =>
                    tagButton(tag, genderTag === tag, () => setGenderTag(prev => prev === tag ? '' : tag))
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">年齡</p>
                <div className="flex gap-4">
                  {AGE_TAGS.map((tag) =>
                    tagButton(tag, ageTag === tag, () => setAgeTag(prev => prev === tag ? '' : tag))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右側/下方：操作按鈕 */}
          <div className="border-t-2 landscape:border-t-0 landscape:border-l-2 border-gray-100 landscape:w-52">
            <button
              onClick={handleConfirm}
              className="w-full h-full min-h-[80px] flex items-center justify-center gap-3 bg-brand-orange hover:bg-brand-orange-dark text-white text-2xl font-bold transition-colors"
            >
              <Check className="h-7 w-7" strokeWidth={3} />
              確認
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
