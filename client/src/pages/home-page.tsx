// import Navbar from "@/components/layout/navbar";
// import Sidebar from "@/components/layout/sidebar";
// import DashboardStats from "@/components/dashboard/dashboard-stats";
// import ProductSearch from "@/components/products/product-search";
// import ProductTable from "@/components/products/product-table";
// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { Product } from "@shared/schema";
// import { AddProductModal, EditProductModal, DeleteProductModal } from "@/components/products/product-modals";

// export default function HomePage() {
//   // States for filtering and sorting
//   const [searchQuery, setSearchQuery] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("all");
//   const [stockFilter, setStockFilter] = useState("all");
//   const [sortConfig, setSortConfig] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);

//   // States for modals
//   const [addProductOpen, setAddProductOpen] = useState(false);
//   const [editProductOpen, setEditProductOpen] = useState(false);
//   const [addProductTab, setAddProductTab] = useState<"form" | "json">("form");
//   const [deleteProductOpen, setDeleteProductOpen] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

//   const queryClient = useQueryClient();

//   // Fetch products
//   const { data: products = [], isLoading, error } = useQuery<Product[]>({
//     queryKey: ["/api/products"],
//   });

  // Mutation to upload products from JSON


//   // Handle product selection for edit/delete
//   const handleEditProduct = (product: Product) => {
//     setSelectedProduct(product);
//     setEditProductOpen(true);
//   };

//   const handleDeleteProduct = (product: Product) => {
//     setSelectedProduct(product);
//     setDeleteProductOpen(true);
//   };

//   // Filter and sort products
//   const filteredProducts = products.filter((product) => {
//     const matchesSearch =
//       product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

//     const matchesCategory = categoryFilter && categoryFilter !== "all" ? product.category === categoryFilter : true;

//     let matchesStock = true;
//     if (stockFilter === "in_stock") {
//       matchesStock = product.stock > 5;
//     } else if (stockFilter === "low_stock") {
//       matchesStock = product.stock > 0 && product.stock <= 5;
//     } else if (stockFilter === "out_of_stock") {
//       matchesStock = product.stock === 0;
//     }

//     return matchesSearch && matchesCategory && matchesStock;
//   });

//   // Sort products
//   const sortedProducts = [...filteredProducts].sort((a, b) => {
//     if (!sortConfig) return 0;

//     const { field, direction } = sortConfig;

//     if (field === "id") {
//       return direction === "asc" ? a.id - b.id : b.id - a.id;
//     }

//     if (field === "name") {
//       return direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
//     }

//     if (field === "category") {
//       return direction === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
//     }

//     if (field === "price") {
//       return direction === "asc" ? a.price - b.price : b.price - a.price;
//     }

//     if (field === "stock") {
//       return direction === "asc" ? a.stock - b.stock : b.stock - a.stock;
//     }

//     return 0;
//   });

//   // Calculate dashboard stats
//   const dashboardStats = {
//     totalProducts: products.length,
//     inStock: products.filter((p) => p.stock > 5).length,
//     lowStock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
//     outOfStock: products.filter((p) => p.stock === 0).length,
//   };

//   // Handle sorting
//   const handleSort = (field: string) => {
//     let direction: "asc" | "desc" = "asc";

//     if (sortConfig?.field === field && sortConfig.direction === "asc") {
//       direction = "desc";
//     }

//     setSortConfig({ field, direction });
//   };

//   // Handle filter reset
//   const handleResetFilters = () => {
//     setSearchQuery("");
//     setCategoryFilter("all");
//     setStockFilter("all");
//     setSortConfig(null);
//   };

  // Handle JSON file upload

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col">
//       <Navbar />

//       <div className="flex flex-1">
//         <Sidebar />

//         <main className="flex-1 p-4 md:p-6 overflow-auto">
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            
//           </div>

//           <DashboardStats stats={dashboardStats} />

//           <ProductSearch
//             searchQuery={searchQuery}
//             categoryFilter={categoryFilter}
//             stockFilter={stockFilter}
//             onSearchChange={setSearchQuery}
//             onCategoryChange={setCategoryFilter}
//             onStockChange={setStockFilter}
//             onResetFilters={handleResetFilters}
//           />

//           <ProductTable
//             products={sortedProducts}
//             isLoading={isLoading}
//             sortConfig={sortConfig}
//             onSort={handleSort}
//             onEdit={handleEditProduct}
//             onDelete={handleDeleteProduct}
//           />
//         </main>
//       </div>

//       {/* Modals */}
//       <AddProductModal
//   isOpen={addProductOpen}
//   onClose={() => setAddProductOpen(false)}
//   activeTab={addProductTab}
//   onTabChange={setAddProductTab}
// />

//       {selectedProduct && (
//         <>
//           <EditProductModal
//             isOpen={editProductOpen}
//             onClose={() => setEditProductOpen(false)}
//             product={selectedProduct}
//           />

//           <DeleteProductModal
//             isOpen={deleteProductOpen}
//             onClose={() => setDeleteProductOpen(false)}
//             product={selectedProduct}
//           />
//         </>
//       )}
//     </div>
//   );
// }
import { Pagination } from "antd"; // Import Ant Design Pagination
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import ProductSearch from "@/components/products/product-search";
import ProductTable from "@/components/products/product-table";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { AddProductModal, EditProductModal, DeleteProductModal } from "@/components/products/product-modals";
export default function HomePage() {
  // States for filtering, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [itemsPerPage, setItemsPerPage] = useState(5); // Items per page

  // States for modals
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [addProductTab, setAddProductTab] = useState<"form" | "json">("form");
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  const uploadProductsMutation = useMutation({
    mutationFn: uploadProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      console.error("Upload mutation error:", error);
    },
  });

  async function uploadProducts(products: any[]) {
    for (const product of products) {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        });
  
        if (!res.ok) {
          const error = await res.json();
          console.error("Upload failed:", error);
          alert(`Failed to upload product "${product.title}".\nError ${res.status}: ${error.message}`);
          continue;
        }
  
        const data = await res.json();
        console.log("Uploaded product:", data);
      } catch (err) {
        console.error("Network or parsing error:", err);
        alert(`Failed to upload product "${product.title}".\nNetwork error.`);
      }
    }
    alert("Upload finished.");
  }
  
  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter && categoryFilter !== "all" ? product.category === categoryFilter : true;

    let matchesStock = true;
    if (stockFilter === "in_stock") {
      matchesStock = product.stock > 5;
    } else if (stockFilter === "low_stock") {
      matchesStock = product.stock > 0 && product.stock <= 5;
    } else if (stockFilter === "out_of_stock") {
      matchesStock = product.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig) return 0;

    const { field, direction } = sortConfig;

    if (field === "id") {
      return direction === "asc" ? a.id - b.id : b.id - a.id;
    }

    if (field === "name") {
      return direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }

    if (field === "category") {
      return direction === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
    }

    if (field === "price") {
      return direction === "asc" ? a.price - b.price : b.price - a.price;
    }

    if (field === "stock") {
      return direction === "asc" ? a.stock - b.stock : b.stock - a.stock;
    }

    return 0;
  });

  // Paginate products
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setItemsPerPage(pageSize);
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalProducts: products.length,
    inStock: products.filter((p) => p.stock > 5).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  function handleResetFilters(): void {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortConfig(null);
    setCurrentPage(1); // Reset to the first page
  }
  function handleSort(field: string): void {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig?.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ field, direction });
  }
  function handleEditProduct(product: { id: number; name: string; description: string | null; price: number; stock: number; imageUrl: string | null; category: string; }): void {
    setSelectedProduct(product); // Set the selected product for editing
    setEditProductOpen(true); // Open the edit product modal
  }

  function handleDeleteProduct(product: { id: number; name: string; description: string | null; price: number; stock: number; imageUrl: string | null; category: string; }): void {
    setSelectedProduct(product); // Set the selected product for deletion
    setDeleteProductOpen(true); // Open the delete product modal
  }
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert("No file selected.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        console.log("Parsed JSON:", json);
        if (Array.isArray(json)) {
          uploadProductsMutation.mutate(json);
        } else {
          alert("Invalid file format. Must be an array of products.");
        }
      } catch (err) {
        alert("Failed to read or parse the file. Please ensure it is a valid JSON file.");
        console.error(err);
      }
    };
  
    reader.onerror = () => {
      alert("Error reading the file.");
    };
  
    reader.readAsText(file);
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
              <button className="px-3 py-2 text-sm bg-white border rounded-md flex items-center gap-1 hover:bg-gray-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Export
              </button>
              <button
                onClick={() => {
                  setAddProductOpen(true);
                  setAddProductTab("form");
                }}
                className="px-3 py-2 text-sm bg-primary text-white rounded-md flex items-center gap-1 hover:bg-primary/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Add Product
              </button>
              <label className="px-3 py-2 text-sm bg-primary text-white rounded-md flex items-center gap-1 hover:bg-primary/90 cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleJsonUpload}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 16v6H8v-6H5l7-7 7 7h-3z" />
                </svg>
                Upload JSON
              </label>
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
            products={paginatedProducts} // Pass paginated products
            isLoading={isLoading}
            sortConfig={sortConfig}
            onSort={handleSort}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />

          {/* Pagination */}
          <div className="flex justify-end mt-4">
            <Pagination
              current={currentPage}
              pageSize={itemsPerPage}
              total={sortedProducts.length}
              onChange={handlePaginationChange}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        activeTab={addProductTab}
        onTabChange={setAddProductTab}
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