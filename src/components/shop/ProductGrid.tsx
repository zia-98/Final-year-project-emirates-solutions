import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Filter, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  images: string[];
  category: string;
  is_new: boolean;
  is_sale: boolean;
  description: string | null;
  stock: number;
}

interface Category {
  value: string;
  label: string;
}

interface ProductGridProps {
  shopType?: string;
  shopTypes?: string[];
  categories: Category[];
  title?: string;
}

const ProductGrid = ({ shopType, shopTypes, categories, title }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("featured");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [shopType, shopTypes]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("id, name, price, original_price, images, category, is_new, is_sale, is_featured, description, stock")
      .order("is_featured", { ascending: false });

    if (shopTypes && shopTypes.length > 0) {
      query = query.in("shop_type", shopTypes);
    } else if (shopType) {
      query = query.eq("shop_type", shopType);
    }

    const { data, error } = await query;

    if (error) {
      if (import.meta.env.DEV) console.error("Error fetching products:", error);
    } else {
      // Deduplicate products by name
      const uniqueProducts: Product[] = [];
      const seen = new Set<string>();
      for (const p of data || []) {
        if (!seen.has(p.name)) {
          seen.add(p.name);
          uniqueProducts.push(p);
        }
      }
      setProducts(uniqueProducts);
    }
    setLoading(false);
  };

  // Get unique price ranges for filter
  const maxPrice = Math.max(...products.map(p => p.price), 0);
  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-25000", label: "Under ₹25,000" },
    { value: "25000-50000", label: "₹25,000 - ₹50,000" },
    { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
    { value: "100000+", label: "Above ₹1,00,000" },
  ];

  const handlePriceRangeChange = (value: string) => {
    if (value === "all") {
      setPriceRange(null);
    } else if (value === "100000+") {
      setPriceRange({ min: 100000, max: Infinity });
    } else {
      const [min, max] = value.split("-").map(Number);
      setPriceRange({ min, max });
    }
  };

  const filteredProducts = products
    .filter(p => {
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = !priceRange || 
        (p.price >= priceRange.min && p.price <= priceRange.max);
      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "newest") return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      return 0;
    });

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id, 1);
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setSearchQuery("");
    setPriceRange(null);
    setSortBy("featured");
  };

  // Get unique dynamic categories
  const dynamicCategories = Array.from(new Set(products.map(p => p.category)))
    .filter(cat => !categories.some(c => c.value === cat))
    .map(cat => ({ value: cat, label: cat }));
    
  const allCategories = [...categories, ...dynamicCategories];

  const hasActiveFilters = categoryFilter !== "all" || searchQuery || priceRange;

  return (
    <div className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
        )}
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto md:mx-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={priceRange ? `${priceRange.min}-${priceRange.max === Infinity ? '+' : priceRange.max}` : "all"} 
              onValueChange={handlePriceRangeChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredProducts.length} of {products.length} products
        </p>

        {/* Products Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">No products found</p>
            <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img 
                      src={product.images?.[0] || "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400"} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.is_new && (
                        <Badge className="bg-primary text-primary-foreground">New</Badge>
                      )}
                      {product.is_sale && (
                        <Badge className="bg-red-500 text-white">Sale</Badge>
                      )}
                      {product.stock === 0 && (
                        <Badge variant="secondary">Out of Stock</Badge>
                      )}
                    </div>


                    {/* Add to Cart Overlay */}
                    {product.stock > 0 && (
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          className="w-full gap-2"
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </Button>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.original_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.original_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {product.original_price && (
                      <p className="text-xs text-green-600 mt-1">
                        Save ₹{(product.original_price - product.price).toLocaleString('en-IN')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
