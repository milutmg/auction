import React from 'react';
import { Link } from 'react-router-dom';

// Simple responsive image mosaic highlighting variety.
const tiles = [
  { title: 'Rare Clocks', cat: 'Furniture & Clocks', img: 'https://images.unsplash.com/photo-1577701244128-7f9e434fcd54?auto=format&fit=crop&w=800&q=80', span: 'col-span-2 row-span-2' },
  { title: 'Silverware', cat: 'Silver', img: 'https://images.unsplash.com/photo-1548483531-7edb5d09c597?auto=format&fit=crop&w=800&q=80', span: 'col-span-1 row-span-1' },
  { title: 'Fine Art', cat: 'Fine Art', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80', span: 'col-span-1 row-span-1' },
  { title: 'Ceramics', cat: 'Ceramics', img: 'https://images.unsplash.com/photo-1530039251581-c38ce8a8a346?auto=format&fit=crop&w=800&q=80', span: 'col-span-1 row-span-1' },
  { title: 'Jewelry', cat: 'Jewelry', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', span: 'col-span-1 row-span-1' },
];

const CollectionsMosaic: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 to-background" />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Curated Collections</h2>
          <p className="text-muted-foreground">A glimpse into categories attracting serious collectors this week.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px] gap-4 md:gap-6">
          {tiles.map((t, i) => (
            <Link
              key={t.title}
              to={`/categories/${encodeURIComponent(t.cat)}`}
              className={`group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 animate-fade-in ${i===0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <img src={t.img} alt={t.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-2 left-3 right-3 text-white drop-shadow">
                <h3 className="text-sm md:text-base font-semibold font-display">{t.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsMosaic;
