'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Parse headings from HTML content (only h1, h2, h3)
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');

    const items: TocItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || '';

      // Generate ID if not present
      let id = heading.id;
      if (!id) {
        id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        // Add index to ensure uniqueness
        id = `${id}-${index}`;
      }

      items.push({ id, text, level });
    });

    setTocItems(items);

    // Add IDs to actual DOM headings after component mounts
    setTimeout(() => {
      const articleHeadings = document.querySelectorAll('article h1, article h2, article h3');
      articleHeadings.forEach((heading, index) => {
        if (!heading.id && items[index]) {
          heading.id = items[index].id;
        }
      });
    }, 100);
  }, [content]);

  useEffect(() => {
    // Intersection Observer to track active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    // Observe all headings
    const headingElements = document.querySelectorAll('article h1, article h2, article h3');
    headingElements.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading);
      }
    });

    return () => {
      headingElements.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading);
        }
      });
    };
  }, [tocItems]);

  const handleClick = (id: string) => {
    // Immediately update active state
    setActiveId(id);

    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <nav
      className="sticky top-32 bg-gray-50 p-5 overflow-y-auto border-l-2 border-blue-500 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-blue-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200"
      style={{ position: 'sticky', top: '8rem', maxHeight: 'calc(100vh - 10rem)' }}
    >
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">
        On This Page
      </h3>
      <ul className="space-y-1">
        {tocItems.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
          >
            <button
              onClick={() => handleClick(item.id)}
              className={`text-left w-full text-sm py-1.5 px-2 rounded transition-all hover:bg-white hover:text-blue-600 ${
                activeId === item.id
                  ? 'text-blue-600 font-semibold bg-white'
                  : 'text-gray-700 font-normal'
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}