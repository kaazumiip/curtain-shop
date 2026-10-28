import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product }) => {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.imageUrl ? [{ url: product.imageUrl }] : [{ url: 'https://via.placeholder.com/400x530' }]);
  const displayImage = images[0]?.url;
  const secondImage = images[1]?.url || displayImage;

  const categoryLabel = product.subCategory
    ? t(product.subCategory.toLowerCase())
    : t(product.category?.toLowerCase().replace(' ', '_'));

  const isOutOfStock = Number(product.stock) <= 0;
  const hasDiscount = Number(product.originalPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product._id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: '#000',
        backgroundColor: '#fff',
        cursor: 'pointer',
        opacity: isOutOfStock ? 0.72 : 1
      }}
    >
      {/* Sharp Portrait Image Box */}
      <div
        style={{
          width: '100%',
          aspectRatio: '3 / 4',
          backgroundColor: '#f3f3f3',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <img
          src={isHovered ? secondImage : displayImage}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.04)' : 'scale(1)'
          }}
        />

        {/* Out of Stock Overlay Badge */}
        {isOutOfStock && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '4px 10px',
              fontSize: '0.66rem',
              fontWeight: '800',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            អស់ពីស្តុក
          </div>
        )}

        {/* Sale / Discount Percentage Badge */}
        {!isOutOfStock && hasDiscount && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '3px 8px',
              fontSize: '0.66rem',
              fontWeight: '800',
              letterSpacing: '0.4px'
            }}
          >
            -{discountPercent}%
          </div>
        )}
      </div>

      {/* Minimal Editorial Meta Row (Title Left, Price Right) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '8px 2px 18px 2px'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              color: '#000000',
              lineHeight: '1.3',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              letterSpacing: '0.2px'
            }}
          >
            {language === 'kh' && product.nameKh ? product.nameKh : product.name}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: '600',
              color: '#71717a',
              marginTop: '2px',
              textTransform: 'uppercase'
            }}
          >
            {categoryLabel}
          </div>
        </div>

        <div style={{ textAlign: 'right', whiteSpace: 'nowrap', lineHeight: '1.25' }}>
          <div
            style={{
              fontSize: '0.76rem',
              fontWeight: '800',
              color: hasDiscount ? '#dc2626' : '#000000'
            }}
          >
            ${Number(product.price).toFixed(2)}
          </div>
          {hasDiscount && (
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: '600',
                color: '#a1a1aa',
                textDecoration: 'line-through',
                marginTop: '1px'
              }}
            >
              ${Number(product.originalPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
