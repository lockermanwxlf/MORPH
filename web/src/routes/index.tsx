import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { apiUrl } from "@/utils/api";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	console.log("api url:", apiUrl);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
			{/* Hero Section */}
			<section className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-slate-800 to-slate-900">
				<div className="max-w-4xl mx-auto text-center">
					<div className="mb-12">
						<h1 className="text-6xl lg:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
							MORPH
						</h1>
						<p className="text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto">
							Modular Open-Source Robotic Programming Hub
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							onClick={() => navigate({ to: "/connect" })}
							className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg"
						>
							Start Learning
						</button>
						<button
							onClick={() => {
								document
									.getElementById("about")
									?.scrollIntoView({ behavior: "smooth" });
							}}
							className="px-8 py-4 bg-transparent hover:bg-slate-700 text-slate-300 font-semibold rounded-lg border border-slate-500 transition"
						>
							Explore MORPH
						</button>
					</div>
				</div>
			</section>

			{/* Info Grid Section */}
			<section id="about" className="py-20 px-4 bg-slate-900">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-3 gap-8">
						{/* About Card */}
						<article className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
							<h3 className="text-2xl font-bold mb-4">About MORPH</h3>
							<p className="text-slate-300">
								MORPH is a modular open-source robotic programming hub designed
								to make robotics accessible, customizable, and scalable for
								students, educators, and hobbyists worldwide.
							</p>
						</article>

						{/* Mission Card */}
						<article
							id="why-us"
							className="bg-slate-800/50 border border-slate-700 rounded-lg p-8"
						>
							<h3 className="text-2xl font-bold mb-4">Our Mission</h3>
							<ul className="space-y-3 text-slate-300">
								<li className="flex items-start">
									<span className="text-teal-400 mr-3">✓</span>
									<span>Democratize robotics education and development</span>
								</li>
								<li className="flex items-start">
									<span className="text-teal-400 mr-3">✓</span>
									<span>Provide modular, extensible hardware and software</span>
								</li>
								<li className="flex items-start">
									<span className="text-teal-400 mr-3">✓</span>
									<span>Foster a collaborative open-source community</span>
								</li>
							</ul>
						</article>

						{/* Shop Card */}
						<article
							id="shop"
							className="bg-slate-800/50 border border-slate-700 rounded-lg p-8"
						>
							<h3 className="text-2xl font-bold mb-4">Shop Our Product</h3>
							<p className="text-slate-300 mb-6">
								Get MORPH base kits, expansion modules, and accessories.
								Pre-configured to work out of the box.
							</p>
							<button
								onClick={() => navigate({ to: "/shop" })}
								className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
							>
								Visit Shop
							</button>
						</article>
					</div>
				</div>
			</section>

			{/* CTA Band Section */}
			<section
				id="schools"
				className="py-20 px-4 bg-gradient-to-r from-teal-900/30 to-blue-900/30 border-t border-slate-700"
			>
				<div className="max-w-3xl mx-auto text-center">
					<h3 className="text-4xl font-bold mb-4">
						Bring MORPH to Your School
					</h3>
					<p className="text-slate-300 text-lg mb-8">
						Curriculum-ready kits, educator guides, and workshops to jumpstart
						robotics programs.
					</p>
					<button
						onClick={() => navigate({ to: "/contact" })}
						className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition shadow-lg text-lg"
					>
						Contact Us
					</button>
				</div>
			</section>
		</div>
	);
}
