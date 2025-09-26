const fs = require('fs');
const path = require('path');

// We need to use dynamic import for ES modules
async function importBlogFunctions() {
  try {
    // Try to import from a CommonJS version or use dynamic import
    const blogModule = await import('../src/lib/blog.js');
    return {
      getAllBlogPosts: blogModule.getAllBlogPosts,
      getAllCategories: blogModule.getAllCategories,
      getAllTags: blogModule.getAllTags,
    };
  } catch (error) {
    // Fallback: create simplified versions using direct file reading
    return createFallbackFunctions();
  }
}

function createFallbackFunctions() {
  const matter = require('gray-matter');

  const getAllBlogPosts = () => {
    const postsDirectory = path.join(process.cwd(), 'content/blog/posts');
    const filenames = fs.existsSync(postsDirectory) ? fs.readdirSync(postsDirectory) : [];

    return filenames
      .filter(name => name.endsWith('.md'))
      .map(filename => {
        const filePath = path.join(postsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);

        return {
          slug: filename.replace(/\.md$/, ''),
          title: data.title || 'Untitled',
          excerpt: data.excerpt || '',
          publishedAt: data.publishedAt || new Date().toISOString(),
          author: data.author || 'chartz.ai Team',
          category: data.category || 'general',
          tags: data.tags || [],
          featured: data.featured || false,
          ...data
        };
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  };

  const getAllCategories = () => {
    const posts = getAllBlogPosts();
    const categories = [...new Set(posts.map(post => post.category))];
    return categories.filter(Boolean);
  };

  const getAllTags = () => {
    const posts = getAllBlogPosts();
    const tags = [...new Set(posts.flatMap(post => post.tags || []))];
    return tags.filter(Boolean);
  };

  return { getAllBlogPosts, getAllCategories, getAllTags };
}

async function generateBlogData() {
  try {
    console.log('Generating blog data...');

    const { getAllBlogPosts, getAllCategories, getAllTags } = await importBlogFunctions();

    const [posts, categories, tags] = await Promise.all([
      getAllBlogPosts(),
      getAllCategories(),
      getAllTags(),
    ]);

    const blogData = {
      posts,
      categories,
      tags,
      generatedAt: new Date().toISOString(),
    };

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to public directory so it's accessible in production
    const outputPath = path.join(publicDir, 'blog-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(blogData, null, 2));

    console.log(`✅ Blog data generated successfully: ${outputPath}`);
    console.log(`📊 Generated ${posts.length} posts, ${categories.length} categories, ${tags.length} tags`);
  } catch (error) {
    console.error('❌ Failed to generate blog data:', error);
    process.exit(1);
  }
}

generateBlogData();