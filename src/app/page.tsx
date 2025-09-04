import LandingPage from './components/LandingPage';
import StructuredData, { 
  WebApplicationSchema, 
  OrganizationSchema, 
  ProductSchema 
} from './components/StructuredData';

export default function Home() {
  return (
    <>
      <StructuredData type="WebApplication" data={WebApplicationSchema} />
      <StructuredData type="Organization" data={OrganizationSchema} />
      <StructuredData type="Product" data={ProductSchema} />
      <LandingPage />
    </>
  );
}

