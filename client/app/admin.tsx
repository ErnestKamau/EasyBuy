// app/admin.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/app/_layout';
import { productsApi, Category, Product } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  Tag,
  AlertTriangle,
  Save,
  X
} from 'lucide-react-native';

export default function AdminScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'alerts'>('categories');

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image_url: '',
    category: '',
    kilograms: '',
    sale_price: '',
    cost_price: '',
    in_stock: '',
    minimum_stock: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      ToastService.showError('Access Denied', 'Admin access required');
      router.back();
      return;
    }
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData, lowStockData] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getProducts(),
        productsApi.getLowStockProducts()
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setLowStockProducts(Array.isArray(lowStockData?.products) ? lowStockData.products : []);
    } catch (error) {
      ToastService.showApiError(error, 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Category Management
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    }
    setShowCategoryModal(true);
  };

  const saveCategoryForm = async () => {
    if (!categoryForm.name.trim()) {
      ToastService.showError('Validation Error', 'Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await productsApi.updateCategory(editingCategory.id, categoryForm.name);
        ToastService.showSuccess('Success', 'Category updated successfully');
      } else {
        await productsApi.createCategory(categoryForm.name);
        ToastService.showSuccess('Success', 'Category created successfully');
      }
      setShowCategoryModal(false);
      loadAdminData();
    } catch (error) {
      ToastService.showApiError(error, 'Failed to save category');
    }
  };

  // Product Management
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        category: product.category.toString(),
        kilograms: product.kilograms?.toString() || '',
        sale_price: product.sale_price.toString(),
        cost_price: product.cost_price.toString(),
        in_stock: product.in_stock.toString(),
        minimum_stock: product.minimum_stock.toString(),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        image_url: '',
        category: '',
        kilograms: '',
        sale_price: '',
        cost_price: '',
        in_stock: '',
        minimum_stock: '',
      });
    }
    setShowProductModal(true);
  };

  const saveProductForm = async () => {
    // Validation
    if (!productForm.name.trim() || !productForm.category || !productForm.sale_price || !productForm.cost_price) {
      ToastService.showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        image_url: productForm.image_url,
        category: parseInt(productForm.category),
        kilograms: productForm.kilograms ? parseFloat(productForm.kilograms) : null,
        sale_price: parseFloat(productForm.sale_price),
        cost_price: parseFloat(productForm.cost_price),
        in_stock: parseInt(productForm.in_stock) || 0,
        minimum_stock: parseInt(productForm.minimum_stock) || 5,
        is_active: true,
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, productData);
        ToastService.showSuccess('Success', 'Product updated successfully');
      } else {
        await productsApi.createProduct(productData);
        ToastService.showSuccess('Success', 'Product created successfully');
      }
      
      setShowProductModal(false);
      loadAdminData();
    } catch (error) {
      ToastService.showApiError(error, 'Failed to save product');
    }
  };

  const deleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                await productsApi.deleteCategory(category.id);
                ToastService.showSuccess('Success', 'Category deleted successfully');
                loadAdminData();
              } catch (error) {
                ToastService.showApiError(error, 'Failed to delete category');
              }
            })();
          },
        },
      ]
    );
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                await productsApi.deleteProduct(product.id);
                ToastService.showSuccess('Success', 'Product deleted successfully');
                loadAdminData();
              } catch (error) {
                ToastService.showApiError(error, 'Failed to delete product');
              }
            })();
          },
        },
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.products_count} products</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openCategoryModal(item)}
        >
          <Edit size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteCategory(item)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>
          {item.category_name} • Ksh {item.sale_price} • Stock: {item.in_stock}
        </Text>
        {item.is_low_stock && (
          <Text style={styles.lowStockIndicator}>⚠️ Low Stock</Text>
        )}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openProductModal(item)}
        >
          <Edit size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteProduct(item)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Tag size={20} color={activeTab === 'categories' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            Categories
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Package size={20} color={activeTab === 'products' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <AlertTriangle size={20} color={activeTab === 'alerts' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts ({lowStockProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'categories' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories ({categories.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openCategoryModal()}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
                          <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              key={categories.length} // Force re-render when categories change
              extraData={categories.length} // Force re-render when data changes
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Products ({products.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openProductModal()}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              key={products.length} // Force re-render when products change
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {activeTab === 'alerts' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            {lowStockProducts.length > 0 ? (
              <FlatList
                data={lowStockProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                key={lowStockProducts.length} // Force re-render when low stock products change
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noAlerts}>
                <AlertTriangle size={48} color="#22C55E" />
                <Text style={styles.noAlertsText}>No low stock alerts</Text>
                <Text style={styles.noAlertsSubtext}>All products are well stocked</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>Category Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter category name"
                value={categoryForm.name}
                onChangeText={(text) => setCategoryForm({ name: text })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveCategoryForm}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowProductModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter product name"
                  value={productForm.name}
                  onChangeText={(text) => setProductForm({ ...productForm, name: text })}
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter product description"
                  value={productForm.description}
                  onChangeText={(text) => setProductForm({ ...productForm, description: text })}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.fieldLabel}>Image URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter image URL"
                  value={productForm.image_url}
                  onChangeText={(text) => setProductForm({ ...productForm, image_url: text })}
                />

                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.pickerContainer}>
                  {Array.isArray(categories) && categories.length > 0 ? categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        productForm.category === category.id.toString() && styles.selectedCategoryOption
                      ]}
                      onPress={() => setProductForm({ ...productForm, category: category.id.toString() })}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        productForm.category === category.id.toString() && styles.selectedCategoryOptionText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  )) : (
                    <Text style={styles.noCategoriesText}>No categories available. Please create categories first.</Text>
                  )}
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.0"
                      value={productForm.kilograms}
                      onChangeText={(text) => setProductForm({ ...productForm, kilograms: text })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Sale Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.00"
                      value={productForm.sale_price}
                      onChangeText={(text) => setProductForm({ ...productForm, sale_price: text })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Cost Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.00"
                      value={productForm.cost_price}
                      onChangeText={(text) => setProductForm({ ...productForm, cost_price: text })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>In Stock</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0"
                      value={productForm.in_stock}
                      onChangeText={(text) => setProductForm({ ...productForm, in_stock: text })}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Minimum Stock Level</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5"
                  value={productForm.minimum_stock}
                  onChangeText={(text) => setProductForm({ ...productForm, minimum_stock: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowProductModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveProductForm}
                >
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#8B5CF6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    padding: 12,
  },

  // Item Cards
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  lowStockIndicator: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 8,
  },

  // No Alerts
  noAlerts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22C55E',
    marginTop: 16,
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#64748B',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },

  // Form
  formContainer: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formColumn: {
    flex: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedCategoryOption: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedCategoryOptionText: {
    color: '#FFFFFF',
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#EF4444',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});