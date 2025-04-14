import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import ProductSearch from "@/components/products/product-search";
import ProductTable from "@/components/products/product-table";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { AddProductModal, EditProductModal, DeleteProductModal } from "@/components/products/product-modals";

export default function HomePage() {
  // States for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{field: string, direction: 'asc' | 'desc'} | null>(null);
  
  // States for modals
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Handle product selection for edit/delete
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditProductOpen(true);
  };
  
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteProductOpen(true);
  };
  
  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter && categoryFilter !== 'all' ? product.category === categoryFilter : true;
    
    let matchesStock = true;
    if (stockFilter === 'in_stock') {
      matchesStock = product.stock > 5;
    } else if (stockFilter === 'low_stock') {
      matchesStock = product.stock > 0 && product.stock <= 5;
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = product.stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { field, direction } = sortConfig;
    
    if (field === 'id') {
      return direction === 'asc' ? a.id - b.id : b.id - a.id;
    }
    
    if (field === 'name') {
      return direction === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    
    if (field === 'category') {
      return direction === 'asc' 
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    }
    
    if (field === 'price') {
      return direction === 'asc' ? a.price - b.price : b.price - a.price;
    }
    
    if (field === 'stock') {
      return direction === 'asc' ? a.stock - b.stock : b.stock - a.stock;
    }
    
    return 0;
  });
  
  // Calculate dashboard stats
  const dashboardStats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.stock > 5).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };
  
  // Handle sorting
  const handleSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig?.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ field, direction });
  };
  
  // Handle filter reset
  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortConfig(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-2 text-sm bg-white border rounded-md flex items-center gap-1 hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Export
              </button>
              <button 
                onClick={() => setAddProductOpen(true)}
                className="px-3 py-2 text-sm bg-primary text-white rounded-md flex items-center gap-1 hover:bg-primary/90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Add Product
              </button>
            </div>
          </div>
          
          <DashboardStats stats={dashboardStats} />
          
          <ProductSearch 
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            stockFilter={stockFilter}
            onSearchChange={setSearchQuery}
            onCategoryChange={setCategoryFilter}
            onStockChange={setStockFilter}
            onResetFilters={handleResetFilters}
          />
          
          <ProductTable 
            products={sortedProducts}
            isLoading={isLoading}
            sortConfig={sortConfig}
            onSort={handleSort}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </main>
      </div>
      
      {/* Modals */}
      <AddProductModal 
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
      />
      
      {selectedProduct && (
        <>
          <EditProductModal
            isOpen={editProductOpen}
            onClose={() => setEditProductOpen(false)}
            product={selectedProduct}
          />
          
          <DeleteProductModal
            isOpen={deleteProductOpen}
            onClose={() => setDeleteProductOpen(false)}
            product={selectedProduct}
          />
        </>
      )}
    </div>
  );
}
