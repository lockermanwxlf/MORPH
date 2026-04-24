import type { LessonTaskContent } from "$lib/lessons/driving/types.js";

export const k5IntroTask: LessonTaskContent = {
    badge: "K-5 • Lesson 1",
    title: "Learning How to Drive",
    description:
        "Welcome to MORPH's first lesson. You will learn how to drive your robot using W, A, S, D and on-screen controls.",
    sections: [
        {
            title: "Description",
            bullets: [
                "You will learn what each key does: W, A, S, and D.",
                "You will learn how left and right wheels make the robot move.",
                "You will practice with simple movement questions.",
            ],
        },
        {
            title: "Completion criteria",
            bullets: [
                "You can explain what the left and right wheels are doing.",
                "You can identify movement direction for W and S.",
                "You can identify rotation direction for A and D.",
            ],
        },
    ],
    rightNav: {
        href: "/hub/lesson/driving/k-5/meet-your-robot",
        label: "Start →",
        variant: "primary",
    },
};

export const k5MeetRobotTask: LessonTaskContent = {
    badge: "Task 1",
    title: "Meet Your Robot",
    description: "Your robot moves because the wheels on each side spin.",
    sections: [
        {
            title: "How the wheels work",
            bullets: [
                "Wheels on the left side and right side work together.",
                "If both sides roll forward, the robot moves forward.",
                "If both sides roll backward, the robot moves backward.",
                "If one side rolls forward and the other backward, the robot turns in place.",
            ],
        },
        {
            title: "Remember",
            paragraphs: [
                "Left and right wheel motion decides whether MORPH goes straight, backward, or rotates.",
            ],
        },
    ],
    leftNav: {
        href: "/hub/lesson/driving/k-5",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/lesson/driving/k-5/try-it-out",
        label: "Next: Try it out →",
        variant: "primary",
    },
};

export const k5OnYourOwnTask: LessonTaskContent = {
    badge: "Final Task",
    title: "On your own",
    sections: [
        {
            paragraphs: [
                "Place the robot in an open space, and try to maneuver it around to a different location.",
                "Whenever you're ready, proceed to the completion page.",
            ],
        },
    ],
    leftNav: {
        href: "/hub/lesson/driving/k-5/try-it-out",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/lesson/driving/k-5/completion",
        label: "Proceed to completion →",
        variant: "primary",
    },
};

export const k5CompletionTask: LessonTaskContent = {
    badge: "Completed",
    title: "Lesson complete",
    description: "Great job finishing K-5 Lesson 1: Learning How to Drive.",
    leftNav: {
        href: "/hub/lesson/driving/k-5/on-your-own",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/learning",
        label: "Return to Learning →",
        variant: "primary",
    },
};
