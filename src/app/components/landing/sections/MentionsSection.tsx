'use client';

export default function MentionsSection() {
  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Mentions</h3>
          <div className="flex justify-center">
            <a
              href="https://www.toolpilot.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/toolpilot.png"
                alt="ToolPilot"
                className="h-12 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}