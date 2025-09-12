interface StructuredDataProps {
  type: 'WebApplication' | 'Organization' | 'Product' | 'Article' | 'FAQPage';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    return JSON.stringify(baseData);
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: getStructuredData(),
      }}
    />
  );
}

// Predefined structured data for common pages
export const WebApplicationSchema = {
  name: 'chartz.ai',
  description: 'AI-powered data visualization platform that turns data into stunning dashboards and charts in seconds',
  url: 'https://chartz.ai',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available'
  },
  creator: {
    '@type': 'Organization',
    name: 'chartz.ai',
    url: 'https://chartz.ai'
  },
  featureList: [
    'AI-powered chart generation',
    'Multiple chart types support',
    'Real-time data visualization',
    'Dashboard creation',
    'CSV data import',
    'Interactive charts'
  ]
};

export const OrganizationSchema = {
  name: 'chartz.ai',
  description: 'AI-powered data visualization platform',
  url: 'https://chartz.ai',
  logo: '/logo.png',
  sameAs: [
    // Add your social media profiles when available
    // 'https://twitter.com/chartz_ai',
    // 'https://linkedin.com/company/chartz-ai'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://chartz.ai/contact'
  }
};

export const ProductSchema = {
  name: 'chartz.ai Platform',
  description: 'AI-powered data visualization tool that creates stunning charts and dashboards automatically',
  brand: {
    '@type': 'Brand',
    name: 'chartz.ai'
  },
  category: 'Data Visualization Software',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '15',
    priceCurrency: 'USD',
    offerCount: '3',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Up to 5 charts per month'
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '15',
        priceCurrency: 'USD',
        description: 'Unlimited charts and advanced features'
      }
    ]
  }
};