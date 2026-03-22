import { useParams, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import ProductCard from "@/components/ProductCard";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, where, orderBy, documentId, limit } from "firebase/firestore";
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
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const imageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (id) {
      fetchProductAndRelated();
      fetchReviews();
    }
  }, [id]);

  // GSAP entrance animation
  useEffect(() => {
    if (!loading && product && imageRef.current && detailsRef.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(
        detailsRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );
    }
  }, [loading, product]);

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
          .slice(0, 8);
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
      
      // Update recently viewed in localStorage
      const stored = localStorage.getItem("recentlyViewed");
      let ids: string[] = stored ? JSON.parse(stored) : [];
      ids = [product.id, ...ids.filter(id => id !== product.id)].slice(0, 8);
      localStorage.setItem("recentlyViewed", JSON.stringify(ids));
      
      // Fetch recently viewed items (excluding current)
      const fetchRecentItems = async () => {
        const otherIds = ids.filter(id => id !== product.id).slice(0, 4);
        if (otherIds.length === 0) {
          setRecentlyViewed([]);
          return;
        }

        try {
          const q = query(collection(db, "products"), where(documentId(), "in", otherIds));
          const snap = await getDocs(q);
          const items = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            rating: d.data().rating || 4.5
          } as Product));
          // Sort them to match requested order
          const sortedItems = items.sort((a, b) => otherIds.indexOf(a.id) - otherIds.indexOf(b.id));
          setRecentlyViewed(sortedItems);
        } catch (err) {
          console.error("Error fetching recently viewed products:", err);
        }
      };
      
      fetchRecentItems();
    }
  }, [product]);

  // Add to cart animation
  const handleAddToCart = () => {
    if (addToCartBtnRef.current) {
      gsap.to(addToCartBtnRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          addToCart(product!, qty);
        }
      });
    } else {
      addToCart(product!, qty);
    }
  };

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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-12 pb-24 md:pb-12">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors">
          <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
          Back
        </Link>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 md:gap-16">
          {/* Image Section */}
          <div ref={imageRef} className="flex flex-col gap-3 sm:gap-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden bg-secondary cursor-zoom-in"
              onClick={() => setImageZoomed(!imageZoomed)}
            >
              <img
                src={product.images && product.images.length > 0 ? product.images[activeImageIndex] : product.image}
                key={activeImageIndex}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${imageZoomed ? "scale-150" : "scale-100"}`}
              />
              {product.badge && (
                <span className={`absolute top-3 left-3 sm:top-4 sm:left-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm ${
                  product.badge === "sale" ? "bg-sale text-sale-foreground" : "bg-badge text-badge-foreground"
                }`}>
                  {product.badge}
                </span>
              )}

              {/* Tap to Scroll Overlay (Mobile indication) */}
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/50 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] text-white font-bold uppercase tracking-widest pointer-events-none">
                  Tap to zoom
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
                    className={`w-10 h-14 sm:w-12 sm:h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
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
          <div ref={detailsRef}>
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-2">{product.category}</p>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={`sm:w-3.5 sm:h-3.5 ${i < Math.floor(reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : (product.rating || 0)) ? "fill-foreground text-foreground" : "text-border"}`} />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : (product.rating || 0)} 
                ({reviews.length} reviews)
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border border-border bg-card/20 w-fit">
              <span className="text-xl sm:text-2xl font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className="text-sm sm:text-lg text-muted-foreground line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
              {product.originalPrice && (
                <span className="text-[9px] sm:text-xs font-bold uppercase px-2 py-1 bg-sale text-sale-foreground rounded-sm">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && (
              <div className="mb-4 sm:mb-6">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground mb-2 sm:mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[40px] sm:min-w-[44px] h-9 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-sm border transition-colors ${
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
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center border border-border rounded-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Minus size={14} className="sm:w-4 sm:h-4" />
                </button>
                <span className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-xs sm:text-sm font-medium text-foreground border-x border-border">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
              <button
                ref={addToCartBtnRef}
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 h-9 sm:h-11 bg-primary text-primary-foreground font-medium text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm"
              >
                <ShoppingBag size={14} className="sm:w-4 sm:h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center border border-border rounded-sm text-foreground hover:text-sale transition-colors"
              >
                <Heart size={16} fill={wishlisted ? "currentColor" : "none"} className={`${wishlisted ? "text-sale" : ""} sm:w-[18px] sm:h-[18px]`} />
              </button>
            </div>

            {/* Colors */}
            {product.colors && (
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground mb-2">Available Colors</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{product.colors.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-12 sm:mt-16 md:mt-24">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
                  Recently Viewed
                </h2>
                <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold">
                  Items you've explored recently
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {recentlyViewed.map((p, i) => (
                <motion.div
                  key={`recent-${p.id}`}
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

        {/* You Might Like (Related) */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 sm:mt-16 md:mt-24">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
                  You Might Also Like
                </h2>
                <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold">
                  Hand-picked curation just for you
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={`related-${p.id}`}
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

        {/* Disclaimer & Affordability Paragraph */}
        <section className="mt-12 sm:mt-16 md:mt-24">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 sm:p-8 md:p-12 rounded-3xl border border-border bg-card/20 backdrop-blur-sm relative overflow-hidden group">
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-px w-8 bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">FlexTheKicks Quality Standard</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 transition-colors">
                  Why FlexTheKicks?
                </h2>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-sale/10 border border-sale/20">
                    <p className="text-xs sm:text-sm font-bold text-sale-foreground flex items-center gap-2">
                       DISCLAIMER: 1st Copy Premium Quality
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 leading-relaxed">
                      Please note: These products are high-quality <strong>1st copies</strong>, not original brand manufactured. They are meticulously crafted to offer the same premium aesthetic, comfort, and build quality as the originals at a fraction of the cost.
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-6 py-1">
                    "At FlexTheKicks, we believe premium style shouldn't come with a premium price tag. We specializes in high-quality '1st copy' replicas that mirror the design, comfort, and durability of original releases. By sourcing directly and focusing on craftsmanship rather than brand markups, we provide you with the look you love at a price that makes sense. Whether you're a hardcore sneakerhead or just looking for everyday comfort, our collection offers the perfect balance of luxury aesthetics and affordability."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mt-12 sm:mt-16 md:mt-24 p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl border border-border bg-card/10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-8 mb-8 sm:mb-12">
            <div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">Customer Reviews</h2>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                    : (product.rating || 0)}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={`sm:w-4 sm:h-4 ${i < Math.floor(reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : (product.rating || 0)) ? "fill-foreground text-foreground" : "text-border text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Based on {reviews.length} reviews</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:gap-8">
            {reviews.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-lg border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">No reviews yet for this product. Be the first to share your thoughts!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="pb-6 sm:pb-8 border-b border-border last:border-0"
                >
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div>
                      <div className="flex items-center gap-0.5 mb-1 sm:mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={`sm:w-3 sm:h-3 ${i < review.rating ? "fill-foreground text-foreground" : "text-border"}`} />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">{review.customerName}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">{review.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-3 sm:mb-4">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                      {review.images.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-secondary">
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
      </main>
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      <CartDrawer />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default ProductDetail;
