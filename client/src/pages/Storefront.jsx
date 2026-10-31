import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Zap, ArrowUpDown, Check } from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useUtm } from '../hooks/useUtm';

const Storefront = () => {
  useUtm(); // Capture UTM params automatically if visitor arrives via an ad
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [sort, inStockOnly]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/products?sort=${sort}`;
      if (inStockOnly) url += '&inStock=true';
      const res = await api.get(url);
      setProducts(res.data.data.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tagline?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>CLINICALLY STANDARDIZED PERFORMANCE NUTRITION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight">
            ENGINEERED FOR MEN WHO <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">REFUSE TO SETTLE</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Experience peak physical vigor, relentless stamina, and unshakeable executive focus. 100% Ayurvedic herbs, pure Himalayan Shilajit, and zero fillers.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#catalog"
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-sky-500/25"
            >
              Shop Core Formulations
            </a>
            <Link
              to="/lp/alpha-bold"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition flex items-center gap-2"
            >
              <span>View Alpha Bold Campaign</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">20% OFF</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">The Alpha Lineup</h2>
            <p className="text-xs text-slate-400 mt-0.5">High-impact daily regimens for peak male vitality</p>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent focus:outline-none text-xs cursor-pointer text-white"
              >
                <option value="newest" className="bg-slate-900">Newest Formulations</option>
                <option value="price-asc" className="bg-slate-900">Price: Low to High</option>
                <option value="price-desc" className="bg-slate-900">Price: High to Low</option>
              </select>
            </div>

            {/* In Stock Filter */}
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                inStockOnly
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${inStockOnly ? 'opacity-100' : 'opacity-30'}`} />
              <span>In Stock Only</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            No products match your search or filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
            {filteredProducts.map((product) => {
              const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

              return (
                <div
                  key={product._id}
                  className="group bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-sky-500/5"
                >
                  <Link to={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden bg-slate-950">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                      <span className="absolute top-3 right-3 bg-amber-500/90 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Only {product.stock} left!
                      </span>
                    )}
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold">4.9</span>
                        <span className="text-slate-500 text-[10px]">(Verified)</span>
                      </div>

                      <Link to={`/product/${product.slug}`}>
                        <h3 className="font-bold text-white text-sm hover:text-sky-400 transition line-clamp-2">
                          {product.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {product.tagline || product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-white">₹{product.price}</span>
                          <span className="text-xs text-slate-500 line-through">₹{product.mrp}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">Free Express Delivery</span>
                      </div>

                      <button
                        onClick={() => addToCart(product, 1)}
                        className="p-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center shadow-md shadow-sky-500/20 active:scale-95"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Storefront;
