import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { CartProvider, useCart } from "./CartContext";

import ProductList from "./ProductList";
import Cart from "./Cart";
import AdminDashboard from "./AdminDashboard";
import Checkout from "./Checkout";
import Login from "./Login";
import UserOrders from "./UserOrders";
import "./design-system.css";
import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [pathname]);
  return null;
}

function Header() {
  const { items, userEmail, userName } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="announcement-bar">
        <span>🎉 Free shipping on orders over ₹499</span>
        <span>🪢 Rakhi Special — Up to 40% Off</span>
        <span>✨ Use code RAKHI15 for extra 15% off</span>
      </div>
      <div className="header-main container">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🪢</span>
          <span className="logo-text">V Creations</span>
        </Link>

        <div className="header-search">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Search rakhi collection..." className="input" />
          <button className="search-btn">🔍 Search</button>
        </div>

        <div className="header-actions">
          <Link to={userEmail ? "/orders" : "/login"} className="header-cart" style={{fontSize:13,gap:4}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {userEmail ? (userName || "Account") : "Login"}
          </Link>
          <Link to="/cart" className="header-cart">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
        </div>
      </div>
      <nav className="header-nav container">
        <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>Home</Link>
        <Link to="/cart" className={location.pathname === "/cart" ? "nav-link active" : "nav-link"}>Cart</Link>
        <Link to="/checkout" className={location.pathname === "/checkout" ? "nav-link active" : "nav-link"}>Checkout</Link>
        <Link to={userEmail ? "/orders" : "/login"} className={location.pathname === "/orders" || location.pathname === "/login" ? "nav-link active" : "nav-link"}>{userEmail ? "My Orders" : "Login"}</Link>
      </nav>
    </header>
  );
}

function HomeRoute() {
  const { userEmail } = useCart();
  return userEmail ? <ProductList /> : <Navigate to="/login" replace />;
}

function AppLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  return (
    <>
      {!isLogin && (
        <>
          <div className="floating-shapes" aria-hidden="true">
            <div className="floating-shape floating-shape--circle" />
            <div className="floating-shape floating-shape--square" />
            <div className="floating-shape floating-shape--triangle" />
            <div className="floating-shape floating-shape--circle" style={{width:40,height:40,top:"80%",left:"80%"}} />
            <div className="floating-shape floating-shape--square" style={{width:50,height:50,top:"10%",right:"5%"}} />
          </div>
          <div className="sparkles" aria-hidden="true">
            {[...Array(8)].map((_, i) => <div key={i} className="sparkle" />)}
          </div>
          <div className="floating-bg" aria-hidden="true">
            <div className="floating-blob" />
            <div className="floating-blob" />
            <div className="floating-blob" />
          </div>
          <Header />
        </>
      )}
      <main className={isLogin ? "" : "container"} style={isLogin ? {position:"relative",zIndex:1} : {position:"relative",zIndex:1,paddingTop:"32px",paddingBottom:"64px"}}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<UserOrders />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppLayout />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
