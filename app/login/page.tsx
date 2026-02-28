"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const result = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });
            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => { signIn("google", { callbackUrl: "/" }); };

    return (
        <div className="min-h-screen w-full relative bg-off-white overflow-hidden flex flex-col lg:flex-row">
            {/* Left Section */}
            <div
                className="hidden lg:block absolute top-0 left-0 w-[60%] h-full z-0 bg-charcoal-blue"
                style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
            >
                <div className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
                    style={{ backgroundImage: "url('/dispatch_bg.png')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal-blue/90 to-muted-teal/40" />
                <div className="absolute bottom-20 left-12 text-white max-w-md p-8">
                    <h2 className="text-4xl font-bold mb-4 font-sans tracking-tight">Welcome Back</h2>
                    <p className="text-lg text-gray-200 leading-relaxed">
                        Streamline your event operations with powerful tools and real-time insights.
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="w-full lg:w-[45%] ml-auto min-h-screen flex flex-col justify-center items-center p-8 pt-24 z-10 relative">
                <div className="w-full max-w-md space-y-8 bg-white p-10 border-2 border-charcoal-blue shadow-[8px_8px_0px_0px_rgba(31,42,55,0.2)]">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-black text-charcoal-blue tracking-tighter">Log In</h1>
                        <p className="text-sm font-medium text-steel-gray tracking-wide">
                            Don't have an account?{" "}
                            <Link href="/signup" className="font-bold text-muted-teal hover:text-charcoal-blue hover:underline underline-offset-4 transition-all">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold tracking-wide">
                                {error}
                            </div>
                        )}
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold text-charcoal-blue mb-1 tracking-widest">
                                    Email address
                                </label>
                                <input
                                    id="email" name="email" type="email" autoComplete="email" required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="appearance-none relative block w-full px-4 py-3 border-2 border-soft-slate text-charcoal-blue focus:outline-none focus:border-muted-teal focus:ring-0 transition-all font-medium bg-off-white/30 placeholder-steel-gray/50"
                                    placeholder="NAME@COMPANY.COM"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-xs font-bold text-charcoal-blue tracking-widest">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs font-bold text-muted-teal hover:text-charcoal-blue transition-colors tracking-wider">
                                        Forgot password?
                                    </a>
                                </div>
                                <input
                                    id="password" name="password" type="password" autoComplete="current-password" required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="appearance-none relative block w-full px-4 py-3 border-2 border-soft-slate text-charcoal-blue focus:outline-none focus:border-muted-teal focus:ring-0 transition-all font-medium bg-off-white/30 placeholder-steel-gray/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox"
                                className="h-4 w-4 text-muted-teal focus:ring-muted-teal border-gray-300 rounded-none"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-steel-gray tracking-wider">
                                Remember me
                            </label>
                        </div>

                        <button
                            type="submit" disabled={isLoading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border-2 border-charcoal-blue text-sm font-black tracking-widest text-white bg-charcoal-blue hover:bg-muted-teal hover:border-muted-teal focus:outline-none transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 disabled:opacity-70"
                        >
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {isLoading ? "AUTHENTICATING..." : "SIGN IN"}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-soft-slate" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 bg-white text-xs font-bold text-steel-gray tracking-widest">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full inline-flex justify-center py-3 px-4 border-2 border-soft-slate bg-white text-sm font-bold text-charcoal-blue hover:bg-off-white hover:border-charcoal-blue hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all tracking-wide"
                            >
                                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                </svg>
                                Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
