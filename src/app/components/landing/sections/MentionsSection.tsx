'use client';

export default function MentionsSection() {
  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Mentions</h3>
          <div className="flex justify-center items-center gap-8">
            <a
              href="https://www.toolpilot.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/toolpilot.png"
                alt="ToolPilot"
                className="h-10 w-auto"
              />
            </a>
            <a
              href="https://dang.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png"
                alt="Dang.ai"
                className="w-[150px] h-[54px]"
                width="150"
                height="54"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}