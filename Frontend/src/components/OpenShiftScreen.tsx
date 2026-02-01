import { Button } from "./ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import logoImage from '@/assets/0823fe84278739e4331a8463c99173e87d691257.png';

interface OpenShiftScreenProps {
  onOpenShift: () => void;
  loading?: boolean;
}

export function OpenShiftScreen({ onOpenShift, loading }: OpenShiftScreenProps) {
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-gray-50 gap-8">
      <img
        src={logoImage}
        alt="尋蜜 Find Honey Logo"
        className="h-24 w-24 object-contain"
      />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">尋蜜點餐系統</h1>
        <p className="text-gray-500">請開始新班次以進行點餐作業</p>
      </div>
      <Button
        onClick={onOpenShift}
        disabled={loading}
        className="h-16 px-10 text-lg bg-brand-orange hover:bg-brand-orange/90"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 mr-2 animate-spin" />
        ) : (
          <PlayCircle className="h-6 w-6 mr-2" />
        )}
        開始新班次
      </Button>
    </div>
  );
}
