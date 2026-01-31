import { Button } from "./ui/button";
import { Settings, RefreshCw, Printer } from "lucide-react";

interface BottomToolbarProps {
  onUpdateMenu: () => void;
  onOpenSettings: () => void;
  onReprintOrder: (orderId: string) => void;
}

export function BottomToolbar({ 
  onUpdateMenu, 
  onOpenSettings, 
  onReprintOrder 
}: BottomToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-4 w-full max-w-2xl">
      <Button
        variant="outline"
        onClick={onUpdateMenu}
        className="flex-1 h-12 text-base border-2 active:scale-95"
      >
        <RefreshCw className="h-5 w-5 mr-2" />
        更新菜單
      </Button>
      
      <Button
        variant="outline"
        onClick={() => onReprintOrder('125')}
        className="flex-1 h-12 text-base border-2 active:scale-95"
      >
        <Printer className="h-5 w-5 mr-2" />
        重印訂單
      </Button>
    </div>
  );
}