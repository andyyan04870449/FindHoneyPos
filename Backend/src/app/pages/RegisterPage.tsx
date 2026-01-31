import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterPage() {
  const { register, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  if (isInitialized) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword || !displayName) {
      toast.error('請填寫所有欄位');
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

    setLoading(true);
    try {
      await register(username, password, confirmPassword, displayName);
      toast.success('系統初始化完成！');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">蜜</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">系統初始設定</h1>
          <p className="text-gray-500 mt-1">建立第一個管理員帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName">顯示名稱</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例如：管理員"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="username">帳號</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="至少 3 個字元"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">確認密碼</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入密碼"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            建立帳號並開始使用
          </Button>
        </form>
      </Card>
    </div>
  );
}
