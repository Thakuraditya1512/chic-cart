import { useParams, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import ProductCard from "@/components/ProductCard";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
import { Product } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";

interface Brand {
  id: string;
  name: string;
  image: string;
  description?: string;
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: any;
}

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (id) {
      fetchProductAndRelated();
      fetchReviews();
    }
  }, [id]);

  const fetchProductAndRelated = async () => {
    try {
      setLoading(true);

      // Fetch product
      const productRef = doc(db, "products", id!);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        setProduct(null);
        return;
      }

      const productData = {
        id: productSnap.id,
        ...productSnap.data(),
        rating: productSnap.data().rating || 4.5,
      } as Product;
      setProduct(productData);

      // Fetch brand details if brandId exists
      if (productData.brandId) {
        const brandRef = doc(db, "brands", productData.brandId);
        const brandSnap = await getDoc(brandRef);
        if (brandSnap.exists()) {
          setBrand({
            id: brandSnap.id,
            ...brandSnap.data(),
          } as Brand);
        }

        // Fetch all products from same brand
        const productsRef = collection(db, "products");
        const allProducts = await getDocs(productsRef);
        const sameBrandProducts = allProducts.docs
          .filter(
            (doc) =>
              doc.data().brandId === productData.brandId && doc.id !== id
          )
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            rating: doc.data().rating || 4.5,
          } as Product))
          .slice(0, 8); // Show up to 8 related products
        setRelatedProducts(sameBrandProducts);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("productId", "==", id), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Fallback if index is not yet created
      try {
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("productId", "==", id));
        const snapshot = await getDocs(q);
        const fetchedReviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Review));
        setReviews(fetchedReviews);
      } catch (innerError) {
        console.error("Critical error fetching reviews:", innerError);
      }
    }
  };

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | FTK - Flex The Kicks`;
    }
  }, [product]);

  if (loading) {
    return <LoadingScreen variant="product" />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Link to="/" className="text-foreground underline underline-offset-4">Go back</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image, ...(product.images || [])],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": brand?.name || "FTK"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
      "reviewCount": reviews.length
    } : undefined
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <main className="container mx-auto px-4 py-6 md:py-12 pb-20 md:pb-12">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} />
          
        </Link>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary cursor-zoom-in"
              onClick={() => setImageZoomed(!imageZoomed)}
            >
              <img
                src={product.images && product.images.length > 0 ? product.images[activeImageIndex] : product.image}
                key={activeImageIndex}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${imageZoomed ? "scale-150" : "scale-100"}`}
              />
              {product.badge && (
                <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm ${
                  product.badge === "sale" ? "bg-sale text-sale-foreground" : "bg-badge text-badge-foreground"
                }`}>
                  {product.badge}
                </span>
              )}

              {/* Tap to Scroll Overlay (Mobile indication) */}
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-widest pointer-events-none">
                  Tap to slide
                </div>
              )}
            </motion.div>

            {/* Thumbnails / Image Dots */}
            {product.images && product.images.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx ? "border-foreground" : "border-border opacity-50"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{product.category}</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : product.rating) ? "fill-foreground text-foreground" : "text-border"} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : product.rating} 
                ({reviews.length} reviews)
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-border bg-card/20 w-fit">
              <span className="text-2xl font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
              {product.originalPrice && (
                <span className="text-xs font-bold uppercase px-2 py-1 bg-sale text-sale-foreground rounded-sm">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-11 px-4 text-sm font-medium rounded-sm border transition-colors ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Minus size={16} />
                </button>
                <span className="w-11 h-11 flex items-center justify-center text-sm font-medium text-foreground border-x border-border">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={() => addToCart(product, qty)}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="w-11 h-11 flex items-center justify-center border border-border rounded-sm text-foreground hover:text-sale transition-colors"
              >
                <Heart size={18} fill={wishlisted ? "currentColor" : "none"} className={wishlisted ? "text-sale" : ""} />
              </button>
            </div>

            {/* Colors */}
            {product.colors && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">Available Colors</p>
                <p className="text-sm text-muted-foreground">{product.colors.join(", ")}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16 md:mt-24 p-6 md:p-10 rounded-3xl border border-border bg-card/10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Customer Reviews</h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-foreground">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                    : product.rating}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < Math.floor(reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : product.rating) ? "fill-foreground text-foreground" : "text-border text-muted-foreground"} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Based on {reviews.length} reviews</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8">
            {reviews.length === 0 ? (
              <div className="p-12 rounded-lg border border-dashed border-border text-center">
                <p className="text-muted-foreground">No reviews yet for this product. Be the first to share your thoughts!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="pb-8 border-b border-border last:border-0"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? "fill-foreground text-foreground" : "text-border"} />
                        ))}
                      </div>
                      <p className="text-sm font-bold text-foreground uppercase tracking-wider">{review.customerName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{review.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {review.images.map((img, idx) => (
                        <div key={idx} className="w-20 h-20 rounded-md overflow-hidden bg-secondary">
                          <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              More from {brand?.name || "this Brand"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-8">Check out other shoes from this brand</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      <CartDrawer />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default ProductDetail;
