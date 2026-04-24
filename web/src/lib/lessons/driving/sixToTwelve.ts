import type { LessonTaskContent } from "$lib/lessons/driving/types.js";

export const sixToTwelveIntroTask: LessonTaskContent = {
    badge: "6-12 • Lesson 1",
    title: "Learning How to Drive",
    description:
        "Drive with WASD, reason about wheel behavior, and then continue to Twist-message concepts.",
    sections: [
        {
            title: "Description",
            bullets: [
                "Use WASD and observe movement behavior.",
                "Connect wheel motion to directional control.",
                "Build intuition for linear and turning velocity.",
            ],
        },
        {
            title: "Completion criteria",
            bullets: [
                "You can explain forward/backward and left/right rotation behavior.",
                "You can correctly identify key-to-motion mapping.",
                "You are ready for ROS 2 Twist message interpretation.",
            ],
        },
    ],
    rightNav: {
        href: "/hub/lesson/driving/6-12/meet-your-robot",
        label: "Start →",
        variant: "primary",
    },
};

export const sixToTwelveMeetRobotTask: LessonTaskContent = {
    badge: "Task 1",
    title: "Meet Your Robot",
    description:
        "MORPH is a differential-drive robot. Left and right wheel behavior determines translation and rotation.",
    sections: [
        {
            title: "How wheel motion maps to behavior",
            bullets: [
                "Both wheels forward at similar speed: robot drives forward.",
                "Both wheels backward at similar speed: robot drives backward.",
                "Opposite wheel directions: robot rotates in place.",
            ],
        },
    ],
    leftNav: {
        href: "/hub/lesson/driving/6-12",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/lesson/driving/6-12/try-it-out",
        label: "Next: Try it out →",
        variant: "primary",
    },
};

export const sixToTwelveOnYourOwnTask: LessonTaskContent = {
    badge: "Final Task",
    title: "On your own",
    sections: [
        {
            paragraphs: [
                "Place the robot in an open space and drive it to another location with controlled turns.",
                "When you are ready, proceed to completion.",
            ],
        },
    ],
    leftNav: {
        href: "/hub/lesson/driving/6-12/try-it-out",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/lesson/driving/6-12/completion",
        label: "Proceed to completion →",
        variant: "primary",
    },
};

export const sixToTwelveCompletionTask: LessonTaskContent = {
    badge: "Completed",
    title: "Lesson complete",
    description: "Great job finishing 6-12 Lesson 1: Learning How to Drive.",
    leftNav: {
        href: "/hub/lesson/driving/6-12/on-your-own",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/learning",
        label: "Return to Learning →",
        variant: "primary",
    },
};
