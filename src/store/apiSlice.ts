import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from "firebase/firestore";

export const apiSlice = createApi({
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Products", "Brands", "Orders", "Reviews"],
  endpoints: (builder) => ({
    // Get all products
    getProducts: builder.query({
      async queryFn() {
        try {
          const snapshot = await getDocs(collection(db, "products"));
          const products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          return { data: products };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ["Products"],
    }),

    // Get single product
    getProduct: builder.query({
      async queryFn(id: string) {
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { data: { id: docSnap.id, ...docSnap.data() } };
          }
          return { error: { message: "Product not found" } };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // Get all brands
    getBrands: builder.query({
      async queryFn() {
        try {
          const snapshot = await getDocs(collection(db, "brands"));
          const brands = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          return { data: brands };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ["Brands"],
    }),

    // Get products by brand
    getProductsByBrand: builder.query({
      async queryFn(brandId: string) {
        try {
          const q = query(
            collection(db, "products"),
            where("brandId", "==", brandId)
          );
          const snapshot = await getDocs(q);
          const products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          return { data: products };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (result, error, brandId) => [
        { type: "Products", id: `brand-${brandId}` },
      ],
    }),

    // Get new drops (products with isNew flag)
    getNewDrops: builder.query({
      async queryFn() {
        try {
          const q = query(
            collection(db, "products"),
            where("isNew", "==", true),
            orderBy("createdAt", "desc"),
            limit(20)
          );
          const snapshot = await getDocs(q);
          const products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          return { data: products };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ["Products"],
    }),

    // Get sale products
    getSaleProducts: builder.query({
      async queryFn() {
        try {
          const q = query(
            collection(db, "products"),
            where("isOnSale", "==", true),
            orderBy("discountPercent", "desc"),
            limit(20)
          );
          const snapshot = await getDocs(q);
          const products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          return { data: products };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ["Products"],
    }),

    // Get reviews for a product
    getProductReviews: builder.query({
      async queryFn(productId: string) {
        try {
          const q = query(
            collection(db, "reviews"),
            where("productId", "==", productId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);
          const reviews = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          return { data: reviews };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (result, error, productId) => [
        { type: "Reviews", id: productId },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetBrandsQuery,
  useGetProductsByBrandQuery,
  useGetNewDropsQuery,
  useGetSaleProductsQuery,
  useGetProductReviewsQuery,
} = apiSlice;
