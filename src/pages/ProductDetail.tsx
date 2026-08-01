import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingBag, Star, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  is_new: boolean;
  is_sale: boolean;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error fetching product:", error);
    } else {
      setProduct(data);
      if (data.colors?.length) setSelectedColor(data.colors[0]);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("product_reviews")
      .select(`
        id,
        user_id,
        rating,
        title,
        content,
        created_at
      `)
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error("Error fetching reviews:", error);
    } else if (data) {
      // Fetch profile names for each review
      const reviewsWithProfiles = await Promise.all(
        data.map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.user_id)
            .single();
          return {
            ...review,
            profiles: profile ? { full_name: profile.full_name } : null,
          };
        })
      );
      setReviews(reviewsWithProfiles);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantity, undefined, selectedColor);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast.error("Please sign in to leave a review");
      return;
    }

    setSubmittingReview(true);
    const { error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: id,
        user_id: user.id,
        rating: reviewRating,
        title: reviewTitle,
        content: reviewContent,
      });

    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted successfully!");
      setReviewTitle("");
      setReviewContent("");
      setReviewRating(5);
      fetchReviews();
    }
    setSubmittingReview(false);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button asChild>
            <Link to="/services/it-hardware-sales">Back to Shop</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <Link
            to="/services/it-hardware-sales"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  {product.is_new && <Badge className="bg-primary shadow-lg border-none">New</Badge>}
                  {product.is_sale && <Badge className="bg-red-500 shadow-lg border-none">Sale</Badge>}
                  {product.stock <= 0 && <Badge variant="destructive" className="shadow-lg border-none">Not Available</Badge>}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${idx === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground capitalize mb-2">{product.category}</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-primary text-primary" : "text-muted"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.original_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.original_price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              {product.colors.length > 0 && (
                <div className="space-y-3">
                  <Label>Color: <span className="font-semibold">{selectedColor}</span></Label>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${selectedColor === color
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {/* Quantity */}
              <div className="space-y-3">
                <Label>Quantity</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    product.stock <= 0 ? "text-red-500" :
                      product.stock < 5 ? "text-orange-500 animate-pulse" : "text-muted-foreground"
                  )}>
                    {product.stock <= 0 ? "Out of Stock" :
                      product.stock < 5 ? `⚠️ Low Stock: Only ${product.stock} left!` :
                        `${product.stock} in stock`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  size="lg"
                  className={cn("w-full gap-2 transition-all", product.stock <= 0 ? "bg-muted text-muted-foreground" : "gradient-primary")}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {product.stock <= 0 ? "Currently Unavailable" : "Add to Cart"}
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <div className="text-sm font-semibold">Free Shipping</div>
                  <div className="text-xs text-muted-foreground">Pan India</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">2 Year Warranty</div>
                  <div className="text-xs text-muted-foreground">Quality assured</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">Easy Returns</div>
                  <div className="text-xs text-muted-foreground">30 day returns</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16">
            <Tabs defaultValue="reviews">
              <TabsList>
                <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                <TabsTrigger value="write-review">Write a Review</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">Be the first to review this product</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"
                                    }`}
                                />
                              ))}
                            </div>
                            <h4 className="font-semibold">{review.title}</h4>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.content}</p>
                        <p className="text-sm text-muted-foreground mt-3">
                          — {review.profiles?.full_name || "Anonymous"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="write-review" className="mt-6">
                {!user ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Sign in to write a review</h3>
                    <p className="text-muted-foreground mb-4">
                      You need to be logged in to leave a review
                    </p>
                    <Button asChild>
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="max-w-xl space-y-6">
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= reviewRating ? "fill-primary text-primary" : "text-muted"
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-title">Title</Label>
                      <Input
                        id="review-title"
                        placeholder="Summarize your review"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="review-content">Review</Label>
                      <Textarea
                        id="review-content"
                        placeholder="Share your experience with this product"
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetail;
