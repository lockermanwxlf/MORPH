import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
})

interface Lesson {
    title: string
    description: string
}

const lessons: Lesson[] = [
    { title: 'Lesson 1: Learning to Drive', description: 'Learn how to drive your robot using the on-screen controls' },
]

function RouteComponent() {
    const [selectedItem, setSelectedItem] = useState<Lesson | null>(null)

    return (
        <div className="h-screen flex bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            {/* Left Panel - Scrolling List */}
            <div className="w-80 border-r border-slate-700 bg-slate-900/50 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold">Lessons</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-2">
                        {lessons.map((lesson) => (
                            <button
                                key={lesson.title}
                                onClick={() => setSelectedItem(lesson)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition ${selectedItem?.title === lesson.title
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                            >
                                {lesson.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Display */}
            <div className="flex-1 flex items-center justify-center">
                {selectedItem ? (
                    <div className="text-center flex flex-col">
                        <h1 className="text-4xl font-bold">{selectedItem.title}</h1>
                        <p className="text-slate-400 mt-2">{selectedItem.description}</p>
                        <Link to="/lesson" className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">Start Lesson</Link>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p className="text-xl">Select an item from the list</p>
                    </div>
                )}
            </div>
        </div>
    )
}
