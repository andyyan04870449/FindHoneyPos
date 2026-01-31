import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { toast } from 'sonner';
import logoImage from '@/assets/0823fe84278739e4331a8463c99173e87d691257.png';

interface PosLoginPageProps {
  isInitialized: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, confirmPassword: string, displayName: string) => Promise<void>;
}

export function PosLoginPage({ isInitialized, onLogin, onRegister }: PosLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegisterMode = !isInitialized;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('請填寫帳號和密碼');
      return;
    }

    if (isRegisterMode) {
      if (!displayName) {
        toast.error('請填寫顯示名稱');
        return;
      }
      if (username.length < 3) {
        toast.error('帳號至少需要 3 個字元');
        return;
      }
      if (password.length < 6) {
        toast.error('密碼至少需要 6 個字元');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('密碼不一致');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        await onRegister(username, password, confirmPassword, displayName);
        toast.success('系統初始化完成！');
      } else {
        await onLogin(username, password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isRegisterMode ? '註冊失敗' : '登入失敗'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-lg p-10">
        <div className="text-center mb-10">
          <img
            src={logoImage}
            alt="尋蜜 Find Honey Logo"
            className="h-20 w-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">尋蜜點餐系統</h1>
          <p className="text-lg text-gray-500 mt-2">
            {isRegisterMode ? '系統初始設定' : 'POS 登入'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegisterMode && (
            <div>
              <Label htmlFor="displayName" className="text-base">顯示名稱</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：管理員"
                className="h-14 text-lg"
              />
            </div>
          )}
          <div>
            <Label htmlFor="username" className="text-base">帳號</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              autoComplete="username"
              autoFocus
              className="h-14 text-lg"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-base">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              className="h-14 text-lg"
            />
          </div>
          {isRegisterMode && (
            <div>
              <Label htmlFor="confirmPassword" className="text-base">確認密碼</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入密碼"
                autoComplete="new-password"
                className="h-14 text-lg"
              />
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-14 text-lg bg-brand-orange hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? '處理中...' : (isRegisterMode ? '建立帳號並開始使用' : '登入')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
