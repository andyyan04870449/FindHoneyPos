import { useState, useEffect, useCallback } from 'react';
import { Loader2, PackagePlus, PackageMinus, ClipboardList, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import type { Material, MaterialStockRecord, StockChangeType } from '@/types';
import { getMaterials, stockIn, adjustStock, wasteStock, getStockRecords } from '@/lib/api';

const CHANGE_TYPE_LABELS: Record<StockChangeType, { label: string; color: string }> = {
  In: { label: '入庫', color: 'bg-green-100 text-green-700' },
  Out: { label: '出庫', color: 'bg-blue-100 text-blue-700' },
  Adjust: { label: '調整', color: 'bg-yellow-100 text-yellow-700' },
  Waste: { label: '報廢', color: 'bg-red-100 text-red-700' },
};

export function StockOperations() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [records, setRecords] = useState<MaterialStockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock-in');

  // 入庫表單
  const [stockInMaterialId, setStockInMaterialId] = useState<string>('');
  const [stockInQuantity, setStockInQuantity] = useState('');
  const [stockInNote, setStockInNote] = useState('');

  // 盤點調整
  const [adjustMaterialId, setAdjustMaterialId] = useState<string>('');
  const [adjustNewStock, setAdjustNewStock] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // 報廢
  const [wasteMaterialId, setWasteMaterialId] = useState<string>('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [wasteNote, setWasteNote] = useState('');

  // 記錄篩選
  const [filterMaterialId, setFilterMaterialId] = useState<string>('');
  const [filterChangeType, setFilterChangeType] = useState<string>('');

  const fetchMaterials = useCallback(async () => {
    try {
      const data = await getMaterials(undefined, 'Active');
      setMaterials(data);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      toast.error('載入原物料失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const data = await getStockRecords({
        materialId: filterMaterialId ? parseInt(filterMaterialId) : undefined,
        changeType: filterChangeType || undefined,
        pageSize: 50,
      });
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      toast.error('載入記錄失敗');
    } finally {
      setRecordsLoading(false);
    }
  }, [filterMaterialId, filterChangeType]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords();
    }
  }, [activeTab, fetchRecords]);

  const getSelectedMaterial = (id: string) => materials.find((m) => m.id.toString() === id);

  const handleStockIn = async () => {
    if (!stockInMaterialId || !stockInQuantity) {
      toast.error('請選擇原物料並輸入數量');
      return;
    }
    try {
      await stockIn(parseInt(stockInMaterialId), parseFloat(stockInQuantity), stockInNote || undefined);
      toast.success('入庫成功');
      setStockInMaterialId('');
      setStockInQuantity('');
      setStockInNote('');
      fetchMaterials();
    } catch (err) {
      console.error('Failed to stock in:', err);
      toast.error('入庫失敗');
    }
  };

  const handleAdjust = async () => {
    if (!adjustMaterialId || !adjustNewStock) {
      toast.error('請選擇原物料並輸入新庫存');
      return;
    }
    try {
      await adjustStock(parseInt(adjustMaterialId), parseFloat(adjustNewStock), adjustNote || undefined);
      toast.success('盤點調整成功');
      setAdjustMaterialId('');
      setAdjustNewStock('');
      setAdjustNote('');
      fetchMaterials();
    } catch (err) {
      console.error('Failed to adjust:', err);
      toast.error('調整失敗');
    }
  };

  const handleWaste = async () => {
    if (!wasteMaterialId || !wasteQuantity) {
      toast.error('請選擇原物料並輸入數量');
      return;
    }
    try {
      await wasteStock(parseInt(wasteMaterialId), parseFloat(wasteQuantity), wasteNote || undefined);
      toast.success('報廢登記成功');
      setWasteMaterialId('');
      setWasteQuantity('');
      setWasteNote('');
      fetchMaterials();
    } catch (err) {
      console.error('Failed to waste:', err);
      toast.error('報廢登記失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">庫存作業</h2>
        <p className="text-gray-600 mt-1">入庫、盤點調整、報廢登記</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stock-in" className="flex items-center gap-1">
            <PackagePlus className="h-4 w-4" />
            入庫
          </TabsTrigger>
          <TabsTrigger value="adjust" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            盤點調整
          </TabsTrigger>
          <TabsTrigger value="waste" className="flex items-center gap-1">
            <PackageMinus className="h-4 w-4" />
            報廢
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            異動記錄
          </TabsTrigger>
        </TabsList>

        {/* 入庫 */}
        <TabsContent value="stock-in">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">入庫作業</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label>選擇原物料</Label>
                <Select value={stockInMaterialId} onValueChange={setStockInMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name} ({m.unit}) - 現有: {m.currentStock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>入庫數量 ({getSelectedMaterial(stockInMaterialId)?.unit || '單位'})</Label>
                <Input
                  type="number"
                  value={stockInQuantity}
                  onChange={(e) => setStockInQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>備註（選填）</Label>
                <Input
                  value={stockInNote}
                  onChange={(e) => setStockInNote(e.target.value)}
                  placeholder="例：廠商進貨"
                />
              </div>
              <Button onClick={handleStockIn} className="bg-green-600 hover:bg-green-700 w-full">
                <PackagePlus className="h-4 w-4 mr-2" />
                確認入庫
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 盤點調整 */}
        <TabsContent value="adjust">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">盤點調整</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label>選擇原物料</Label>
                <Select value={adjustMaterialId} onValueChange={setAdjustMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name} ({m.unit}) - 現有: {m.currentStock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {adjustMaterialId && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p>目前庫存：<strong>{getSelectedMaterial(adjustMaterialId)?.currentStock}</strong> {getSelectedMaterial(adjustMaterialId)?.unit}</p>
                </div>
              )}
              <div>
                <Label>實際庫存數量 ({getSelectedMaterial(adjustMaterialId)?.unit || '單位'})</Label>
                <Input
                  type="number"
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(e.target.value)}
                  placeholder="盤點後的實際數量"
                />
              </div>
              <div>
                <Label>備註（選填）</Label>
                <Input
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="例：月底盤點"
                />
              </div>
              <Button onClick={handleAdjust} className="bg-yellow-600 hover:bg-yellow-700 w-full">
                <ClipboardList className="h-4 w-4 mr-2" />
                確認調整
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 報廢 */}
        <TabsContent value="waste">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">報廢登記</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <Label>選擇原物料</Label>
                <Select value={wasteMaterialId} onValueChange={setWasteMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name} ({m.unit}) - 現有: {m.currentStock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>報廢數量 ({getSelectedMaterial(wasteMaterialId)?.unit || '單位'})</Label>
                <Input
                  type="number"
                  value={wasteQuantity}
                  onChange={(e) => setWasteQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>報廢原因</Label>
                <Input
                  value={wasteNote}
                  onChange={(e) => setWasteNote(e.target.value)}
                  placeholder="例：過期、損壞"
                />
              </div>
              <Button onClick={handleWaste} className="bg-red-600 hover:bg-red-700 w-full">
                <PackageMinus className="h-4 w-4 mr-2" />
                確認報廢
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 異動記錄 */}
        <TabsContent value="records">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Select value={filterMaterialId || 'all'} onValueChange={(v) => setFilterMaterialId(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="全部原物料" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部原物料</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterChangeType || 'all'} onValueChange={(v) => setFilterChangeType(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="全部類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="In">入庫</SelectItem>
                  <SelectItem value="Out">出庫</SelectItem>
                  <SelectItem value="Adjust">調整</SelectItem>
                  <SelectItem value="Waste">報廢</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchRecords}>
                查詢
              </Button>
            </div>

            {recordsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">時間</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">原物料</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">類型</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">異動量</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">庫存變化</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const typeInfo = CHANGE_TYPE_LABELS[record.changeType];
                      return (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">
                            {new Date(record.createdAt).toLocaleString('zh-TW')}
                          </td>
                          <td className="py-3 px-4 font-medium">{record.materialName}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${record.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {record.quantity >= 0 ? '+' : ''}{record.quantity}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-500">
                            {record.stockBefore} → {record.stockAfter}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{record.note || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!recordsLoading && records.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                沒有找到記錄
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
