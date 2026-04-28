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

export const uniRos2PipelineTask: LessonTaskContent = {
	badge: "Task 3",
	title: "ROS 2 pipeline and Twist control",
	description:
		"This page follows the full path from held keys in the browser to the Twist message that drives the robot.",
	sections: [
		{
			title: "WASD to Twist",
			bullets: [
				"The browser app keeps track of which keys are currently being held down.",
				"W and S become the forward/backward part of the Twist, which goes into linear.x.",
				"A and D become the turning part of the Twist, which goes into angular.z.",
				"The app sends the Twist over a WebSocket to the robot on /diff_drive_base/cmd_vel.",
				"The robot receives that Twist and uses the velocity values inside it to drive its wheels.",
			],
		},
		{
			title: "What happens after Twist",
			paragraphs: [
				"The robot receives the Twist and uses the velocity values inside it to determine what the wheels should do.",
				"The drive controller converts that Twist into left and right wheel velocities using the robot geometry.",
				"Use forward velocity v, angular velocity ω, wheel separation L, and wheel radius r.",
				"Right wheel linear velocity: vR = v + (ωL)/2.",
				"Left wheel linear velocity: vL = v - (ωL)/2.",
				"Wheel angular velocity is the linear velocity divided by r.",
			],
		},
		{
			title: "Geometry and hardware",
			bullets: [
				"The URDF/Xacro defines wheel radius and wheel separation.",
				"The controller YAML must match those geometry values.",
				"The hardware plugin maps wheel joints to motors and converts units.",
			],
		},
		{
			title: "Observing commands",
			bullets: [
				"W should produce positive linear.x and near-zero angular.z.",
				"S should produce negative linear.x.",
				"A should produce positive angular.z with near-zero linear.x.",
				"D should produce negative angular.z with near-zero linear.x.",
			],
		},
	],
	leftNav: {
		href: "/hub/lesson/driving/uni/try-it-out",
		label: "← Back",
	},
	rightNav: {
		href: "/hub/lesson/driving/uni/on-your-own",
		label: "Next: On your own →",
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
		href: "/hub/lesson/driving/uni/ros2-pipeline",
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
