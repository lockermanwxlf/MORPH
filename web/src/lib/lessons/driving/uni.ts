import type { LessonTaskContent } from "$lib/lessons/driving/types.js";

export const uniIntroTask: LessonTaskContent = {
	badge: "University • Lesson 1",
	title: "From WASD to Wheel Motion in ROS 2",
	description:
		"Practice core driving behaviors first, then continue to the ROS 2 Twist and control-pipeline deep dive.",
	sections: [
		{
			title: "Description",
			bullets: [
				"Drive with WASD and validate expected robot behavior.",
				"Relate movement to differential-drive wheel behavior.",
				"Prepare for Twist-message and controller-level analysis.",
			],
		},
		{
			title: "Completion criteria",
			bullets: [
				"You can predict movement and rotation from key inputs.",
				"You can explain left/right wheel behavior for each key.",
				"You are ready to map commands to ROS 2 control flow.",
			],
		},
	],
	rightNav: {
		href: "/hub/lesson/driving/uni/meet-your-robot",
		label: "Start →",
		variant: "primary",
	},
};

export const uniMeetRobotTask: LessonTaskContent = {
	badge: "Task 1",
	title: "Meet Your Robot",
	description:
		"Differential-drive behavior emerges from independent left and right wheel velocities.",
	sections: [
		{
			title: "Wheel behavior",
			bullets: [
				"Equal wheel velocity and direction yields straight-line translation.",
				"Equal magnitude opposite signs yields in-place rotation.",
				"Unequal wheel velocities produce curved trajectories.",
			],
		},
	],
	leftNav: {
		href: "/hub/lesson/driving/uni",
		label: "← Back",
	},
	rightNav: {
		href: "/hub/lesson/driving/uni/try-it-out",
		label: "Next: Try it out →",
		variant: "primary",
	},
};

export const uniOnYourOwnTask: LessonTaskContent = {
	badge: "Final Task",
	title: "On your own",
	sections: [
		{
			paragraphs: [
				"Place the robot in an open space and maneuver it between two points with deliberate turns.",
				"Whenever you are ready, proceed to the completion page.",
			],
		},
	],
	leftNav: {
		href: "/hub/lesson/driving/uni/try-it-out",
		label: "← Back",
	},
	rightNav: {
		href: "/hub/lesson/driving/uni/completion",
		label: "Proceed to completion →",
		variant: "primary",
	},
};

export const uniCompletionTask: LessonTaskContent = {
	badge: "Completed",
	title: "Lesson complete",
	description: "Great job finishing University Lesson 1: Learning How to Drive.",
	leftNav: {
		href: "/hub/lesson/driving/uni/on-your-own",
		label: "← Back",
	},
	rightNav: {
		href: "/hub/learning",
		label: "Return to Learning →",
		variant: "primary",
	},
};
