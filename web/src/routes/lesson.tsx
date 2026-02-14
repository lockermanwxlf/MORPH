import { DPad } from "@/components/DPad";
import { createFileRoute } from "@tanstack/react-router"
export const Route = createFileRoute("/lesson")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold">Lesson 1: Learning How to Drive</h1>
                    <p className="text-slate-400 mt-2">
                        Learn how to drive your robot using keyboard controls (W, A, S, D) or on-screen buttons
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
                <div className="text-lg leading-relaxed">
                    <p className="mb-4">
                        Welcome to <strong>MORPH's</strong> first lesson! In this lesson, you'll learn how to make your robot move.
                    </p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Task 1: Test Drive</h2>
                    <p>This is the D-pad, short for directional pad. It lets you tell your robot to move forward and backward and turn left and right.</p>
                    <DPad />
                    <p>Try pressing the buttons on the D-pad to see how they move your robot!</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Task 2: Observe</h2>
                    <p>As you press the buttons, take a look at how the wheels on each side of your robot move.</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        <li>When you press <strong>forward</strong>, both wheels spin forward.</li>
                        <li>When you press <strong>backward</strong>, both wheels spin backward.</li>
                    </ul>
                    <p className="mt-4">What direction do the wheels spin when you rotate left or right?</p>
                    <p className="mt-4">Notice that when you turn left, the right wheel spins forward, bringing the right of the robot forward, while the left wheel spins backward, bringing the left of the robot backward. This causes the robot to turn left.</p>
                </section>



            </div>
        </div>
    );
}