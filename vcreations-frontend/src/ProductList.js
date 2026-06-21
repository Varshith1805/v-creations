import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useCart } from "./CartContext";

function Toast({ message, show }) {
  return (
    <div className="toast" style={{ transform: show ? "translateY(0)" : "translateY(100px)", opacity: show ? 1 : 0, transition: "all 0.3s" }}>
      <span>✅ {message}</span>
    </div>
  );
}

function ProductImg({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src || "");
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
      <img
        src={imgSrc || "https://placehold.co/300x300/7B1818/FFD700?text=Rakhi"}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => { setImgSrc("https://placehold.co/300x300/7B1818/FFD700?text=Rakhi"); setLoaded(true); }}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
      />
    </>
  );
}

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const { addToCart } = useCart();
  const perPage = 8;

  useEffect(() => {
    setLoading(true);
    axios.get("/products")
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2500);
  }, []);

  const handleAdd = (product) => {
    addToCart(product);
    showToast(`${product.name} added to cart!`);
  };

  let filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || p.category === category)
  );

  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);

  const displayed = filtered.slice(0, page * perPage);
  const hasMore = displayed.length < filtered.length;
  const categories = ["All", "Designer Rakhis", "Silver Rakhis", "Gold Rakhis", "Kids Rakhis", "Premium Rakhis"];

  const SkeletonCard = () => (
    <div className="product-card">
      <div className="skeleton" style={{ aspectRatio: "1", width: "100%" }} />
      <div className="product-info">
        <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: "50%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: "30%" }} />
      </div>
    </div>
  );

  return (
    <div>
      <Toast message={toastMsg} show={toastShow} />

      <div className="hero">
        <h1>🪢 Celebrate the Bond of Brotherhood 🪢</h1>
        <p>Discover our exclusive Rakshabandhan collection — beautiful rakhis for your beloved brother</p>
        <div className="hero-offers">
          <span>🪢 Designer Rakhis</span>
          <span>✨ Premium Silk Rakhis</span>
          <span>🎀 Silver & Gold Rakhis</span>
          <span>✨ Free Shipping</span>
        </div>
      </div>

      <div className="categories">
        {categories.map(c => (
          <span key={c} className={`cat-chip ${category === c ? "active" : ""}`} onClick={() => { setCategory(c); setPage(1); }}>{c}</span>
        ))}
      </div>

      <div className="section-header">
        <h2>Rakshabandhan Collection</h2>
        <div className="search-filter">
          <div className="search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input className="input" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{width:180}} />
          </div>
          <select className="input" value={sort} onChange={e => setSort(e.target.value)} style={{width:140,fontSize:13}}>
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="product-grid stagger">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : displayed.map(p => (
              <div className="product-card" key={p._id}>
                <div className="product-img" style={{ position: "relative" }}>
                  <ProductImg src={p.image} alt={p.name} />
                  <div className="product-quick-add">
                    <button onClick={() => handleAdd(p)}>Add to Cart</button>
                  </div>
                </div>
                <div className="product-info">
                  <div className="product-brand">Rakhi Special</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-rating">
                    <span className="stars">{'★'.repeat(4)}{'☆'.repeat(1)}</span>
                    <span className="rating-count">(12)</span>
                  </div>
                  <div className="product-price-row">
                    <span className="product-price">₹{p.price}</span>
                    <span className="product-price-original">₹{Math.round(p.price * 1.3)}</span>
                    <span className="product-discount">-{Math.round((1 - p.price / (p.price * 1.3)) * 100)}%</span>
                  </div>
                  {p.offers && p.offers.length > 0 && <div className="offer-badge">🎉 {p.offers.map(o => typeof o === "string" ? o : `Buy ${o.quantity} for ₹${o.price}`).join(", ")}</div>}
                  <div className="product-delivery">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    <span>Free delivery by Rakshabandhan</span>
                  </div>
                  <div className={`product-stock ${p.stock <= 0 ? "product-stock--out" : p.stock < 5 ? "product-stock--low" : ""}`}>
                    {p.stock <= 0 ? "Currently unavailable" : `Only ${p.stock} left in stock`}
                  </div>
                </div>
              </div>
            ))
        }
      </div>

      {hasMore && (
        <div className="load-more">
          <button className="btn btn-primary" onClick={() => setPage(p => p + 1)}>
            Load More ({filtered.length - displayed.length} remaining)
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="cart-empty">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-light)" strokeWidth="1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <h3>No products found</h3>
          <p>Try a different search or category</p>
        </div>
      )}
    </div>
  );
}
