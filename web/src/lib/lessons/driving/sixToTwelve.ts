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

export const sixToTwelveTwistTask: LessonTaskContent = {
    badge: "Task 3",
    title: "WASD to Twist",
    description:
        "This page shows how held WASD keys are converted into a ROS 2 Twist message and sent to the robot.",
    sections: [
        {
            title: "What a Twist message is",
            paragraphs: [
                "A Twist message is a ROS 2 message that describes motion using linear.x and angular.z.",
                "linear.x tells the robot how fast to move forward or backward.",
                "angular.z tells the robot how fast to rotate left or right.",
            ],
        },
        {
            title: "Key mapping",
            bullets: [
                "W sets the desired forward velocity.",
                "S sets the desired backward velocity.",
                "A sets the desired left rotation.",
                "D sets the desired right rotation.",
            ],
        },
        {
            title: "Twist message",
            paragraphs: [
                "The app reads the held WASD keys and generates a ROS 2 Twist message from them.",
                "It puts forward and backward motion into linear.x and turning motion into angular.z.",
                "That Twist message is sent to the robot, and the robot uses the velocity values inside it to decide how to move its wheels.",
            ],
        },
    ],
    leftNav: {
        href: "/hub/lesson/driving/6-12/try-it-out",
        label: "← Back",
    },
    rightNav: {
        href: "/hub/lesson/driving/6-12/on-your-own",
        label: "Next: On your own →",
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
        href: "/hub/lesson/driving/6-12/twist-and-velocity",
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
