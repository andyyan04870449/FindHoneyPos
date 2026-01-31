import { TrendingUp, Trophy } from "lucide-react";
import { motion } from "motion/react";

interface IncentiveProgressBarProps {
  current: number;
  target: number;
  isEnabled: boolean;
}

export function IncentiveProgressBar({ current, target, isEnabled }: IncentiveProgressBarProps) {
  const progress = Math.min((current / target) * 100, 100);
  const isCompleted = current >= target;

  // 如果未啟用，顯示半透明版本
  if (!isEnabled) {
    return (
      <div className="bg-gray-400 text-white px-3 md:px-5 lg:px-6 py-1.5 md:py-2 lg:py-2 shadow-sm opacity-50">
        <div className="max-w-screen-2xl mx-auto text-center text-xs md:text-sm lg:text-sm">
          激勵進度功能已關閉
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 md:px-5 py-1.5 md:py-2 lg:px-6 lg:py-3 shadow-md">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-3 lg:gap-6">
        {/* 標題 */}
        <div className="flex items-center gap-1.5 lg:gap-2 min-w-[100px] lg:min-w-[140px]">
          {isCompleted ? (
            <Trophy className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 text-yellow-300" />
          ) : (
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5" />
          )}
          <span className="font-bold text-base md:text-lg lg:text-lg">激勵進度</span>
        </div>

        {/* 進度條 */}
        <div className="flex-1 flex items-center gap-2 lg:gap-4">
          <div className="flex-1 bg-white/20 rounded-full h-5 md:h-6 lg:h-8 overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full ${
                isCompleted
                  ? 'bg-gradient-to-r from-yellow-300 to-yellow-400'
                  : 'bg-gradient-to-r from-orange-400 to-brand-orange'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* 進度百分比 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs lg:text-sm font-bold text-white drop-shadow-md">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* 數量顯示 */}
          <div className="flex items-baseline gap-1 lg:gap-2 min-w-[90px] lg:min-w-[140px]">
            <span className={`text-lg md:text-xl lg:text-2xl font-bold ${isCompleted ? 'text-yellow-300' : 'text-white'}`}>
              {current}
            </span>
            <span className="text-xs lg:text-sm text-white/80">/ {target} 個</span>
          </div>
        </div>

        {/* 達成提示 */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-yellow-300 text-teal-900 px-2 py-1 lg:px-4 lg:py-2 rounded-full font-bold text-xs lg:text-sm whitespace-nowrap"
          >
            🎉 目標達成！
          </motion.div>
        )}
      </div>
    </div>
  );
}