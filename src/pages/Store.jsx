import { useState } from "react";
import { Store, Star, Crown, Zap, CheckCircle, Loader2 } from "lucide-react";
import { getCurrentSessionUser, getCurrentUser } from '@/api/auth';
import { createPurchase } from "../api/purchases";

export default function StorePage() {
  const [loading, setLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Mock products matching your specification
  const products = [
    {
      id: 'youdating_plus',
      name: 'YouDating Plus',
      price: 9.99,
      type: 'subscription',
      period: '/month',
      icon: Crown,
      iconColor: 'text-pink-500',
      description: 'Unlock unlimited swipes, see who likes you, and get priority in discovery',
      features: [
        'Unlimited swipes',
        'See who likes you', 
        'Priority in discovery',
        'Ad-free experience',
        '5 Super Likes per day'
      ],
      popular: true
    },
    {
      id: 'boost_single',
      name: '1 Boost',
      price: 2.99,
      type: 'consumable',
      period: '',
      icon: Zap,
      iconColor: 'text-yellow-500',
      description: 'Be seen by 10x more people for 30 minutes',
      features: [
        'Instant visibility boost',
        'Lasts for 30 minutes',
        'Get 10x more profile views',
        'Perfect for peak hours'
      ]
    },
    {
      id: 'super_likes_pack',
      name: '5 Super Likes',
      price: 4.99,
      type: 'consumable', 
      period: '',
      icon: Star,
      iconColor: 'text-blue-500',
      description: 'Stand out with special notifications that get you noticed',
      features: [
        '5 Super Like credits',
        'Get 3x more matches',
        'Stand out from the crowd',
        'Credits never expire'
      ]
    }
  ];

  const handlePurchase = async (product) => {
    try {
      setLoading({ ...loading, [product.id]: true });
      setError('');
      setSuccessMessage('');

      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Please log in to make a purchase');
      }

      // Create purchase record
      const purchaseData = await createPurchase({
        userId: user.id,
        productId: product.id,
        metadata: {
          product_name: product.name,
          price: product.price,
          type: product.type,
          purchased_at: new Date().toISOString()
        }
      });

      console.log('Purchase created:', purchaseData);
      
      // Show success message
      setSuccessMessage(`Successfully purchased ${product.name}!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Purchase error:', err);
      setError(`Failed to purchase ${product.name}: ${err.message}`);
    } finally {
      setLoading({ ...loading, [product.id]: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-16">
              <Store className="w-8 h-8" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">Premium Store</h1>
        <p className="text-xl text-base-content/70">
          Unlock premium features and boost your dating experience
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid gap-6">
        {products.map((product) => {
          const IconComponent = product.icon;
          const isLoading = loading[product.id];
          
          return (
            <div
              key={product.id}
              className={`card bg-base-100 shadow-xl ${
                product.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {product.popular && (
                <div className="badge badge-primary absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                  Most Popular
                </div>
              )}
              
              <div className="card-body">
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  {/* Product Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="avatar placeholder">
                        <div className="bg-primary/10 text-primary rounded-full w-12">
                          <IconComponent className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <h3 className="card-title text-xl">{product.name}</h3>
                        <p className="text-2xl font-bold text-primary">
                          ${product.price.toFixed(2)}{product.period}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-base-content/70 mb-4">{product.description}</p>
                    
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Purchase Button */}
                  <div className="card-actions justify-center">
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={isLoading}
                      className={`btn w-full ${
                        product.popular ? 'btn-primary' : 'btn-outline btn-primary'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                    
                    {product.type === 'subscription' && (
                      <p className="text-xs text-base-content/50 text-center mt-2">
                        Cancel anytime • No hidden fees
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Security */}
      <div className="card bg-primary/5 border-primary/20">
        <div className="card-body text-center">
          <h2 className="card-title text-2xl justify-center mb-4">Secure Payments</h2>
          <p className="text-base-content/70 mb-6">
            Your payment information is encrypted and secure. All purchases are processed through secure channels.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-base-content/60">
            <span>💳 All major cards accepted</span>
            <span>🔒 SSL encrypted</span>
            <span>📱 Apple Pay & Google Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}