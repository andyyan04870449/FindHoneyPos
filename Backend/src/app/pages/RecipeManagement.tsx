import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { Material, ProductWithRecipes, ProductRecipe } from '@/types';
import { getMaterials, getProductsWithRecipes, updateProductRecipes } from '@/lib/api';

interface RecipeItem {
  materialId: number;
  materialName: string;
  materialUnit: string;
  quantity: number;
}

export function RecipeManagement() {
  const [products, setProducts] = useState<ProductWithRecipes[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productsData, materialsData] = await Promise.all([
        getProductsWithRecipes(),
        getMaterials(undefined, 'Active'),
      ]);
      setProducts(productsData);
      setMaterials(materialsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSelectProduct = (productId: number) => {
    if (hasChanges) {
      if (!confirm('有未儲存的變更，確定要切換嗎？')) return;
    }
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setRecipes(
        product.recipes.map((r) => ({
          materialId: r.materialId,
          materialName: r.materialName,
          materialUnit: r.materialUnit,
          quantity: r.quantity,
        }))
      );
    } else {
      setRecipes([]);
    }
    setHasChanges(false);
  };

  const handleAddRecipe = () => {
    // 找出尚未使用的原物料
    const usedMaterialIds = recipes.map((r) => r.materialId);
    const availableMaterials = materials.filter((m) => !usedMaterialIds.includes(m.id));
    if (availableMaterials.length === 0) {
      toast.error('所有原物料都已加入配方');
      return;
    }
    const firstAvailable = availableMaterials[0];
    setRecipes([
      ...recipes,
      {
        materialId: firstAvailable.id,
        materialName: firstAvailable.name,
        materialUnit: firstAvailable.unit,
        quantity: 0,
      },
    ]);
    setHasChanges(true);
  };

  const handleRemoveRecipe = (index: number) => {
    setRecipes(recipes.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleChangeMaterial = (index: number, materialId: number) => {
    const material = materials.find((m) => m.id === materialId);
    if (!material) return;
    const newRecipes = [...recipes];
    newRecipes[index] = {
      ...newRecipes[index],
      materialId,
      materialName: material.name,
      materialUnit: material.unit,
    };
    setRecipes(newRecipes);
    setHasChanges(true);
  };

  const handleChangeQuantity = (index: number, quantity: number) => {
    const newRecipes = [...recipes];
    newRecipes[index] = { ...newRecipes[index], quantity };
    setRecipes(newRecipes);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedProductId) return;

    // 驗證
    for (const r of recipes) {
      if (r.quantity <= 0) {
        toast.error('配方數量必須大於 0');
        return;
      }
    }

    // 檢查重複原物料
    const materialIds = recipes.map((r) => r.materialId);
    if (new Set(materialIds).size !== materialIds.length) {
      toast.error('配方中有重複的原物料');
      return;
    }

    setSaving(true);
    try {
      await updateProductRecipes(
        selectedProductId,
        recipes.map((r) => ({ materialId: r.materialId, quantity: r.quantity }))
      );
      toast.success('配方已儲存');
      setHasChanges(false);
      fetchData(); // 重新載入以更新列表
    } catch (err) {
      console.error('Failed to save recipes:', err);
      toast.error('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold">配方設定</h2>
        <p className="text-gray-600 mt-1">設定每個商品所需的原物料用量</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：商品列表 */}
        <Card className="p-4 lg:col-span-1">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜尋商品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedProductId === product.id
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{product.name}</span>
                    {product.recipes.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {product.recipes.length} 項
                      </Badge>
                    )}
                  </div>
                  {product.category && (
                    <span className="text-xs text-gray-500">{product.category}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* 右側：配方編輯 */}
        <Card className="p-4 lg:col-span-2">
          {selectedProduct ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500">
                    {recipes.length > 0 ? `${recipes.length} 種原物料` : '尚未設定配方'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddRecipe}>
                    <Plus className="h-4 w-4 mr-1" />
                    新增原料
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    儲存
                  </Button>
                </div>
              </div>

              {recipes.length > 0 ? (
                <div className="space-y-3">
                  {recipes.map((recipe, index) => {
                    const usedMaterialIds = recipes.filter((_, i) => i !== index).map((r) => r.materialId);
                    const availableMaterials = materials.filter(
                      (m) => m.id === recipe.materialId || !usedMaterialIds.includes(m.id)
                    );

                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500">原物料</Label>
                          <Select
                            value={recipe.materialId.toString()}
                            onValueChange={(v) => handleChangeMaterial(index, parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMaterials.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.name} ({m.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32">
                          <Label className="text-xs text-gray-500">用量 ({recipe.materialUnit})</Label>
                          <Input
                            type="number"
                            value={recipe.quantity || ''}
                            onChange={(e) => handleChangeQuantity(index, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRecipe(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>尚未設定配方</p>
                  <p className="text-sm mt-1">點擊「新增原料」開始設定</p>
                </div>
              )}

              {hasChanges && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  有未儲存的變更
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>請從左側選擇商品</p>
              <p className="text-sm mt-1">來設定該商品的配方</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
