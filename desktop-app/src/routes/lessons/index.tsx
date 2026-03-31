import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/lessons/")({
  component: RouteComponent,
});

const lessons = [
  {
    route: "/lessons/intro",
    name: "Lesson 1: Learning How to Drive",
    description:
      "Practice basic movement and understand how wheel motion changes as you drive and turn.",
  },
  {
    route: "/lessons/intro",
    name: "Lesson 2: Precision Turning",
    description:
      "Build smoother turns by controlling left and right wheel speed with short movement bursts.",
  },
  {
    route: "/lessons/intro",
    name: "Lesson 3: Obstacle Navigation",
    description:
      "Use careful steering and speed control to move through a simple obstacle course.",
  },
  {
    route: "/lessons/intro",
    name: "Lesson 4: Challenge Run",
    description:
      "Combine everything you've learned to complete a timed route with consistent control.",
  },
];

function RouteComponent() {
  return (
    <div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
      <section className="flex w-full flex-1 flex-col rounded-2xl border border-(--line) bg-(--surface) p-5 shadow-[0_18px_40px_var(--shadow-0)] sm:p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-(--ink-0)">
            Lessons
          </h1>
          <p className="mt-1 text-sm text-(--ink-1)">
            Pick a lesson to keep building your driving skills.
          </p>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lessons.map((lesson) => (
            <Link
              key={lesson.name}
              to={lesson.route}
              className="aspect-square rounded-2xl border border-(--line) bg-white/5 p-4 shadow-[0_12px_24px_var(--shadow-0)] transition-all hover:-translate-y-0.5 hover:bg-(--brand-soft)"
            >
              <div className="flex h-full flex-col">
                <h2 className="text-base font-semibold text-(--ink-0)">
                  {lesson.name}
                </h2>
                <p className="mt-2 text-sm text-(--ink-1)">{lesson.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
